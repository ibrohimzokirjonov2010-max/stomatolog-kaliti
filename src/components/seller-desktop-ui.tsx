"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-[#eceff5] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]", className)}>
      {title || action ? (
        <div className="flex items-center justify-between gap-2">
          {title ? <h2 className="text-[15.5px] font-bold text-[#0B1F4D]">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function DemoTag({ children = "Demo" }: { children?: ReactNode }) {
  return <span className="rounded-full bg-[#fff4e5] px-2 py-0.5 text-[10.5px] font-semibold text-[#c2410c]">{children}</span>;
}

export function SoonTag() {
  return <span className="rounded-full bg-[#f1f4f9] px-2 py-0.5 text-[10.5px] font-semibold text-[#8b93a7]">Tez orada</span>;
}

export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; soon?: boolean }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "h-10 rounded-xl border px-4 text-[13.5px] font-semibold transition-colors",
            value === t.id
              ? "border-[#0F766E] bg-[#0F766E] text-white shadow-[0_4px_12px_rgba(15,118,110,0.25)]"
              : "border-[#e4e9f2] bg-white text-[#4b5568] hover:border-[#99F6E4] hover:text-[#0F766E]",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function SelectBox({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  className?: string;
  label?: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 rounded-lg border border-[#e4e9f2] bg-white px-2.5 text-[12.5px] font-medium text-[#0B1F4D] outline-none focus:border-[#0F766E]",
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export type ChartSeries = {
  key: string;
  label: string;
  color: string;
  values: number[];
  area?: boolean;
  dashed?: boolean;
  axis?: "left" | "right";
  fmt: (n: number) => string;
};

function niceMax(max: number) {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const f = max / pow;
  const step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return step * pow;
}

export function shortMoney(n: number) {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)} mln`;
  if (n >= 1000) return `${Math.round(n / 1000)} ming`;
  return String(Math.round(n));
}

/** HTML-label chart: stretched SVG paths (non-scaling stroke) + positioned dots/tooltip, so text never distorts. */
export function LineChart({
  labels,
  tooltipLabels,
  series,
  height = 220,
  leftTick = shortMoney,
  rightTick,
}: {
  labels: string[];
  tooltipLabels?: string[];
  series: ChartSeries[];
  height?: number;
  leftTick?: (n: number) => string;
  rightTick?: (n: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const n = Math.max(labels.length, 1);
  const leftMax = niceMax(Math.max(0, ...series.filter((s) => s.axis !== "right").flatMap((s) => s.values)));
  const rightMax = niceMax(Math.max(0, ...series.filter((s) => s.axis === "right").flatMap((s) => s.values)));
  const hasRight = series.some((s) => s.axis === "right");
  const X = (i: number) => ((i + 0.5) / n) * 100;
  const Y = (s: ChartSeries, v: number) => {
    const max = s.axis === "right" ? rightMax : leftMax;
    return 96 - (v / max) * 90;
  };
  const path = (s: ChartSeries) => s.values.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(2)},${Y(s, v).toFixed(2)}`).join(" ");
  const areaPath = (s: ChartSeries) => `${path(s)} L${X(s.values.length - 1).toFixed(2)},100 L${X(0).toFixed(2)},100 Z`;
  const active = hover;
  const labelStep = Math.max(1, Math.ceil(n / 9));
  const ticks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between pb-6 text-right text-[10.5px] text-[#8b93a7]" style={{ height: height + 24 }}>
        {ticks.map((f) => (
          <span key={f} className="leading-none">
            {leftTick(Math.round(leftMax * f))}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative" style={{ height }} onMouseLeave={() => setHover(null)}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
            {ticks.map((f) => (
              <line
                key={f}
                x1="0"
                x2="100"
                y1={96 - f * 90}
                y2={96 - f * 90}
                stroke="#eef1f6"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                strokeDasharray={f === 0 ? undefined : "3 3"}
              />
            ))}
            {series.map((s) =>
              s.area ? (
                <path key={`${s.key}-a`} d={areaPath(s)} fill={s.color} fillOpacity="0.1" stroke="none" />
              ) : null,
            )}
            {series.map((s) => (
              <path
                key={s.key}
                d={path(s)}
                fill="none"
                stroke={s.color}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={s.dashed ? "2 4" : undefined}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {active != null ? (
              <line x1={X(active)} x2={X(active)} y1="0" y2="100" stroke="#cfd8ea" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            ) : null}
          </svg>
          {active != null
            ? series.map((s) => (
                <span
                  key={s.key}
                  className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                  style={{ left: `${X(active)}%`, top: `${Y(s, s.values[active] ?? 0)}%`, background: s.color }}
                />
              ))
            : null}
          <div className="absolute inset-0 flex">
            {labels.map((l, i) => (
              <div key={`${l}-${i}`} className="h-full flex-1" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} />
            ))}
          </div>
          {active != null ? (
            <div
              className="pointer-events-none absolute top-2 z-10 min-w-[150px] rounded-xl border border-[#e4e9f2] bg-white p-2.5 text-[12px] shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
              style={X(active) > 62 ? { right: `${100 - X(active) + 2}%` } : { left: `${X(active) + 2}%` }}
            >
              <p className="font-semibold text-[#0B1F4D]">{tooltipLabels?.[active] ?? labels[active]}</p>
              {series.map((s) => (
                <p key={s.key} className="mt-1 flex items-center justify-between gap-3 text-[#4b5568]">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <b className="text-[#0B1F4D]">{s.fmt(s.values[active] ?? 0)}</b>
                </p>
              ))}
            </div>
          ) : null}
        </div>
        <div className="mt-1.5 flex h-4 text-[10.5px] text-[#8b93a7]">
          {labels.map((l, i) => (
            <span key={`${l}-${i}`} className="flex-1 text-center whitespace-nowrap">
              {i % labelStep === 0 ? l : ""}
            </span>
          ))}
        </div>
      </div>
      {hasRight ? (
        <div className="flex flex-col justify-between pb-6 text-left text-[10.5px] text-[#8b93a7]" style={{ height: height + 24 }}>
          {ticks.map((f) => (
            <span key={f} className="leading-none">
              {(rightTick ?? String)(Math.round(rightMax * f))}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const DONUT_COLORS = ["#0F766E", "#7c3aed", "#14b8a6", "#f59e0b", "#ef4444"];

export function Donut({
  parts,
  center,
  size = 150,
}: {
  parts: { label: string; value: number; color?: string }[];
  center: ReactNode;
  size?: number;
}) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  const R = 42;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#eef1f6" strokeWidth="13" />
        {total > 0
          ? parts.map((p, i) => {
              const len = (p.value / total) * C;
              const el = (
                <circle
                  key={p.label}
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  stroke={p.color ?? DONUT_COLORS[i % DONUT_COLORS.length]}
                  strokeWidth="13"
                  strokeDasharray={`${Math.max(len - 0.8, 0)} ${C}`}
                  strokeDashoffset={-acc}
                />
              );
              acc += len;
              return el;
            })
          : null}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{center}</div>
    </div>
  );
}

export { DONUT_COLORS };
