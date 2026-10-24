"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { MIN_CHANNEL_BID, type Channel, type ChannelCategory } from "@/data/channels";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { minBidToOutrank, normalizeUsername, type AddChannelInput, type BidResult } from "@/lib/channels-work";

type AddResult =
  | { ok: true; channel: Channel }
  | { ok: false; reason: "duplicate" | "invalid" | "auth" };

type ChannelsContextValue = {
  ready: boolean;
  channels: Channel[];
  myChannels: Channel[];
  add: (input: AddChannelInput) => AddResult;
  bid: (channelId: string, amount: number) => BidResult;
};

type DbChannel = { id: string; username: string; name: string; category: ChannelCategory; avatarColor: string; createdAt: string; mine?: boolean };
type ChannelsData = { channels: DbChannel[]; bids: Record<string, number> };

const ChannelsContext = createContext<ChannelsContextValue | null>(null);

function sortByBid(list: Channel[]) {
  return [...list].sort((a, b) =>
    b.bidSum !== a.bidSum ? b.bidSum - a.bidSum : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

/** Community channels from the database, with auction bids applied. */
function merge(data: ChannelsData): Channel[] {
  const bids = data.bids ?? {};
  const added: Channel[] = data.channels.map((c) => ({
    id: c.id,
    username: c.username,
    name: c.name,
    category: c.category,
    avatarColor: c.avatarColor,
    createdAt: c.createdAt,
    mine: Boolean(c.mine),
    bidSum: Math.max(MIN_CHANNEL_BID, Number(bids[c.id]) || 0),
  }));
  return sortByBid(added);
}

export function ChannelsProvider({ children }: { children: ReactNode }) {
  const { profile } = useDoctorProfile();
  const profileId = profile?.id ?? null;
  const [data, setData] = useState<ChannelsData>({ channels: [], bids: {} });
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<{ text: string; tone?: "err"; href?: string } | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/channels", { cache: "no-store", credentials: "same-origin" });
      const json = (await res.json()) as { ok?: boolean } & Partial<ChannelsData>;
      if (json.ok) setData({ channels: json.channels ?? [], bids: json.bids ?? {} });
    } catch {
      /* keep seeds */
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch from server on mount / account change
    void reload();
  }, [reload, profileId]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const channels = useMemo(() => merge(data), [data]);
  const myChannels = useMemo(() => channels.filter((c) => c.mine), [channels]);

  const needLogin = useCallback(() => {
    setToast({ text: "Buning uchun avval tizimga kiring.", tone: "err", href: "/kirish?next=/kanallar" });
  }, []);

  const post = useCallback(async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; channel?: DbChannel; minRequired?: number };
  }, []);

  const add = useCallback(
    (input: AddChannelInput): AddResult => {
      if (!profileId) {
        needLogin();
        return { ok: false, reason: "auth" };
      }
      const username = normalizeUsername(input.username);
      if (!username || username.length < 4 || username.length > 33 || !input.category) return { ok: false, reason: "invalid" };
      if (channels.some((c) => c.username.toLowerCase() === username.toLowerCase())) return { ok: false, reason: "duplicate" };
      const optimistic: DbChannel = {
        id: `tmp-${Date.now()}`,
        username,
        name: (input.name ?? "").trim() || username.slice(1),
        category: input.category,
        avatarColor: "#0F766E",
        createdAt: new Date().toISOString(),
        mine: true,
      };
      setData((d) => ({ ...d, channels: [...d.channels, optimistic] }));
      void post("/api/channels", { username, name: input.name ?? "", category: input.category }).then((res) => {
        if (res.ok) setToast({ text: "Kanal qo‘shildi." });
        else setToast({ text: res.error === "duplicate" ? "Bu @username allaqachon ro‘yxatda." : res.error && res.error !== "invalid" ? res.error : "Kanalni qo‘shib bo‘lmadi.", tone: "err" });
        void reload();
      });
      return { ok: true, channel: { ...optimistic, bidSum: MIN_CHANNEL_BID } };
    },
    [channels, needLogin, post, profileId, reload],
  );

  const bid = useCallback(
    (channelId: string, amount: number): BidResult => {
      const target = channels.find((c) => c.id === channelId);
      if (!target || channelId.startsWith("tmp-")) return { ok: false, reason: "not_found", minRequired: MIN_CHANNEL_BID };
      const min = minBidToOutrank(channels, 1);
      const value = Math.floor(Number(amount));
      if (!Number.isFinite(value) || value < min) return { ok: false, reason: "too_low", minRequired: min };
      if (!profileId) {
        needLogin();
        return { ok: false, reason: "not_found", minRequired: min };
      }
      setData((d) => ({ ...d, bids: { ...d.bids, [channelId]: value } }));
      void post("/api/channels/bid", { channelId, amount: value }).then((res) => {
        if (res.ok) setToast({ text: "1-o‘rin. Taklif qabul qilindi." });
        else
          setToast({
            text: res.error === "too_low" ? `Taklif kamida ${(res.minRequired ?? min).toLocaleString("ru-RU")} so‘m bo‘lishi kerak.` : res.error && res.error !== "invalid" && res.error !== "not_found" ? res.error : "Taklifni saqlab bo‘lmadi.",
            tone: "err",
          });
        void reload();
      });
      return { ok: true, channel: { ...target, bidSum: value }, rank: 1 };
    },
    [channels, needLogin, post, profileId, reload],
  );

  const value = useMemo(
    () => ({ ready, channels, add, bid, myChannels }),
    [add, bid, channels, myChannels, ready]
  );

  return (
    <ChannelsContext.Provider value={value}>
      {children}
      {toast ? (
        <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[70] lg:inset-x-auto lg:right-4 lg:bottom-4 lg:w-[min(100%-2rem,380px)]">
          <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-[#CCFBF1] bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.16)] lg:mx-0">
            <div className="flex items-start gap-3">
              <span className={toast.tone === "err" ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626]" : "flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ecfdf3] text-[#16a34a]"}>
                {toast.tone === "err" ? <X className="size-4" strokeWidth={2.5} /> : <Check className="size-4" strokeWidth={2.5} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1a1d26]">{toast.text}</p>
                {toast.href ? (
                  <Link href={toast.href} className="mt-1 inline-block text-[13px] font-semibold text-[#0F766E] hover:underline">
                    Kirish
                  </Link>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-[#8b93a7] hover:text-[#1a1d26]"
                aria-label="Yopish"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ChannelsContext.Provider>
  );
}

export function useChannels() {
  const ctx = useContext(ChannelsContext);
  if (!ctx) throw new Error("useChannels must be used within ChannelsProvider");
  return ctx;
}
