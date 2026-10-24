"use client";

import { useEffect, useMemo, useState, type ComponentType, type FormEvent, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  Clock,
  Crown,
  Drill,
  Gavel,
  Info,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Stethoscope,
  Syringe,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useChannels } from "@/components/channels-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { channelCategories, channelCategoryLabel, type Channel, type ChannelCategory } from "@/data/channels";
import { avatarInitials, minBidToOutrank, telegramUrl } from "@/lib/channels-work";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type SortKey = "popular" | "subs" | "rating" | "new";
type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;
type BidFn = (id: string, amount: number) => { ok: true } | { ok: false; min: number };

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "popular", label: "Eng mashhur" },
  { key: "subs", label: "Obunachilar soni" },
  { key: "rating", label: "Yuqori reyting" },
  { key: "new", label: "Yangi qo‘shilgan" },
];

const DEMO_KEY = "sk-kanallar-demo-bids-v1";
const money = (n: number) => formatMoney(n, "UZS");

function hashOf(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

const seedStats: Record<string, { subs: number; rating: number }> = {
  "ch-implant-clinic": { subs: 8700, rating: 4.8 },
  "ch-endo-pro": { subs: 6200, rating: 4.7 },
  "ch-stom-edu": { subs: 5400, rating: 4.9 },
  "ch-dental-tools": { subs: 4100, rating: 4.6 },
  "ch-clinic-market": { subs: 3600, rating: 4.5 },
  "ch-stom-uz": { subs: 3200, rating: 4.4 },
  "ch-tish-salomat": { subs: 2700, rating: 4.3 },
  "ch-implant-tips": { subs: 1900, rating: 4.6 },
};

function statsOf(c: Channel) {
  const s = seedStats[c.id];
  if (s) return s;
  const h = hashOf(c.id);
  return { subs: 300 + (h % 1500), rating: 4.2 + (h % 6) / 10 };
}

function subsLabel(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : String(n);
}

const bios: Record<ChannelCategory, string> = {
  implantologiya: "Implantologiya bo‘yicha amaliy keyslar, protokollar va yangi texnologiyalar.",
  endodontiya: "Endodontiya: kanal davolash, mikroskop va zamonaviy fayl tizimlari.",
  ortodontiya: "Ortodontiya: breketlar, aligerlar va davolash rejalashtirish bo‘yicha materiallar.",
  marketing: "Klinika marketingi, SMM va bemorlar oqimini oshirish bo‘yicha maslahatlar.",
  talim: "Seminarlar, kurslar va stomatologlar uchun foydali ta’lim materiallari.",
  jihozlar: "Stomatologik jihozlar sharhi, narxlar va yangi mahsulotlar haqida.",
  umumiy: "Stomatologiya yangiliklari, foydali maslahatlar va hamkasblar hamjamiyati.",
};

function readDemo(): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(DEMO_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start live clock after mount (avoids hydration mismatch)
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

/** Demo auction countdown: each channel has a rolling 24h cycle with its own phase. */
function remainingSeconds(id: string, now: number | null) {
  if (now === null) return null;
  const cycle = 86400;
  const t = Math.floor(now / 1000);
  return cycle - ((t + (hashOf(id) % cycle)) % cycle);
}

function clock(sec: number | null) {
  if (sec === null) return "--:--:--";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function parseAmount(value: string) {
  return Number(String(value).replace(/\s/g, "").replace(/,/g, ""));
}

function TelegramLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="32" fill="#0F766E" />
      <path d="M14.5 31.6 46.2 19.4c1.5-.6 2.8.4 2.3 2.6l-5.4 25.4c-.4 1.8-1.5 2.2-3 1.4l-8.3-6.1-4 3.9c-.4.4-.8.8-1.7.8l.6-8.5L43 25.6c.7-.6-.1-1-1-.4l-19 12-8.2-2.6c-1.8-.6-1.8-1.8.4-2.6Z" fill="#fff" />
    </svg>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medal =
    rank === 1
      ? { ring: "from-[#ffe08a] to-[#f5a623]", crown: "text-[#f5a623]", fill: "#f5a623" }
      : rank === 2
        ? { ring: "from-[#e2e8f0] to-[#94a3b8]", crown: "text-[#94a3b8]", fill: "#94a3b8" }
        : rank === 3
          ? { ring: "from-[#fbbf24] to-[#b45309]", crown: "text-[#c2410c]", fill: "#d97706" }
          : null;
  if (!medal) {
    return <span className="grid size-10 place-items-center rounded-full bg-[#eaf2ff] text-[16px] font-extrabold text-[#0F766E]">{rank}</span>;
  }
  return (
    <span className="relative inline-flex flex-col items-center">
      <Crown className={cn("absolute -top-3.5 size-5", medal.crown)} fill={medal.fill} strokeWidth={1.5} />
      <span className={cn("grid size-11 place-items-center rounded-full bg-gradient-to-b text-[18px] font-extrabold text-white shadow-[0_3px_8px_rgba(17, 24, 39, 0.18)]", medal.ring)}>
        {rank}
      </span>
    </span>
  );
}

function Avatar({ channel, size = 48 }: { channel: Channel; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: channel.avatarColor, fontSize: size * 0.33 }}
      aria-hidden
    >
      {avatarInitials(channel)}
    </span>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1.5 text-[13px] text-[#1a1d26]">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#0F766E]/30",
          checked ? "border-[#0F766E] bg-[#0F766E]" : "border-[#cfd6e4] bg-white",
        )}
      >
        {checked ? <Check className="size-3 text-white" strokeWidth={3} /> : null}
      </span>
      {label}
    </label>
  );
}

