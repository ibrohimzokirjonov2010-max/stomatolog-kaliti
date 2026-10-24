"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  Crown,
  Lightbulb,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  TrendingUp,
  X,
} from "lucide-react";
import { KanallarDesktop } from "@/components/kanallar-desktop";
import { useChannels } from "@/components/channels-provider";
import {
  channelCategories,
  channelCategoryLabel,
  type Channel,
  type ChannelCategory,
} from "@/data/channels";
import { avatarInitials, minBidToOutrank, normalizeUsername, telegramUrl } from "@/lib/channels-work";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

function money(n: number) {
  return formatMoney(n, "UZS");
}

function parseAmount(value: string) {
  return Number(String(value).replace(/\s/g, "").replace(/,/g, ""));
}

const inputCls =
  "mt-1 h-11 w-full rounded-xl border border-[#eceff5] px-3.5 text-[14px] text-[#1a1d26] outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Crown className="size-5 text-[#f5a623]" fill="#f5a623" strokeWidth={1.5} />
        <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-b from-[#ffd76a] to-[#f5a623] text-[12px] font-bold text-white shadow-sm">
          1
        </span>
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Crown className="size-4 text-[#94a3b8]" fill="#94a3b8" strokeWidth={1.5} />
        <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-b from-[#cbd5e1] to-[#94a3b8] text-[12px] font-bold text-white shadow-sm">
          2
        </span>
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Crown className="size-4 text-[#c2410c]" fill="#d97706" strokeWidth={1.5} />
        <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-b from-[#fbbf24] to-[#b45309] text-[12px] font-bold text-white shadow-sm">
          3
        </span>
      </span>
    );
  }
  return (
    <span className="flex size-7 items-center justify-center rounded-full bg-[#f1f4f9] text-[12px] font-bold text-[#8b93a7]">
      {rank}
    </span>
  );
}

function ChannelAvatar({ channel, size = 44 }: { channel: Channel; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: channel.avatarColor, fontSize: size * 0.32 }}
      aria-hidden
    >
      {avatarInitials(channel)}
    </span>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-[13px] font-medium text-[#1a1d26]">
      {label}
      {children}
    </label>
  );
}

