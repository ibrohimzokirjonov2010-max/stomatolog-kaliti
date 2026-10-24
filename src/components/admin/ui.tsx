"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ───────── formatting ───────── */
export function fmtInt(n: number | null | undefined) {
  return Math.round(Number(n) || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Big money: "150.1" + unit "mln so‘m"; small amounts stay exact. */
export function moneyParts(v: number | null | undefined): { value: string; unit: string } {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1_000_000) return { value: (n / 1_000_000).toFixed(1), unit: "mln so‘m" };
  return { value: fmtInt(n), unit: "so‘m" };
}

export function moneyShort(v: number | null | undefined) {
  const p = moneyParts(v);
  return p.unit === "so‘m" ? `${p.value} so‘m` : `${p.value} mln`;
}

export function initials(name: string | null | undefined) {
  const parts = (name ?? "").replace(/^Dr\.?\s*/i, "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] ?? "") + (parts[1]?.[0] ?? parts[0][1] ?? "")).toUpperCase();
}

export function fmtDate(iso?: string | null, withTime = false) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", year: "numeric" });
  if (!withTime) return date;
  const time = d.toLocaleTimeString("ru-RU", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit" });
  return `${date}, ${time}`;
}

export function timeAgo(iso?: string | null) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "hozirgina";
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} kun oldin`;
  return fmtDate(iso);
}

export function shortDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ───────── data hook ───────── */
export function useAdminData<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(url));
  const seq = useRef(0);
  const load = useCallback(async () => {
    if (!url) return;
    const id = ++seq.current;
    setLoading(true);
    try {
      const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; data?: T; error?: string } | null;
      if (id !== seq.current) return;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Ma’lumotni yuklab bo‘lmadi.");
      } else {
        setError("");
        setData(json.data ?? null);
      }
    } catch {
      if (id === seq.current) setError("Tarmoq xatosi.");
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [url]);
  useEffect(() => {
    // data fetching on URL change; setState happens after the request resolves
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  return { data, error, loading, reload: load };
}

export async function adminPost(url: string, body: unknown, method = "POST") {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: method === "DELETE" ? undefined : JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } & Record<string, unknown>;
    if (!res.ok || !json?.ok) return { ok: false as const, error: json?.error ?? "Bajarib bo‘lmadi." };
    return { ok: true as const, data: json };
  } catch {
    return { ok: false as const, error: "Tarmoq xatosi." };
  }
}

/* ───────── primitives ───────── */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-[#eceff5] bg-white shadow-[0_1px_2px_rgba(17, 24, 39, 0.04)]", className)}>
      {children}
    </div>
  );
}

const TONES = {
  green: "bg-[#ecfdf3] text-[#15803d]",
  orange: "bg-[#fff7ed] text-[#c2410c]",
  red: "bg-[#fef2f2] text-[#b91c1c]",
  blue: "bg-[#F0FDFA] text-[#0F766E]",
  gray: "bg-[#f1f5f9] text-[#475569]",
  violet: "bg-[#f3efff] text-[#6d28d9]",
} as const;
export type Tone = keyof typeof TONES;

export function Pill({ tone = "gray", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Small "i" with a definition shown on hover/focus. */
export function Def({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("group/def relative inline-flex", className)}>
      <button
        type="button"
        aria-label={text}
        className="inline-flex size-4 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 focus:text-slate-600 focus:outline-none"
      >
        <Info className="size-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-6 z-30 hidden w-64 -translate-x-1/2 rounded-xl bg-[#111827] px-3 py-2 text-[11.5px] font-medium leading-snug text-white shadow-lg group-focus-within/def:block group-hover/def:block"
      >
        {text}
      </span>
    </span>
  );
}

export function Delta({ cur, prev }: { cur: number; prev: number }) {
  if (!prev || prev <= 0) return null;
  const pct = ((cur - prev) / prev) * 100;
  const up = pct >= 0;
  return (
    <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-bold", up ? "bg-[#ecfdf3] text-[#15803d]" : "bg-[#fef2f2] text-[#b91c1c]")}>
      {up ? "↗" : "↘"} {up ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

export function Empty({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      {icon ? <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-[#f1f5f9] text-slate-400">{icon}</span> : null}
      <p className="text-[13.5px] font-semibold text-slate-700">{title}</p>
      {hint ? <p className="mt-1 max-w-sm text-[12.5px] text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function Loading({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-16 text-slate-400", className)}>
      <Loader2 className="size-5 animate-spin" />
    </div>
  );
}

export function ErrorBox({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] text-[#b91c1c]">
      {text}{" "}
      {onRetry ? (
        <button type="button" onClick={onRetry} className="font-semibold underline">
          Qayta urinish
        </button>
      ) : null}
    </div>
  );
}

export function Avatar({ name, src, className, tone = 0 }: { name: string; src?: string | null; className?: string; tone?: number }) {
  const palette = [
    ["#F0FDFA", "#0F766E"],
    ["#ecfdf3", "#15803d"],
    ["#f3efff", "#6d28d9"],
    ["#fff7ed", "#c2410c"],
    ["#F0FDFA", "#115E59"],
    ["#fdf2f8", "#be185d"],
  ];
  const [bg, fg] = palette[Math.abs(tone) % palette.length];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={cn("size-9 shrink-0 rounded-full object-cover", className)} />;
  }
  return (
    <span
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold", className)}
      style={{ background: bg, color: fg }}
    >
      {initials(name)}
    </span>
  );
}

export function hashTone(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function PageHead({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="hidden font-heading text-[22px] font-bold tracking-tight text-[#111827] lg:block lg:text-[24px]">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { id: T; label: ReactNode }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-full border border-[#e2e8f0] bg-white p-1", className)}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-full px-3 py-1 text-[12.5px] font-semibold transition-colors",
            value === o.id ? "bg-primary text-white" : "text-slate-500 hover:text-slate-800",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chips<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string; count?: number }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
            value === o.id ? "bg-[#111827] text-white" : "bg-[#f1f5f9] text-slate-600 hover:bg-[#e2e8f0]",
          )}
        >
          {o.label}
          {o.count != null ? ` · ${fmtInt(o.count)}` : ""}
        </button>
      ))}
    </div>
  );
}

export const btn = {
  primary:
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 text-[13px] font-semibold text-white hover:bg-[#0F766E] disabled:opacity-60",
  outline:
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-white px-3.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60",
  danger:
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3.5 text-[13px] font-semibold text-[#b91c1c] hover:bg-[#fee2e2] disabled:opacity-60",
  dangerSolid:
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#dc2626] px-3.5 text-[13px] font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-60",
};

/* ───────── charts (plain SVG) ───────── */
function niceCeil(v: number) {
  const p = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 4, 5, 10].find((m) => m * p >= v) ?? 10;
  return step * p;
}

export function AreaChart({
  values,
  bars,
  labels,
  height = 240,
  color = "#0F766E",
  yFormat = (v: number) => (v >= 1_000_000 ? `${+(v / 1_000_000).toFixed(1)}M` : v >= 10_000 ? `${Math.round(v / 1_000)}k` : fmtInt(Math.round(v))),
}: {
  values: number[];
  bars?: number[];
  labels?: string[];
  height?: number;
  color?: string;
  yFormat?: (v: number) => string;
}) {
  const w = 720;
  const h = height;
  const padL = 44, padB = 26, padT = 10, padR = 10;
  const iw = w - padL - padR;
  const ih = h - padB - padT;
  const n = Math.max(values.length, 2);
  const maxRaw = Math.max(0, ...values, ...(bars ?? []));
  const ymax = maxRaw > 0 ? niceCeil(maxRaw * 1.1) : 1;
  const xs = Array.from({ length: n }, (_, i) => padL + (iw * i) / (n - 1));
  const ys = values.map((v) => padT + ih * (1 - v / ymax));
  const d = values.length ? "M" + values.map((_, i) => `${xs[i].toFixed(1)},${ys[i].toFixed(1)}`).join(" L") : "";
  const gid = `g${color.replace("#", "")}${h}`;
  const labelIdx = labels ? pickLabelIdx(labels.length, 7) : [];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" className="block">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map((k) => {
        const y = padT + (ih * k) / 4;
        return (
          <g key={k}>
            <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="#eef2f7" />
            <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10.5" fill="#94a3b8">
              {maxRaw > 0 ? yFormat(ymax * (1 - k / 4)) : k === 4 ? "0" : ""}
            </text>
          </g>
        );
      })}
      {bars?.map((b, i) => {
        const bw = (iw / n) * 0.55;
        const bh = (ih * b) / ymax;
        return <rect key={i} x={xs[i] - bw / 2} y={padT + ih - bh} width={bw} height={bh} rx={2} fill="#F0FDFA" />;
      })}
      {values.length > 1 ? (
        <>
          <path d={`${d} L${xs[values.length - 1].toFixed(1)},${padT + ih} L${xs[0].toFixed(1)},${padT + ih} Z`} fill={`url(#${gid})`} />
          <path d={d} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <circle cx={xs[values.length - 1]} cy={ys[values.length - 1]} r={4} fill="#fff" stroke={color} strokeWidth={2.2} />
        </>
      ) : null}
      {labels
        ? labelIdx.map((i) => (
            <text
              key={i}
              x={xs[i]}
              y={h - 7}
              textAnchor={i === labels.length - 1 ? "end" : i === 0 ? "start" : "middle"}
              fontSize="10.5"
              fill="#94a3b8"
            >
              {labels[i]}
            </text>
          ))
        : null}
    </svg>
  );
}