function ChannelRow({ channel, rank, now, onBid }: { channel: Channel; rank: number; now: number | null; onBid: () => void }) {
  const st = statsOf(channel);
  return (
    <article
      className={cn(
        "flex items-center gap-4 rounded-2xl border bg-white px-4 py-3.5 shadow-[0_2px_10px_rgba(17, 24, 39, 0.04)]",
        rank === 1 ? "border-[#f5c84c]/70 ring-1 ring-[#f5c84c]/40" : "border-[#eceff5]",
      )}
    >
      <div className="grid w-[52px] shrink-0 place-items-center">
        <RankBadge rank={rank} />
      </div>
      <Avatar channel={channel} size={52} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[15px] font-bold text-[#1a1d26]">{channel.name}</p>
          <span className="rounded-full bg-[#F0FDFA] px-2.5 py-[3px] text-[10.5px] leading-none font-semibold text-[#0F766E]">
            {channelCategoryLabel[channel.category]}
          </span>
          {channel.mine ? <span className="rounded-full bg-[#e6f7ed] px-2 py-[3px] text-[10.5px] leading-none font-semibold text-[#16a34a]">Mening kanalim</span> : null}
        </div>
        <p className="mt-0.5 truncate text-[12.5px] font-medium text-[#0F766E]">{channel.username}</p>
        <p className="mt-1 line-clamp-1 text-[12px] text-[#6b7488]">{bios[channel.category]}</p>
      </div>
      <div className="flex shrink-0 items-center gap-4 text-center">
        <div className="leading-tight">
          <p className="inline-flex items-center gap-1 text-[14px] font-bold text-[#1a1d26]">
            <Users className="size-3.5 text-[#8b93a7]" />
            {subsLabel(st.subs)}
          </p>
          <p className="text-[10.5px] text-[#8b93a7]">obunachi</p>
        </div>
        <div className="leading-tight">
          <p className="inline-flex items-center gap-1 text-[14px] font-bold text-[#1a1d26]">
            <Star className="size-3.5 fill-[#f5b942] text-[#f5b942]" />
            {st.rating.toFixed(1)}
          </p>
          <p className="text-[10.5px] text-[#8b93a7]">reyting</p>
        </div>
      </div>
      <div className="w-[142px] shrink-0 border-l border-[#eceff5] pl-4 leading-tight">
        <p className="text-[10.5px] text-[#8b93a7]">Joriy stavka</p>
        <p className="text-[15px] font-extrabold whitespace-nowrap text-[#0F766E]">{money(channel.bidSum)}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold tabular-nums text-[#e5484d]">
          <Clock className="size-3" />
          {clock(remainingSeconds(channel.id, now))}
        </p>
      </div>
      <div className="flex w-[132px] shrink-0 flex-col gap-1.5">
        <a
          href={telegramUrl(channel.username)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-[#F0FDFA] bg-white px-3 text-[12.5px] font-semibold text-[#0F766E] hover:bg-[#f5f8ff]"
        >
          <UserPlus className="size-3.5" />
          Obuna bo‘lish
        </a>
        <button
          type="button"
          onClick={onBid}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-[#0F766E] px-3 text-[12.5px] font-semibold text-white shadow-[0_3px_10px_rgba(15, 118, 110, 0.25)] hover:bg-[#115E59]"
        >
          O‘rinni olish
        </button>
      </div>
    </article>
  );
}

function QuickBid({
  channels,
  minTop,
  onBid,
  onOpen,
}: {
  channels: Channel[];
  minTop: number;
  onBid: BidFn;
  onOpen: (c: Channel) => void;
}) {
  const mine = channels.filter((c) => c.mine);
  const options = mine.length > 0 ? mine : channels.slice(0, 5);
  const [selectedId, setSelectedId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const selected = options.find((c) => c.id === selectedId) ?? options[0] ?? null;
  const shown = amount === "" ? String(minTop) : amount;

  function submit() {
    if (!selected) {
      setError("Avval kanal qo‘shing.");
      return;
    }
    const res = onBid(selected.id, parseAmount(shown));
    if (!res.ok) {
      setError(`Stavka kamida ${money(res.min)} bo‘lishi kerak.`);
      onOpen(selected);
      return;
    }
    setError("");
    setAmount("");
  }

  return (
    <section className="rounded-2xl border border-[#F0FDFA] bg-gradient-to-br from-[#f3f8ff] to-white p-4 shadow-[0_2px_10px_rgba(15, 118, 110, 0.08)]">
      <h3 className="text-[15px] leading-snug font-bold text-[#111827]">Kanalingizni 1-o‘ringa chiqaring</h3>
      <p className="mt-1 text-[12px] text-[#6b7488]">
        Minimal stavka: <span className="font-bold text-[#0F766E]">{money(minTop)}</span>
      </p>
      <label className="relative mt-3 block">
        <select
          value={selected?.id ?? ""}
          onChange={(e) => setSelectedId(e.target.value)}
          aria-label="Kanal"
          className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-[#e6eaf2] bg-white pr-8 pl-3 text-[13px] font-medium text-[#1a1d26] outline-none focus:border-[#0F766E]"
        >
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.username}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-[#8b93a7]" />
      </label>
      <div className="relative mt-2">
        <input
          type="text"
          inputMode="numeric"
          value={shown}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Stavka (so‘m)"
          className="h-11 w-full rounded-xl border border-[#e6eaf2] bg-white pr-14 pl-3.5 text-[14px] font-bold text-[#1a1d26] outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15"
        />
        <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[12px] text-[#8b93a7]">so‘m</span>
      </div>
      {error ? <p className="mt-2 text-[12px] font-medium text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={submit}
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] text-[14px] font-semibold text-white shadow-[0_4px_12px_rgba(15, 118, 110, 0.28)] hover:bg-[#115E59]"
      >
        <Gavel className="size-4" />
        Stavka berish
      </button>
      <p className="mt-2 text-center text-[10.5px] text-[#9aa3b2]">Demo rejim — haqiqiy to‘lov yo‘q.</p>
    </section>
  );
}

function BidModal({
  channel,
  minTop,
  now,
  onClose,
  onBid,
}: {
  channel: Channel;
  minTop: number;
  now: number | null;
  onClose: () => void;
  onBid: BidFn;
}) {
  const [amount, setAmount] = useState(String(minTop));
  const [error, setError] = useState("");
  const value = parseAmount(amount);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const res = onBid(channel.id, value);
    if (res.ok) onClose();
    else setError(`Stavka kamida ${money(res.min)} bo‘lishi kerak.`);
  }

  const cell = (label: string, content: ReactNode, tone = "text-[#1a1d26]") => (
    <div className="rounded-xl border border-[#eceff5] bg-[#f8fafd] px-3 py-2.5 leading-tight">
      <p className="text-[10.5px] text-[#8b93a7]">{label}</p>
      <p className={cn("mt-1 text-[14px] font-extrabold tabular-nums", tone)}>{content}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kanal-bid-title"
        className="w-full max-w-[480px] rounded-2xl bg-white p-6 shadow-[0_24px_64px_rgba(17, 24, 39, 0.3)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="kanal-bid-title" className="text-[19px] font-extrabold text-[#111827]">
            1-o‘rin uchun stavka berish
          </h2>
          <button type="button" onClick={onClose} aria-label="Yopish" className="rounded-lg p-1 text-[#8b93a7] hover:bg-[#f5f7fb] hover:text-[#1a1d26]">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#eceff5] p-3">
          <Avatar channel={channel} size={44} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[14px] font-bold text-[#1a1d26]">{channel.username}</p>
            <p className="truncate text-[12.5px] text-[#8b93a7]">{channel.name}</p>
          </div>
          <span className="rounded-full bg-[#F0FDFA] px-2.5 py-1 text-[11px] font-semibold text-[#0F766E]">{channelCategoryLabel[channel.category]}</span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {cell("Joriy stavka", money(channel.bidSum))}
          {cell("Keyingi minimal stavka", money(minTop), "text-[#0F766E]")}
          {cell("Qolgan vaqt", clock(remainingSeconds(channel.id, now)), "text-[#e5484d]")}
        </div>

        <label className="mt-4 block text-[12.5px] font-semibold text-[#1a1d26]">
          Sizning taklifingiz (so‘m)
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError("");
            }}
            autoFocus
            className="mt-1.5 h-12 w-full rounded-xl border border-[#F0FDFA] bg-white px-4 text-[17px] font-extrabold text-[#1a1d26] outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15"
          />
        </label>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {[10000, 20000, 50000, 100000].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setAmount(String((Number.isFinite(value) && value >= minTop ? value : minTop) + n));
                setError("");
              }}
              className="h-9 rounded-lg border border-[#F0FDFA] bg-[#f5f8ff] text-[12px] font-semibold text-[#0F766E] hover:bg-[#eaf2ff]"
            >
              + {n.toLocaleString("ru-RU")}
            </button>
          ))}
        </div>
        {error ? <p className="mt-2 text-[12.5px] font-medium text-red-600">{error}</p> : null}

        <div className="mt-4 flex gap-2.5 rounded-xl bg-[#eef5ff] p-3">
          <Info className="mt-0.5 size-4 shrink-0 text-[#0F766E]" />
          <p className="text-[12px] leading-snug text-[#111827]">
            Agar kimdir stavkangizdan oshirsa, siz bu haqda xabardor qilinasiz. Eng yuqori stavka 1-o‘rinni egallaydi.
          </p>
        </div>

        <div className="mt-5 flex gap-2.5">
          <button type="button" onClick={onClose} className="h-11 flex-1 rounded-xl border border-[#e6eaf2] bg-white text-[14px] font-semibold text-[#4b5568] hover:bg-slate-50">
            Bekor
          </button>
          <button
            type="submit"
            className="inline-flex h-11 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-[#0F766E] text-[14px] font-semibold text-white shadow-[0_4px_12px_rgba(15, 118, 110, 0.28)] hover:bg-[#115E59]"
          >
            <Gavel className="size-4" />
            Stavka berish
          </button>
        </div>
        <p className="mt-2.5 text-center text-[10.5px] text-[#9aa3b2]">Demo rejim: stavka faqat brauzerda saqlanadi, haqiqiy to‘lov amalga oshirilmaydi.</p>
      </form>
    </div>
  );
}

export function KanallarDesktop({ onAdd }: { onAdd: () => void }) {
  const { channels: base, myChannels, bid } = useChannels();
  const { profile } = useDoctorProfile();
  const now = useNow();
  const [demo, setDemo] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ChannelCategory | "">("");
  const [sort, setSort] = useState<SortKey>("popular");
  const [panel, setPanel] = useState(false);
  const [onlyMine, setOnlyMine] = useState(false);
  const [onlyTop, setOnlyTop] = useState(false);
  const [bidTarget, setBidTarget] = useState<Channel | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate demo bids from localStorage after mount
    setDemo(readDemo());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Auction order: provider bids merged with local demo bids.
  const channels = useMemo(() => {
    const merged = base.map((c) => ({ ...c, bidSum: Math.max(c.bidSum, Number(demo[c.id]) || 0) }));
    return merged.sort((a, b) =>
      b.bidSum !== a.bidSum ? b.bidSum - a.bidSum : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [base, demo]);

  const ranks = useMemo(() => new Map(channels.map((c, i) => [c.id, i + 1])), [channels]);
  const minTop = minBidToOutrank(channels, 1);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    const rows = channels.filter((c) => {
      if (category && c.category !== category) return false;
      if (onlyMine && !c.mine) return false;
      if (onlyTop && statsOf(c).rating < 4.7) return false;
      if (!q) return true;
      return `${c.username} ${c.name} ${channelCategoryLabel[c.category]}`.toLowerCase().includes(q);
    });
    if (sort === "subs") rows.sort((a, b) => statsOf(b).subs - statsOf(a).subs);
    else if (sort === "rating") rows.sort((a, b) => statsOf(b).rating - statsOf(a).rating || statsOf(b).subs - statsOf(a).subs);
    else if (sort === "new") rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return rows;
  }, [channels, query, category, sort, onlyMine, onlyTop]);

  const weekly = useMemo(() => [...channels].sort((a, b) => statsOf(b).subs - statsOf(a).subs).slice(0, 5), [channels]);

  const tabs: { id: ChannelCategory | ""; label: string }[] = [{ id: "", label: "Barchasi" }, ...channelCategories.map((c) => ({ id: c.id, label: c.label }))];
  const extraOn = Number(onlyMine) + Number(onlyTop);

  /** Demo bid: kept in localStorage (no real payment). Signed-in users' bids are also forwarded to the existing bid API. */
  const placeBid: BidFn = (channelId, amount) => {
    const value = Math.floor(amount);
    if (!Number.isFinite(value) || value < minTop) return { ok: false, min: minTop };
    const next = { ...demo, [channelId]: value };
    setDemo(next);
    try {
      window.localStorage.setItem(DEMO_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    if (profile) bid(channelId, value);
    const target = channels.find((c) => c.id === channelId);
    setToast(`${target?.username ?? "Kanal"} — 1-o‘rin! Stavka: ${money(value)} (demo).`);
    return { ok: true };
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F766E] via-[#0F766E] to-[#0F766E] shadow-[0_10px_30px_rgba(15, 118, 110, 0.28)]">
        <div className="pointer-events-none absolute -top-16 -right-10 size-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -right-24 -bottom-24 size-72 rounded-full bg-white/10" />
        <div className="relative z-10 flex min-h-[148px] items-center gap-6 px-7 py-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-[30px] leading-tight font-extrabold tracking-tight text-white">Foydali kanallar</h1>
            <p className="mt-1.5 max-w-[540px] text-[14px] leading-snug text-white/85">
              Stomatologlar uchun eng yaxshi Telegram kanallar va manbalar. TOP o‘rinlar auksion orqali sotiladi.
            </p>
            <button
              type="button"
              onClick={onAdd}
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-[14px] font-semibold text-[#0F766E] shadow-[0_6px_16px_rgba(17, 24, 39, 0.2)] transition-colors hover:bg-[#f3f8ff]"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              Kanal qo‘shish
            </button>
          </div>
          <div className="relative hidden h-[130px] w-[330px] shrink-0 min-[1200px]:block" aria-hidden>
            <TelegramLogo className="absolute top-1/2 left-[96px] size-[104px] -translate-y-1/2 drop-shadow-[0_10px_18px_rgba(17, 24, 39, 0.35)]" />
            {(
              [
                { Icon: Drill, cls: "left-2 top-3 -rotate-12 size-12" },
                { Icon: Syringe, cls: "left-4 bottom-2 rotate-12 size-11" },
                { Icon: Stethoscope, cls: "right-8 top-2 rotate-6 size-12" },
              ] as { Icon: IconType; cls: string }[]
            ).map(({ Icon, cls }) => (
              <span key={cls} className={cn("absolute grid place-items-center rounded-2xl bg-white/15 p-2.5 text-white backdrop-blur-sm", cls)}>
                <Icon className="size-full" strokeWidth={1.6} />
              </span>
            ))}
            <span className="absolute right-0 bottom-3 grid size-11 place-items-center rounded-full bg-white/20 text-white backdrop-blur-sm">
              <Users className="size-5" />
            </span>
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_296px] items-start gap-4">
        <div className="min-w-0">
          {/* Category pills */}
          <div className="mb-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((t) => (
              <button
                key={t.id || "all"}
                type="button"
                aria-pressed={category === t.id}
                onClick={() => setCategory(t.id)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-[7px] text-[13px] font-semibold transition-colors",
                  category === t.id
                    ? "border-[#0F766E] bg-[#0F766E] text-white shadow-[0_4px_12px_rgba(15, 118, 110, 0.28)]"
                    : "border-[#e6eaf2] bg-white text-[#4b5568] hover:border-[#0F766E]/40",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search + filters + sort */}
          <div className="relative mb-3 flex items-center gap-2">
            <label className="relative flex h-11 min-w-0 flex-1 items-center">
              <Search className="pointer-events-none absolute left-3.5 size-[17px] text-[#8b93a7]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Kanal nomi yoki @username bo‘yicha qidirish"
                className="h-full w-full rounded-xl border border-[#e6eaf2] bg-white pr-3 pl-10 text-[13.5px] text-[#1a1d26] outline-none placeholder:text-[#9aa3b2] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15"
              />
            </label>
            <button
              type="button"
              onClick={() => setPanel((v) => !v)}
              aria-expanded={panel}
              className={cn(
                "relative inline-flex h-11 items-center gap-2 rounded-xl border bg-white px-4 text-[13px] font-semibold transition-colors",
                panel || extraOn ? "border-[#0F766E] bg-[#f3f8ff] text-[#0F766E]" : "border-[#e6eaf2] text-[#1a1d26] hover:bg-slate-50",
              )}
            >
              <SlidersHorizontal className="size-4" />
              Filtrlar
              {extraOn ? (
                <span className="absolute -top-1.5 -right-1.5 grid size-[18px] place-items-center rounded-full bg-[#0F766E] text-[10px] font-bold text-white">{extraOn}</span>
              ) : null}
            </button>
            <label className="relative inline-flex h-11 items-center gap-1.5 rounded-xl border border-[#e6eaf2] bg-white pr-8 pl-3.5 text-[13px] text-[#8b93a7]">
              Saralash:
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label="Saralash"
                className="cursor-pointer appearance-none bg-transparent font-semibold text-[#1a1d26] outline-none"
              >
                {sortOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 size-4 text-[#8b93a7]" />
            </label>
            {panel ? (
              <div className="absolute top-full right-0 z-20 mt-2 w-[260px] rounded-xl border border-[#eceff5] bg-white p-4 shadow-[0_12px_36px_rgba(17, 24, 39, 0.14)]">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[14px] font-bold text-[#111827]">Qo‘shimcha filtrlar</p>
                  <button type="button" onClick={() => setPanel(false)} aria-label="Yopish" className="text-[#8b93a7] hover:text-[#1a1d26]">
                    <X className="size-4" />
                  </button>
                </div>
                <Toggle label={`Faqat mening kanallarim (${myChannels.length})`} checked={onlyMine} onChange={() => setOnlyMine((v) => !v)} />
                <Toggle label="Reyting 4.7 va yuqori" checked={onlyTop} onChange={() => setOnlyTop((v) => !v)} />
                <button
                  type="button"
                  onClick={() => {
                    setOnlyMine(false);
                    setOnlyTop(false);
                    setCategory("");
                    setQuery("");
                  }}
                  className="mt-3 text-[12.5px] font-semibold text-[#0F766E] hover:underline"
                >
                  Barchasini tozalash
                </button>
              </div>
            ) : null}
          </div>

          {/* Channel list */}
          <div className="space-y-2.5">
            {list.map((c) => (
              <ChannelRow key={c.id} channel={c} rank={ranks.get(c.id) ?? 0} now={now} onBid={() => setBidTarget(c)} />
            ))}
            {list.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#e6eaf2] bg-white py-12 text-center text-[14px] text-[#8b93a7]">Kanallar topilmadi</p>
            ) : null}
          </div>
        </div>

        {/* Right column */}
        <aside className="space-y-3">
          <QuickBid channels={channels} minTop={minTop} onBid={placeBid} onOpen={setBidTarget} />

          <section className="rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_10px_rgba(17, 24, 39, 0.04)]">
            <h3 className="mb-3 text-[14px] font-bold text-[#111827]">Auksion qanday ishlaydi?</h3>
            <ol className="space-y-2.5">
              {[
                "Kanalingizni platformaga qo‘shing.",
                "1-o‘rin uchun stavka bering.",
                "Eng yuqori stavka — eng yuqori o‘rin.",
                "Boshqa kanal stavkangizdan oshsa, o‘rin almashadi.",
              ].map((t, i) => (
                <li key={t} className="flex items-start gap-2.5">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#eaf2ff] text-[12px] font-bold text-[#0F766E]">{i + 1}</span>
                  <span className="pt-0.5 text-[12.5px] leading-snug text-[#4b5568]">{t}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_10px_rgba(17, 24, 39, 0.04)]">
            <h3 className="mb-3 text-[14px] font-bold text-[#111827]">Haftalik TOP kanallar</h3>
            <ul className="space-y-2.5">
              {weekly.map((c, i) => (
                <li key={c.id} className="flex items-center gap-2.5">
                  <span className="w-3 shrink-0 text-center text-[13px] font-bold text-[#0F766E]">{i + 1}</span>
                  <Avatar channel={c} size={34} />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-[12.5px] font-semibold text-[#1a1d26]">{c.username}</span>
                    <span className="block truncate text-[11px] text-[#8b93a7]">{c.name}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#1a1d26]">
                    <Users className="size-3 text-[#8b93a7]" />
                    {subsLabel(statsOf(c).subs)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {bidTarget ? (
        <BidModal
          key={bidTarget.id}
          channel={channels.find((c) => c.id === bidTarget.id) ?? bidTarget}
          minTop={minTop}
          now={now}
          onClose={() => setBidTarget(null)}
          onBid={placeBid}
        />
      ) : null}

      {toast ? (
        <div role="status" className="fixed right-5 bottom-5 z-[80] flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-3 text-[13px] font-medium text-white shadow-[0_12px_32px_rgba(17, 24, 39, 0.3)]">
          <Check className="size-4 text-[#4ade80]" strokeWidth={3} />
          {toast}
        </div>
      ) : null}
    </div>
  );
}