function AddChannelDialog({ onClose }: { onClose: () => void }) {
  const { add } = useChannels();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ChannelCategory | "">("");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!category) {
      setError("Yo‘nalishni tanlang.");
      return;
    }
    const res = add({ username, name, category });
    if (res.ok) onClose();
    else
      setError(
        res.reason === "duplicate"
          ? "Bu @username allaqachon ro‘yxatda."
          : res.reason === "auth"
            ? "Kanal qo‘shish uchun avval tizimga kiring."
            : "@username va yo‘nalish majburiy."
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kanal-add-title"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="kanal-add-title" className="text-lg font-bold text-[#1a1d26]">
              Kanal qo‘shish
            </h2>
            <p className="mt-0.5 text-[13px] text-[#8b93a7]">
              Telegram kanalingizni auksion ro‘yxatiga qo‘shing.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8b93a7] hover:bg-[#f5f7fb] hover:text-[#1a1d26]"
            aria-label="Yopish"
          >
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3.5">
          <Field label="@username">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => {
                const n = normalizeUsername(username);
                if (n) setUsername(n);
              }}
              placeholder="@kanal_nomi"
              className={inputCls}
              autoComplete="off"
            />
          </Field>
          <Field label="Ko‘rsatiladigan nom (ixtiyoriy)">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Implant Klinikasi"
              className={inputCls}
            />
          </Field>
          <Field label="Yo‘nalish">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ChannelCategory | "")}
              className={cn(inputCls, "bg-white")}
            >
              <option value="">Tanlang…</option>
              {channelCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          {error ? <p className="text-[13px] font-medium text-red-600">{error}</p> : null}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-xl border border-[#eceff5] text-sm font-semibold text-[#4b5568]"
            >
              Bekor
            </button>
            <button
              type="submit"
              className="h-11 flex-1 rounded-xl bg-[#0F766E] text-sm font-semibold text-white shadow-[0_4px_12px_rgba(15,118,110,0.28)]"
            >
              Qo‘shish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BidDialog({ channel, onClose }: { channel: Channel; onClose: () => void }) {
  const { bid, channels } = useChannels();
  const minTop = minBidToOutrank(channels, 1);
  const [amount, setAmount] = useState(String(Math.max(minTop, channel.bidSum + 1)));
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const res = bid(channel.id, parseAmount(amount));
    if (res.ok) onClose();
    else
      setError(
        res.reason === "too_low"
          ? `Taklif kamida ${money(res.minRequired)} bo‘lishi kerak.`
          : "Kanal topilmadi."
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kanal-bid-title"
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="kanal-bid-title" className="text-lg font-bold text-[#1a1d26]">
              O‘rinni olish
            </h2>
            <p className="mt-0.5 text-[13px] text-[#8b93a7]">
              {channel.username} — joriy taklif {money(channel.bidSum)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8b93a7] hover:bg-[#f5f7fb]"
            aria-label="Yopish"
          >
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3.5">
          <Field label="Taklif (so‘m)">
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(minTop)}
              className={cn(inputCls, "font-semibold")}
            />
          </Field>
          <p className="text-[12px] text-[#8b93a7]">
            1-o‘rin uchun kamida <span className="font-semibold text-[#1a1d26]">{money(minTop)}</span>
          </p>
          {error ? <p className="text-[13px] font-medium text-red-600">{error}</p> : null}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-xl border border-[#eceff5] text-sm font-semibold text-[#4b5568]"
            >
              Bekor
            </button>
            <button
              type="submit"
              className="h-11 flex-1 rounded-xl bg-[#0F766E] text-sm font-semibold text-white shadow-[0_4px_12px_rgba(15,118,110,0.28)]"
            >
              To‘lash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function openTelegram(channel: Channel) {
  window.open(telegramUrl(channel.username), "_blank", "noopener,noreferrer");
}

function MobileCard({ channel, rank, onBid }: { channel: Channel; rank: number; onBid: () => void }) {
  return (
    <article data-testid="kanal-card" className="rounded-2xl border border-[#eceff5] bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-2.5">
        <div className="flex w-7 shrink-0 justify-center pt-2.5">
          <RankBadge rank={rank} />
        </div>
        <div className="relative shrink-0">
          <ChannelAvatar channel={channel} size={42} />
          <span className="absolute -right-1 -bottom-1 grid size-[18px] place-items-center rounded-full bg-[#229ED9] text-white ring-2 ring-white">
            <Send className="size-2.5" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] leading-tight font-bold text-[#0F766E]">{channel.username}</p>
          <span className="mt-1 inline-block rounded-md bg-[#F0FDFA] px-2 py-[3px] text-[11px] leading-none font-semibold text-[#0F766E]">
            {channelCategoryLabel[channel.category]}
          </span>
          <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-[#8b93a7]">
            <Send className="size-3" />
            Telegram kanal{channel.mine ? " · Mening kanalim" : ""}
          </p>
        </div>
        <button type="button" onClick={onBid} aria-label="O‘rinni olish" className="flex shrink-0 items-center gap-0.5 text-right">
          <span className="block">
            <span className="block text-[10.5px] text-[#8b93a7]">Eng yuqori taklif</span>
            <span className="block text-[15px] leading-tight font-bold text-[#0F766E]">{money(channel.bidSum)}</span>
            <span className="block text-[10.5px] font-semibold text-[#0F766E]">O‘rinni olish</span>
          </span>
          <ChevronRight className="size-4 text-[#8b93a7]" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => openTelegram(channel)}
        className={cn(
          "mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold",
          rank === 1 ? "bg-[#0F766E] text-white shadow-[0_4px_12px_rgba(15,118,110,0.28)]" : "border border-[#0F766E] bg-white text-[#0F766E]",
        )}
      >
        <Plus className="size-3.5" />
        Obuna bo‘lish
      </button>
    </article>
  );
}

function ChannelIcons() {
  return (
    <div className="relative h-[84px] w-[132px] shrink-0" aria-hidden>
      <span className="absolute top-0 left-6 grid size-11 -rotate-6 place-items-center rounded-2xl bg-gradient-to-br from-white to-[#CCFBF1] text-[#0F766E] shadow-[0_8px_16px_rgba(15,118,110,0.2)]">
        <svg viewBox="0 0 24 24" className="size-6" fill="currentColor"><path d="M12 3.2c-2.2 0-4 1.6-4 3.6 0 1-.3 2.4-.8 3.8C6.6 12.4 6 14 6 15.4c0 2 1.5 3.4 3.2 3.4 1 0 1.7-.6 2.8-.6s1.8.6 2.8.6c1.7 0 3.2-1.4 3.2-3.4 0-1.4-.6-3-1.2-4.8-.5-1.4-.8-2.8-.8-3.8 0-2-1.8-3.6-4-3.6z" /></svg>
      </span>
      <span className="absolute top-2 right-0 grid size-12 rotate-6 place-items-center rounded-2xl bg-gradient-to-br from-[#4fc3f7] to-[#229ED9] text-white shadow-[0_8px_16px_rgba(34,158,217,0.35)]">
        <Send className="size-6" />
      </span>
      <span className="absolute bottom-0 left-2 grid size-11 rotate-3 place-items-center rounded-2xl bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white shadow-[0_8px_16px_rgba(214,41,118,0.3)]">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="3.6" /><circle cx="17" cy="7" r="0.9" fill="currentColor" stroke="none" /></svg>
      </span>
      <span className="absolute right-3 bottom-0 grid size-11 -rotate-3 place-items-center rounded-2xl bg-gradient-to-br from-[#ff5a5a] to-[#e60000] text-white shadow-[0_8px_16px_rgba(230,0,0,0.3)]">
        <svg viewBox="0 0 24 24" className="size-6" fill="currentColor"><path d="M10 8.5v7l6-3.5z" /></svg>
      </span>
    </div>
  );
}

export function KanallarBrowse() {
  const { channels } = useChannels();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ChannelCategory | "">("");
  const [addOpen, setAddOpen] = useState(false);
  const [bidTarget, setBidTarget] = useState<Channel | null>(null);
  const [moreCats, setMoreCats] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const ranks = useMemo(() => {
    const m = new Map<string, number>();
    channels.forEach((c, i) => m.set(c.id, i + 1));
    return m;
  }, [channels]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    return channels.filter((c) => {
      const catOk = !category || c.category === category;
      const hay = `${c.username} ${c.name} ${channelCategoryLabel[c.category]}`.toLowerCase();
      const qOk = !q || hay.includes(q) || c.username.toLowerCase().includes(`@${q}`);
      return catOk && qOk;
    });
  }, [channels, category, query]);

  const mainIds: ChannelCategory[] = ["implantologiya", "endodontiya", "ortodontiya"];
  const tabs: { id: ChannelCategory | ""; label: string }[] = [
    { id: "", label: "Barchasi" },
    ...channelCategories.filter((c) => mainIds.includes(c.id) || moreCats).map((c) => ({ id: c.id, label: c.label })),
  ];

  const searchInput = (
    <>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-[#8b93a7]" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="@username yoki kanal nomi bilan qidirish..."
        className="h-11 w-full rounded-xl border border-[#eceff5] bg-white pl-10 pr-3 text-[14px] text-[#1a1d26] placeholder:text-[#8b93a7] outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15"
      />
    </>
  );

  return (
    <div>
      {/* Mobile */}
      <div className="lg:hidden">
        <header className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-[26px] leading-tight font-bold tracking-tight text-[#0B1F4D]">Foydali kanallar</h1>
            <p className="mt-1 text-[13px] leading-snug text-[#8b93a7]">Kanalingizni qo‘shing — o‘rin auksion orqali</p>
          </div>
          <ChannelIcons />
        </header>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0F766E] text-[14px] font-semibold text-white shadow-[0_4px_12px_rgba(15,118,110,0.28)]"
        >
          <Plus className="size-4" />
          Kanal qo‘shish
        </button>
        <div className="mb-3 flex gap-3 rounded-2xl border border-[#99F6E4] bg-[#eef5ff] p-3.5">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-[#0F766E]" />
          <p className="flex-1 text-[12px] leading-relaxed text-[#1a3a7a]">
            Maslahat: Yuqori o‘rinlar auksion orqali belgilanadi. Eng ko‘p taklif bergan kanal yuqori o‘ringa chiqadi.
          </p>
          <TrendingUp className="mt-0.5 size-5 shrink-0 text-[#0F766E]" />
        </div>
        <div className="mb-3 flex items-center gap-2">
          <div className="relative min-w-0 flex-1">{searchInput}</div>
          <button type="button" aria-label="Filtr" onClick={() => setFilterOpen(true)} className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#eceff5] bg-white text-[#0F766E]">
            <SlidersHorizontal className="size-[18px]" />
          </button>
        </div>
        <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <button
              key={t.id || "all"}
              type="button"
              onClick={() => setCategory(t.id)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-[7px] text-[13px] font-semibold transition-colors",
                category === t.id
                  ? "border-[#0F766E] bg-[#0F766E] text-white shadow-[0_4px_12px_rgba(15,118,110,0.28)]"
                  : "border-[#eceff5] bg-white text-[#4b5568]"
              )}
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            aria-label={moreCats ? "Kamroq" : "Boshqa yo‘nalishlar"}
            aria-expanded={moreCats}
            onClick={() => setMoreCats((v) => !v)}
            className="grid size-[34px] shrink-0 place-items-center rounded-full border border-[#eceff5] bg-white text-[#4b5568]"
          >
            <ChevronDown className={cn("size-4 transition-transform", moreCats && "rotate-180")} />
          </button>
        </div>
        <div className="space-y-3">
          {list.map((c) => (
            <MobileCard key={c.id} channel={c} rank={ranks.get(c.id) ?? 0} onBid={() => setBidTarget(c)} />
          ))}
          {list.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#eceff5] bg-white py-10 text-center text-[14px] text-[#8b93a7]">
              Hozircha kanal yo‘q
            </p>
          ) : null}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <KanallarDesktop onAdd={() => setAddOpen(true)} />
      </div>

      {filterOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Yopish" className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-4 pt-3 shadow-2xl" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e6eaf2]" />
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[16px] font-bold text-[#1a1d26]">Yo‘nalish bo‘yicha filtr</p>
              <button type="button" onClick={() => setFilterOpen(false)} className="text-sm font-semibold text-[#0F766E]">Tayyor</button>
            </div>
            <div className="flex flex-wrap gap-2 pb-2">
              {[{ id: "" as const, label: "Barchasi" }, ...channelCategories].map((c) => (
                <button
                  key={c.id || "all"}
                  type="button"
                  onClick={() => {
                    setCategory(c.id);
                    setFilterOpen(false);
                  }}
                  className={cn("h-11 rounded-xl px-4 text-[14px] font-semibold", category === c.id ? "bg-[#0F766E] text-white" : "bg-[#f4f6fa] text-[#4b5568]")}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {addOpen ? <AddChannelDialog onClose={() => setAddOpen(false)} /> : null}
      {bidTarget ? <BidDialog channel={bidTarget} onClose={() => setBidTarget(null)} /> : null}
    </div>
  );
}
