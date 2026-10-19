"use client";

/* eslint-disable react-hooks/set-state-in-effect -- data loading effects kick off async fetches */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Package, X } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import type { SurplusListing } from "@/data/surplus";
import { listingFromDb, type DbSurplus, type InterestStatus, type PublishSurplusInput, type SurplusInterest } from "@/lib/surplus-work";
import { api } from "@/lib/work-client";

export type ActionResult = { ok: true } | { ok: false; error: string; errors?: Record<string, string>; status?: number };

type Ctx = {
  ready: boolean;
  authed: boolean;
  /** Public feed (published, moderated). */
  feed: SurplusListing[];
  /** My listings in every moderation state. */
  mine: SurplusListing[];
  /** Contact requests I sent / received. */
  outgoing: SurplusInterest[];
  incoming: SurplusInterest[];
  getById: (id: string) => SurplusListing | undefined;
  publish: (input: PublishSurplusInput, id?: string) => Promise<ActionResult>;
  setListing: (id: string, action: "close" | "open" | "delete") => Promise<ActionResult>;
  sendInterest: (listingId: string, input: { name: string; phone: string; message: string }) => Promise<ActionResult>;
  setInterest: (id: string, status: InterestStatus) => Promise<ActionResult>;
  refresh: () => Promise<void>;
};

const SurplusCtx = createContext<Ctx | null>(null);

export function SurplusWorkProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile, ready: profileReady } = useDoctorProfile();
  const active = pathname.startsWith("/ortiqcha-material");
  const userId = profile?.id ?? null;
  const [feed, setFeed] = useState<SurplusListing[]>([]);
  const [mine, setMine] = useState<SurplusListing[]>([]);
  const [outgoing, setOutgoing] = useState<SurplusInterest[]>([]);
  const [incoming, setIncoming] = useState<SurplusInterest[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<{ text: string; href?: string; hrefLabel?: string } | null>(null);

  const loadFeed = useCallback(async () => {
    const res = await api<{ listings: DbSurplus[] }>("/api/work/surplus");
    const rows = res.ok ? (res.data.listings ?? []).map(listingFromDb) : [];
    setFeed(rows);
    setReady(true);
  }, []);

  const loadPrivate = useCallback(async () => {
    const [m, i] = await Promise.all([
      api<{ listings: DbSurplus[] }>("/api/work/surplus/mine"),
      api<{ outgoing: SurplusInterest[]; incoming: SurplusInterest[] }>("/api/work/surplus/interests"),
    ]);
    if (m.ok) setMine((m.data.listings ?? []).map(listingFromDb));
    if (i.ok) {
      setOutgoing(i.data.outgoing ?? []);
      setIncoming(i.data.incoming ?? []);
    }
  }, []);

  useEffect(() => {
    if (active) void loadFeed();
  }, [active, loadFeed, userId]);

  useEffect(() => {
    if (!active || !profileReady || !userId) return;
    void loadPrivate();
  }, [active, profileReady, userId, loadPrivate]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const refresh = useCallback(async () => {
    await Promise.all([loadFeed(), userId ? loadPrivate() : Promise.resolve()]);
  }, [loadFeed, loadPrivate, userId]);

  const publish = useCallback(
    async (input: PublishSurplusInput, id?: string): Promise<ActionResult> => {
      const res = await api("/api/work/surplus/mine", { body: { ...input, id } });
      if (!res.ok) return { ok: false, error: res.error, errors: res.errors, status: res.status };
      setToast(
        id
          ? { text: "E’lon yangilandi." }
          : { text: "E’lon yuborildi. Admin tasdiqlagach hamma ko‘radi.", href: "/ortiqcha-material/elonlarim", hrefLabel: "Mening e’lonlarim" },
      );
      void refresh();
      return { ok: true };
    },
    [refresh],
  );

  const setListing = useCallback(
    async (id: string, action: "close" | "open" | "delete"): Promise<ActionResult> => {
      const res = await api(`/api/work/surplus/${id}`, { body: { action } });
      if (!res.ok) return { ok: false, error: res.error, status: res.status };
      setToast({ text: action === "delete" ? "E’lon o‘chirildi." : action === "close" ? "E’lon yopildi." : "E’lon qayta ochildi." });
      void refresh();
      return { ok: true };
    },
    [refresh],
  );

  const sendInterest = useCallback(
    async (listingId: string, input: { name: string; phone: string; message: string }): Promise<ActionResult> => {
      const res = await api("/api/work/surplus/interests", { body: { listingId, ...input } });
      if (!res.ok) return { ok: false, error: res.error, errors: res.errors, status: res.status };
      void loadPrivate();
      return { ok: true };
    },
    [loadPrivate],
  );

  const setInterest = useCallback(
    async (id: string, status: InterestStatus): Promise<ActionResult> => {
      const res = await api(`/api/work/surplus/interests/${id}`, { body: { status } });
      if (!res.ok) return { ok: false, error: res.error, status: res.status };
      await loadPrivate();
      return { ok: true };
    },
    [loadPrivate],
  );

  const value = useMemo<Ctx>(
    () => ({
      ready: ready && profileReady,
      authed: Boolean(userId),
      feed,
      mine: userId ? mine : [],
      outgoing: userId ? outgoing : [],
      incoming: userId ? incoming : [],
      getById: (id) => feed.find((item) => item.id === id) ?? mine.find((item) => item.id === id),
      publish,
      setListing,
      sendInterest,
      setInterest,
      refresh,
    }),
    [feed, incoming, mine, outgoing, profileReady, publish, ready, refresh, sendInterest, setInterest, setListing, userId],
  );

  return (
    <SurplusCtx.Provider value={value}>
      {children}
      {toast ? (
        <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[70] lg:inset-x-auto lg:right-4 lg:bottom-4 lg:w-[min(100%-2rem,380px)]">
          <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-[#d7e4ff] bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.16)] lg:mx-0">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ecfdf3] text-[#16a34a]">
                <Check className="size-4" strokeWidth={2.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1a1d26]">{toast.text}</p>
                {toast.href ? (
                  <Link href={toast.href} className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0066FF] hover:underline">
                    <Package className="size-3.5" />
                    {toast.hrefLabel}
                  </Link>
                ) : null}
              </div>
              <button type="button" onClick={() => setToast(null)} className="text-[#8b93a7] hover:text-[#1a1d26]" aria-label="Yopish">
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SurplusCtx.Provider>
  );
}

export function useSurplusWork() {
  const ctx = useContext(SurplusCtx);
  if (!ctx) throw new Error("useSurplusWork must be used within SurplusWorkProvider");
  return ctx;
}