function pickLabelIdx(len: number, count: number) {
  if (len <= count) return Array.from({ length: len }, (_, i) => i);
  const out: number[] = [];
  for (let k = 0; k < count; k++) out.push(Math.round(((len - 1) * k) / (count - 1)));
  return [...new Set(out)];
}

export function Spark({ values, color = "#0F766E", w = 96, h = 30 }: { values: number[]; color?: string; w?: number; h?: number }) {
  if (values.length < 2) return <svg width={w} height={h} />;
  const mx = Math.max(...values);
  const mn = Math.min(...values);
  const pts = values
    .map((v, i) => `${((w * i) / (values.length - 1)).toFixed(1)},${(h - 2 - ((h - 4) * (v - mn)) / (mx - mn || 1)).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline points={pts} fill="none" stroke={mx === 0 ? "#cbd5e1" : color} strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}

export function Donut({ parts, size = 150, stroke = 22, children }: { parts: { value: number; color: string }[]; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = parts.reduce((a, p) => a + p.value, 0);
  let off = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f7" strokeWidth={stroke} />
        {total > 0
          ? parts
              .filter((p) => p.value > 0)
              .map((p, i) => {
                const L = (c * p.value) / total;
                const el = (
                  <circle
                    key={i}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={p.color}
                    strokeWidth={stroke}
                    strokeDasharray={`${Math.max(L - 2, 0.5)} ${c - Math.max(L - 2, 0.5)}`}
                    strokeDashoffset={-off}
                  />
                );
                off += L;
                return el;
              })
          : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

/* ───────── drawer / modal ───────── */
export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Yopish" className="absolute inset-0 bg-[#111827]/40" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col bg-white shadow-2xl">
        <div className="flex h-14 items-center justify-between border-b border-[#eef2f7] px-5">
          <p className="text-[13.5px] font-semibold text-slate-700">{title}</p>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-slate-500 hover:bg-slate-50" aria-label="Yopish">
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer ? <div className="border-t border-[#eef2f7] p-4">{footer}</div> : null}
      </aside>
    </div>
  );
}

export function Toast({ text, tone = "ok", onDone }: { text: string; tone?: "ok" | "err"; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 3500);
    return () => window.clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed inset-x-4 bottom-20 z-[60] mx-auto max-w-sm lg:bottom-6 lg:left-auto lg:right-6 lg:mx-0">
      <div className={cn("rounded-2xl px-4 py-3 text-[13px] font-semibold shadow-lg", tone === "ok" ? "bg-[#111827] text-white" : "bg-[#dc2626] text-white")}>
        {text}
      </div>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ text: string; tone?: "ok" | "err" } | null>(null);
  const clear = useCallback(() => setToast(null), []);
  const show = useCallback((text: string, tone: "ok" | "err" = "ok") => setToast({ text, tone }), []);
  const node = toast ? <Toast key={toast.text} text={toast.text} tone={toast.tone} onDone={clear} /> : null;
  return { show, node };
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_accept: "Kutilmoqda",
  qabul_qilindi: "Qabul qilindi",
  yigilmoqda: "Yig‘ilmoqda",
  yigish_tugadi: "Yig‘ish tugadi",
  yolda: "Yo‘lda",
  yetkazildi: "Yetkazildi",
};

export const PAYMENT_LABEL: Record<string, { label: string; tone: Tone }> = {
  awaiting_payment: { label: "To‘lov kutilmoqda", tone: "gray" },
  escrow_held: { label: "Escrowda", tone: "orange" },
  released: { label: "O‘tkazildi", tone: "green" },
  refunded: { label: "Qaytarildi", tone: "violet" },
};
