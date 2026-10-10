"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Edit3, Filter, MessageSquareText, Send, Star, ThumbsUp, Timer, BadgeCheck } from "lucide-react";
import { LineChart, Panel, SelectBox } from "@/components/seller-desktop-ui";
import { formatMoney } from "@/lib/format";
import { pingSellerLive } from "@/lib/use-seller-live";
import { cn } from "@/lib/utils";

type Review = {
  id: string;
  rating: number;
  body: string;
  images?: string[];
  createdAt: string;
  orderId: string;
  productId?: string;
  productName?: string;
  productImage?: string;
  productPrice?: number;
  buyerName?: string;
  reply?: string;
  replyAt?: string;
  replyEditedAt?: string;
  cats?: Partial<Record<"quality" | "delivery" | "packaging" | "service" | "value", number>>;
};

const pad = (n: number) => String(n).padStart(2, "0");
const dmy = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
const dmyHm = (d: Date) => `${dmy(d)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
const DAY = 86400000;

const RANGES = [
  { value: "all", label: "Barcha vaqt", days: 0 },
  { value: "7", label: "Oxirgi 7 kun", days: 7 },
  { value: "30", label: "Oxirgi 30 kun", days: 30 },
  { value: "90", label: "Oxirgi 3 oy", days: 90 },
  { value: "365", label: "Oxirgi 1 yil", days: 365 },
];
const SORTS = [
  { value: "new", label: "Yangi avval" },
  { value: "old", label: "Eski avval" },
  { value: "high", label: "Yuqori baho" },
  { value: "low", label: "Past baho" },
];
const CATS: { key: "quality" | "delivery" | "packaging" | "service" | "value"; label: string }[] = [
  { key: "quality", label: "Mahsulot sifati" },
  { key: "delivery", label: "Yetkazib berish" },
  { key: "packaging", label: "Qadoqlash" },
  { key: "service", label: "Xizmat sifati" },
  { key: "value", label: "Narx / sifat" },
];

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} yulduz`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(value) ? "fill-[#f5b100] text-[#f5b100]" : "fill-[#e5e9f2] text-[#e5e9f2]"} />
      ))}
    </span>
  );
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.4, background: `hsl(${hue} 55% 52%)` }}>
      {name.trim().slice(0, 1).toUpperCase() || "?"}
    </span>
  );
}

function MiniBars({ values, color = "#0066FF" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-9 items-end gap-[3px]" aria-hidden="true">
      {values.map((v, i) => (
        <span key={i} className="w-[7px] rounded-sm" style={{ height: `${Math.max((v / max) * 100, v > 0 ? 12 : 6)}%`, background: v > 0 ? color : "#e8edf5" }} />
      ))}
    </div>
  );
}

function fmtDuration(ms: number) {
  const min = ms / 60000;
  if (min < 1) return "1 daqiqadan kam";
  if (min < 60) return `${Math.round(min)} daqiqa`;
  const h = min / 60;
  if (h < 48) return `${+h.toFixed(h < 10 ? 1 : 0)} soat`;
  return `${Math.round(h / 24)} kun`;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const replyMs = (r: Review) => (r.replyAt ? +new Date(r.replyAt) - +new Date(r.createdAt) : null);

export function SellerReviewsDesktop() {
  const params = useSearchParams();
  const urlQ = params.get("q") ?? "";
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [err, setErr] = useState("");
  const [range, setRange] = useState("all");
  const [star, setStar] = useState(0);
  const [sort, setSort] = useState("new");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);
  const [onlyPhotos, setOnlyPhotos] = useState(false);
  const [q, setQ] = useState(urlQ);
  const [lastUrlQ, setLastUrlQ] = useState(urlQ);
  if (urlQ !== lastUrlQ) {
    setLastUrlQ(urlQ);
    setQ(urlQ);
  }
  const [selId, setSelId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/seller/reviews", { credentials: "same-origin", cache: "no-store" })
      .then((r) => r.json() as Promise<{ ok: boolean; reviews?: Review[]; error?: string }>)
      .then((d) => {
        if (!alive) return;
        if (d.ok) setReviews(d.reviews ?? []);
        else setErr(d.error ?? "Yuklab bo‘lmadi.");
      })
      .catch(() => alive && setErr("Tarmoq xatosi."));
    return () => {
      alive = false;
    };
  }, []);

  const all = useMemo(() => reviews ?? [], [reviews]);
  const days = RANGES.find((r) => r.value === range)?.days ?? 0;

  const calc = useMemo(() => {
    const now = new Date().getTime();
    const start = days ? now - days * DAY : 0;
    const inRange = all.filter((r) => +new Date(r.createdAt) >= start);
    const prev = days ? all.filter((r) => +new Date(r.createdAt) >= start - days * DAY && +new Date(r.createdAt) < start) : [];
    const dist = [5, 4, 3, 2, 1].map((s) => inRange.filter((r) => r.rating === s).length);
    const total = inRange.length;
    const mean = avg(inRange.map((r) => r.rating));
    const satisfaction = total ? Math.round((inRange.filter((r) => r.rating >= 4).length / total) * 100) : null;
    const prevSat = prev.length ? Math.round((prev.filter((r) => r.rating >= 4).length / prev.length) * 100) : null;
    const resp = avg(inRange.map(replyMs).filter((x): x is number => x != null && x >= 0));
    const prevResp = avg(prev.map(replyMs).filter((x): x is number => x != null && x >= 0));

    // buckets for dynamics (cumulative average) & mini bars
    const oldest = all.length ? Math.min(...all.map((r) => +new Date(r.createdAt))) : now;
    const spanStart = days ? start : oldest;
    const span = Math.max(now - spanStart, DAY);
    const step = span <= 31 * DAY ? DAY : span <= 100 * DAY ? 7 * DAY : 30 * DAY;
    const n = Math.min(Math.max(Math.ceil(span / step), 1), 24);
    const first = now - n * step;
    const buckets = Array.from({ length: n }, (_, i) => {
      const from = first + i * step;
      const to = from + step;
      const d = new Date(to - 1);
      return { from, to, label: step === DAY ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}` : step === 7 * DAY ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}` : `${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`, tip: dmy(d) };
    });
    let cumSum = all.filter((r) => +new Date(r.createdAt) < first).reduce((a, r) => a + r.rating, 0);
    let cumN = all.filter((r) => +new Date(r.createdAt) < first).length;
    const series: (number | null)[] = [];
    const counts: number[] = [];
    const resps: number[] = [];
    const sats: number[] = [];
    for (const b of buckets) {
      const here = all.filter((r) => +new Date(r.createdAt) >= b.from && +new Date(r.createdAt) < b.to);
      cumSum += here.reduce((a, r) => a + r.rating, 0);
      cumN += here.length;
      series.push(cumN ? +(cumSum / cumN).toFixed(2) : null);
      counts.push(here.length);
      resps.push(avg(here.map(replyMs).filter((x): x is number => x != null && x >= 0)) ?? 0);
      sats.push(here.length ? Math.round((here.filter((r) => r.rating >= 4).length / here.length) * 100) : 0);
    }
    const firstIdx = series.findIndex((v) => v != null);

    const cats = CATS.map((c) => ({ ...c, v: avg(inRange.map((r) => r.cats?.[c.key]).filter((x): x is number => typeof x === "number")) }));
    const byProd = new Map<string, { name: string; image?: string; count: number; sum: number }>();
    for (const r of inRange) {
      const k = r.productId ?? r.productName ?? r.id;
      const p = byProd.get(k) ?? { name: r.productName ?? "Mahsulot", image: r.productImage, count: 0, sum: 0 };
      p.count += 1;
      p.sum += r.rating;
      byProd.set(k, p);
    }
    const top = [...byProd.values()].sort((a, b) => b.count - a.count).slice(0, 5);
    return { inRange, prev, dist, total, mean, satisfaction, prevSat, resp, prevResp, buckets, series, firstIdx, counts, resps, sats, cats, top, start };
  }, [all, days]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const xs = calc.inRange.filter((r) => {
      if (star && r.rating !== star) return false;
      if (onlyUnanswered && r.reply) return false;
      if (onlyPhotos && !r.images?.length) return false;
      if (!needle) return true;
      return [r.buyerName, r.productName, r.orderId, r.body].some((v) => v?.toLowerCase().includes(needle));
    });
    const key: Record<string, (a: Review, b: Review) => number> = {
      new: (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      old: (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
      high: (a, b) => b.rating - a.rating || +new Date(b.createdAt) - +new Date(a.createdAt),
      low: (a, b) => a.rating - b.rating || +new Date(b.createdAt) - +new Date(a.createdAt),
    };
    return [...xs].sort(key[sort]);
  }, [calc.inRange, star, onlyUnanswered, onlyPhotos, q, sort]);

  const sel = list.find((r) => r.id === selId) ?? list[0] ?? null;
  if (sel && sel.id !== selId) {
    setSelId(sel.id);
    setEditing(false);
    setReply("");
  }

  async function saveReply() {
    if (!sel || !reply.trim() || busy) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/seller/reviews/${sel.id}`, {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: reply.trim() }),
      });
      const d = (await res.json()) as { ok: boolean; review?: Review; error?: string };
      if (d.ok && d.review) {
        setReviews((rs) => (rs ?? []).map((r) => (r.id === d.review!.id ? d.review! : r)));
        setEditing(false);
        setReply("");
        pingSellerLive();
      } else setErr(d.error ?? "Saqlab bo‘lmadi.");
    } catch {
      setErr("Tarmoq xatosi.");
    } finally {
      setBusy(false);
    }
  }

  const growth = (cur: number, prev: number) => (prev > 0 && days ? Math.round(((cur - prev) / prev) * 100) : null);
  const countGrowth = growth(calc.total, calc.prev.length);
  const rangeLabel = days ? `${dmy(new Date(calc.start))} – ${dmy(new Date())}` : "Barcha vaqt";
  const chartLabels = calc.buckets.slice(Math.max(calc.firstIdx, 0)).map((b) => b.label);
  const chartTips = calc.buckets.slice(Math.max(calc.firstIdx, 0)).map((b) => b.tip);
  const chartVals = calc.series.slice(Math.max(calc.firstIdx, 0)).map((v) => v ?? 0);
  const tail = <T,>(xs: T[]) => xs.slice(-12);

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#0B1F4D]">Reyting va sharhlar</h1>
          <p className="mt-1 text-[13.5px] text-[#6b7280]">Mijozlar baholari va fikrlarini kuzating. Bu sizning obro‘yingiz va savdoingizga ta’sir qiladi.</p>
        </div>
        <label className="flex h-10 items-center gap-2 rounded-xl border border-[#e4e9f2] bg-white pr-2 pl-3.5 text-[13px] font-medium text-[#0B1F4D]">
          <CalendarDays className="size-4 text-[#8b93a7]" />
          <span className="text-[#4b5568]">{rangeLabel}</span>
          <SelectBox label="Davr" value={range} onChange={setRange} options={RANGES.map(({ value, label }) => ({ value, label }))} className="h-7 border-0 bg-[#f4f7fc]" />
        </label>
      </header>

      {err ? <p className="rounded-xl bg-[#fef2f2] px-3 py-2 text-[13px] text-[#b91c1c]">{err}</p> : null}

      <div className="grid grid-cols-[1.35fr_1fr_1fr_1fr] gap-4">
        <Panel className="!p-4">
          <p className="text-[13px] font-medium text-[#6b7280]">Umumiy reyting</p>
          <div className="mt-2 flex items-center gap-4">
            <div>
              <p className="flex items-baseline gap-1 text-[34px] leading-none font-extrabold text-[#0B1F4D]">
                {calc.mean != null ? calc.mean.toFixed(1) : "—"}
                <span className="text-[14px] font-semibold text-[#8b93a7]">/ 5</span>
              </p>
              <div className="mt-1.5"><Stars value={calc.mean ?? 0} size={16} /></div>
              <p className="mt-1 text-[11.5px] text-[#8b93a7]">({calc.total} ta sharh)</p>
              {calc.mean != null && calc.mean >= 4.5 ? <span className="mt-1.5 inline-block rounded-full bg-[#ecfdf3] px-2 py-0.5 text-[10.5px] font-semibold text-[#15803d]">Ajoyib natija</span> : null}
            </div>
            <ul className="min-w-0 flex-1 space-y-1">
              {calc.dist.map((n, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[11px] text-[#6b7280]">
                  <span className="w-2.5">{5 - i}</span>
                  <Star className="size-3 fill-[#f5b100] text-[#f5b100]" />
                  <span className="h-1.5 flex-1 rounded-full bg-[#eef1f6]"><span className="block h-1.5 rounded-full bg-[#f5b100]" style={{ width: `${calc.total ? (n / calc.total) * 100 : 0}%` }} /></span>
                  <span className="w-5 text-right">{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
        <Panel className="!p-4">
          <p className="text-[13px] font-medium text-[#6b7280]">Jami sharhlar</p>
          <div className="mt-2 flex items-end justify-between gap-2">
            <p className="text-[30px] leading-none font-extrabold text-[#0B1F4D]">{calc.total}</p>
            <MiniBars values={tail(calc.counts)} />
          </div>
          <p className="mt-2.5 text-[11.5px] text-[#8b93a7]">
            {countGrowth != null ? <b className={countGrowth >= 0 ? "text-[#16a34a]" : "text-[#dc2626]"}>{countGrowth >= 0 ? "+" : ""}{countGrowth}% </b> : null}
            {countGrowth != null ? "oldingi davrga nisbatan" : days ? "Oldingi davrda ma’lumot yo‘q" : "Barcha vaqt davomida"}
          </p>
        </Panel>
        <Panel className="!p-4">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#6b7280]"><Timer className="size-3.5" />O‘rtacha javob vaqti</p>
          <div className="mt-2 flex items-end justify-between gap-2">
            <p className="text-[26px] leading-none font-extrabold text-[#0B1F4D]">{calc.resp != null ? fmtDuration(calc.resp) : "—"}</p>
            <MiniBars values={tail(calc.resps)} color="#7c3aed" />
          </div>
          <p className="mt-2.5 text-[11.5px] text-[#8b93a7]">
            {calc.resp == null ? "Hali javob yozilmagan" : calc.prevResp != null && calc.prevResp > 0 && days ? (
              <><b className={calc.resp <= calc.prevResp ? "text-[#16a34a]" : "text-[#dc2626]"}>{Math.round(((calc.resp - calc.prevResp) / calc.prevResp) * 100)}%</b> (oldingi davr: {fmtDuration(calc.prevResp)})</>
            ) : "Sharhgacha sotuvchi javobigacha"}
          </p>
        </Panel>
        <Panel className="!p-4">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#6b7280]"><ThumbsUp className="size-3.5" />Mijozlar qoniqish darajasi</p>
          <div className="mt-2 flex items-end justify-between gap-2">
            <p className="text-[30px] leading-none font-extrabold text-[#0B1F4D]">{calc.satisfaction != null ? `${calc.satisfaction}%` : "—"}</p>
            <MiniBars values={tail(calc.sats)} color="#16a34a" />
          </div>
          <p className="mt-2.5 text-[11.5px] text-[#8b93a7]">
            {calc.satisfaction != null && calc.prevSat != null && days ? (
              <><b className={calc.satisfaction >= calc.prevSat ? "text-[#16a34a]" : "text-[#dc2626]"}>{calc.satisfaction - calc.prevSat >= 0 ? "+" : ""}{calc.satisfaction - calc.prevSat}%</b> </>
            ) : null}
            4–5 yulduzli sharhlar ulushi
          </p>
        </Panel>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[0, 5, 4, 3, 2, 1].map((s) => {
          const n = s === 0 ? calc.total : calc.dist[5 - s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStar(s)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3.5 text-[13px] font-semibold transition-colors",
                star === s ? "border-[#0066FF] bg-[#0066FF] text-white" : "border-[#e4e9f2] bg-white text-[#4b5568] hover:border-[#bcd3ff] hover:text-[#0066FF]",
              )}
            >
              {s === 0 ? "Barchasi" : <>{s} <Star className={cn("size-3.5", star === s ? "fill-white text-white" : "fill-[#f5b100] text-[#f5b100]")} /></>} ({n})
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <SelectBox label="Saralash" value={sort} onChange={setSort} options={SORTS} className="h-9 min-w-[130px]" />
          <button type="button" onClick={() => setFiltersOpen((v) => !v)} className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg border px-3.5 text-[13px] font-semibold", filtersOpen || onlyUnanswered || onlyPhotos ? "border-[#0066FF] text-[#0066FF]" : "border-[#e4e9f2] text-[#4b5568]")}>
            <Filter className="size-4" />Filtr
          </button>
        </div>
        {filtersOpen ? (
          <div className="flex w-full items-center gap-5 rounded-xl border border-[#eceff5] bg-white px-4 py-2.5 text-[13px] text-[#4b5568]">
            <label className="flex items-center gap-2"><input type="checkbox" checked={onlyUnanswered} onChange={(e) => setOnlyUnanswered(e.target.checked)} />Faqat javobsiz</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={onlyPhotos} onChange={(e) => setOnlyPhotos(e.target.checked)} />Faqat rasmli</label>
          </div>
        ) : null}
      </div>

      {reviews && all.length === 0 ? (
        <Panel className="grid place-items-center py-16 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-[#fff7e6]"><Star className="size-8 text-[#f5b100]" /></span>
          <p className="mt-4 text-[17px] font-bold text-[#0B1F4D]">Hali sharh yo‘q</p>
          <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-[#6b7280]">
            Xaridorlar yetkazilgan buyurtmadagi mahsulotga baho qoldirganda, sharhlar va reyting shu yerda paydo bo‘ladi. Siz ularga javob yozishingiz mumkin.
          </p>
        </Panel>
      ) : (
        <div className="grid grid-cols-[300px_minmax(0,1fr)_300px] items-start gap-4 xl:grid-cols-[330px_minmax(0,1fr)_330px]">
          <section className="max-h-[640px] overflow-y-auto rounded-2xl border border-[#eceff5] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            {reviews == null ? <p className="p-5 text-center text-[13px] text-[#8b93a7]">Yuklanmoqda…</p> : null}
            {reviews && list.length === 0 ? <p className="p-6 text-center text-[13px] text-[#8b93a7]">Tanlangan filtr bo‘yicha sharh topilmadi.</p> : null}
            <ul>
              {list.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => { setSelId(r.id); setEditing(false); setReply(""); }}
                    className={cn("flex w-full gap-3 border-b border-l-[3px] border-b-[#f1f4f9] px-3.5 py-3 text-left hover:bg-[#f7faff]", sel?.id === r.id ? "border-l-[#0066FF] bg-[#f0f6ff]" : "border-l-transparent")}
                  >
                    <Avatar name={r.buyerName ?? "?"} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13.5px] font-bold text-[#0B1F4D]">{r.buyerName ?? "Xaridor"}</p>
                        <span className="shrink-0 text-[11px] text-[#8b93a7]">{dmy(new Date(r.createdAt))}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2"><Stars value={r.rating} size={12} />{!r.reply ? <span className="size-1.5 rounded-full bg-[#ef4444]" title="Javobsiz" /> : null}</div>
                      <p className="mt-1 line-clamp-2 text-[12.5px] text-[#4b5568]">{r.body || "Matnsiz baho"}</p>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {r.productImage ? <img src={r.productImage} alt="" className="size-11 shrink-0 self-center rounded-lg bg-[#f4f6fa] object-contain" /> : null}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-[#eceff5] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            {sel ? (
              <>
                <div className="flex items-start gap-3">
                  <Avatar name={sel.buyerName ?? "?"} size={46} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-[#0B1F4D]">{sel.buyerName ?? "Xaridor"}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[12px] text-[#8b93a7]"><Stars value={sel.rating} size={14} />{dmyHm(new Date(sel.createdAt))}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf3] px-2.5 py-1 text-[11.5px] font-semibold text-[#15803d]"><BadgeCheck className="size-3.5" />Tasdiqlangan xaridor</span>
                </div>
                <p className="mt-4 text-[14px] leading-relaxed break-words whitespace-pre-wrap text-[#1a1d26]">{sel.body || <span className="text-[#8b93a7]">Xaridor faqat baho qoldirgan.</span>}</p>
                {sel.images?.length ? (
                  <div className="mt-4 flex gap-2">
                    {sel.images.slice(0, 4).map((src, i) => (
                      <a key={src} href={src} target="_blank" rel="noreferrer" className="relative size-20 overflow-hidden rounded-xl bg-[#f4f6fa]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="size-full object-cover" />
                        {i === 3 && sel.images!.length > 4 ? <span className="absolute inset-0 grid place-items-center bg-black/50 text-[14px] font-bold text-white">+{sel.images!.length - 4}</span> : null}
                      </a>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#eceff5] bg-[#fafbfd] p-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {sel.productImage ? <img src={sel.productImage} alt="" className="size-12 shrink-0 rounded-lg bg-white object-contain" /> : <span className="size-12 shrink-0 rounded-lg bg-[#f1f4f9]" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-[#0B1F4D]">{sel.productName ?? "Mahsulot"}</p>
                    <p className="text-[12px] text-[#6b7280]">{sel.productPrice != null ? formatMoney(sel.productPrice, "UZS") : `Buyurtma ${sel.orderId}`}</p>
                  </div>
                  {sel.productId ? <Link href={`/marketplace/${sel.productId}`} className="inline-flex h-9 items-center rounded-lg border border-[#d7e4ff] bg-white px-3.5 text-[12.5px] font-semibold text-[#0066FF] hover:bg-[#f5f9ff]">Mahsulotni ko‘rish</Link> : null}
                </div>

                <div className="mt-5 border-t border-[#eef1f6] pt-4">
                  {sel.reply && !editing ? (
                    <div className="rounded-xl bg-[#f0f6ff] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#0B1F4D]"><MessageSquareText className="size-4 text-[#0066FF]" />Sizning javobingiz</p>
                        <span className="text-[11.5px] text-[#8b93a7]">
                          {sel.replyAt ? dmyHm(new Date(sel.replyAt)) : ""}{sel.replyEditedAt ? " · tahrirlangan" : ""}
                        </span>
                      </div>
                      <p className="mt-2 text-[13.5px] leading-relaxed break-words whitespace-pre-wrap text-[#1a1d26]">{sel.reply}</p>
                      <button type="button" onClick={() => { setEditing(true); setReply(sel.reply ?? ""); }} className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d7e4ff] bg-white px-3 text-[12.5px] font-semibold text-[#0066FF] hover:bg-[#f5f9ff]">
                        <Edit3 className="size-3.5" />Javobni tahrirlash
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[13px] font-bold text-[#0B1F4D]">{editing ? "Javobni tahrirlash" : "Javob yozing"}</p>
                      <div className="mt-2 flex items-end gap-2">
                        <textarea
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          rows={3}
                          maxLength={1500}
                          placeholder="Javobingizni yozing..."
                          className="min-h-[84px] flex-1 resize-none rounded-xl border border-[#e4e9f2] bg-[#f7f9fc] px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#0066FF] focus:bg-white"
                        />
                        <div className="flex flex-col gap-2">
                          <button type="button" disabled={!reply.trim() || busy} onClick={() => void saveReply()} className="grid size-11 place-items-center rounded-xl bg-[#0066FF] text-white hover:bg-[#0055d4] disabled:bg-[#b9d2ff]" aria-label="Javobni yuborish">
                            <Send className="size-[18px]" />
                          </button>
                          {editing ? <button type="button" onClick={() => { setEditing(false); setReply(""); }} className="h-8 rounded-lg border border-[#e4e9f2] px-2 text-[12px] font-semibold text-[#4b5568]">Bekor</button> : null}
                        </div>
                      </div>
                      <p className="mt-1.5 text-[11.5px] text-[#8b93a7]">Javob xaridorlarga ommaviy ko‘rinadi.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="grid min-h-[300px] place-items-center text-center text-[13px] text-[#8b93a7]">Sharhni tanlang.</div>
            )}
          </section>

          <aside className="space-y-4">
            <Panel title="Reyting dinamikasi" className="!p-4">
              {chartVals.length && calc.firstIdx >= 0 ? (
                <div className="mt-3">
                  <LineChart labels={chartLabels} tooltipLabels={chartTips} series={[{ key: "r", label: "O‘rtacha reyting", color: "#0066FF", values: chartVals, area: true, fmt: (n) => n.toFixed(2) }]} height={150} leftTick={(n) => String(n)} />
                  <p className="mt-1 text-[11px] text-[#8b93a7]">Kumulyativ o‘rtacha baho (1–5)</p>
                </div>
              ) : (
                <p className="mt-3 rounded-xl bg-[#f7f9fc] px-3 py-8 text-center text-[12.5px] text-[#8b93a7]">Ma’lumot yo‘q.</p>
              )}
            </Panel>
            <Panel title="Sharhlar bo‘yicha reyting" className="!p-4">
              <ul className="mt-3 space-y-3">
                {calc.cats.map((c) => (
                  <li key={c.key}>
                    <div className="flex items-center justify-between text-[12.5px]"><span className="text-[#4b5568]">{c.label}</span><b className="text-[#0B1F4D]">{c.v != null ? c.v.toFixed(1) : "—"}</b></div>
                    <div className="mt-1 h-1.5 rounded-full bg-[#eef1f6]"><div className="h-1.5 rounded-full bg-[#0066FF]" style={{ width: `${c.v != null ? (c.v / 5) * 100 : 0}%` }} /></div>
                  </li>
                ))}
              </ul>
              {calc.cats.every((c) => c.v == null) ? <p className="mt-2 text-[11px] text-[#8b93a7]">Xaridorlar kategoriya baholarini qo‘shmagan.</p> : null}
            </Panel>
            <Panel title="Eng ko‘p sharh qoldirilgan mahsulotlar" className="!p-4">
              {calc.top.length ? (
                <ol className="mt-3 space-y-2.5">
                  {calc.top.map((p, i) => (
                    <li key={`${p.name}-${i}`} className="flex items-center gap-2.5 text-[12.5px]">
                      <span className="w-4 text-[#8b93a7]">{i + 1}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.image ? <img src={p.image} alt="" className="size-9 shrink-0 rounded-lg bg-[#f4f6fa] object-contain" /> : <span className="size-9 shrink-0 rounded-lg bg-[#f4f6fa]" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[#0B1F4D]">{p.name}</p>
                        <p className="flex items-center gap-1 text-[11px] text-[#8b93a7]"><Star className="size-3 fill-[#f5b100] text-[#f5b100]" />{(p.sum / p.count).toFixed(1)}</p>
                      </div>
                      <b className="text-[#0B1F4D]">{p.count} ta</b>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 rounded-xl bg-[#f7f9fc] px-3 py-6 text-center text-[12.5px] text-[#8b93a7]">Ma’lumot yo‘q.</p>
              )}
            </Panel>
          </aside>
        </div>
      )}
    </div>
  );
}
