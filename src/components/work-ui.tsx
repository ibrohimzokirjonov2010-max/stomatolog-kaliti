"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const inputCls =
  "mt-1 h-11 w-full rounded-xl border border-[#dfe5ef] bg-white px-3.5 text-[14px] text-[#1a1d26] outline-none placeholder:text-[#a0a8ba] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 aria-[invalid=true]:border-[#dc2626]";
export const textareaCls =
  "mt-1 min-h-[96px] w-full rounded-xl border border-[#dfe5ef] bg-white px-3.5 py-2.5 text-[14px] text-[#1a1d26] outline-none placeholder:text-[#a0a8ba] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 aria-[invalid=true]:border-[#dc2626]";

export function FormField({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#4b5568]">{label}</span>
      {children}
      {hint && !error ? <span className="mt-1 block text-[12px] text-[#8b93a7]">{hint}</span> : null}
      {error ? <span role="alert" className="mt-1 block text-[12.5px] font-medium text-[#dc2626]">{error}</span> : null}
    </label>
  );
}

export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={cn("h-10 rounded-full px-4 text-[13px] font-semibold transition-colors", on ? "bg-[#0F766E] text-white" : "border border-[#e6eaf2] bg-white text-[#4b5568]")}>
      {children}
    </button>
  );
}

export function Gate({ title, text, next }: { title: string; text: string; next: string }) {
  return (
    <div className="rounded-[18px] border border-[#eceff5] bg-white px-6 py-14 text-center shadow-[0_4px_14px_rgba(15,23,42,0.04)]" data-testid="login-gate">
      <p className="text-[16px] font-semibold text-[#1a1d26]">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-[#8b93a7]">{text}</p>
      <Link href={`/kirish?next=${encodeURIComponent(next)}`} className={cn(buttonVariants(), "mt-5 inline-flex h-12 min-w-[160px] !rounded-2xl text-[14px] font-semibold")}>
        Kirish
      </Link>
    </div>
  );
}

export function EmptyState({ title, text, href, cta, icon }: { title: string; text: string; href?: string; cta?: string; icon?: ReactNode }) {
  return (
    <div className="rounded-[18px] border border-[#eceff5] bg-white px-6 py-14 text-center shadow-[0_4px_14px_rgba(15,23,42,0.04)]" data-testid="empty-state">
      {icon ? <span className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-[#eef4ff] text-[#0F766E]">{icon}</span> : null}
      <p className="text-[16px] font-semibold text-[#1a1d26]">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-[#8b93a7]">{text}</p>
      {href && cta ? (
        <Link href={href} className={cn(buttonVariants(), "mt-5 inline-flex h-12 min-w-[180px] !rounded-2xl text-[14px] font-semibold")}>
          {cta}
        </Link>
      ) : null}
    </div>
  );
}

export const MOD_BANNER: Record<string, { cls: string; title: string; text: (reason?: string | null) => string }> = {
  pending: { cls: "border-[#fde68a] bg-[#fffbeb] text-[#92400e]", title: "Moderatsiyada", text: () => "Administrator tasdiqlagach hamma ko‘radi. Bildirishnoma keladi." },
  published: { cls: "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]", title: "E’londa", text: () => "Hamma uchun ko‘rinadi. Telefon raqamingiz yopiq." },
  rejected: { cls: "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]", title: "Rad etilgan", text: (r) => `Sabab: ${r || "ko‘rsatilmagan"}. Tuzatib qayta saqlang.` },
  hidden: { cls: "border-[#e2e8f0] bg-[#f8fafc] text-[#475569]", title: "Yashirilgan", text: (r) => `Administrator yashirgan${r ? `: ${r}` : "."}` },
  closed: { cls: "border-[#e2e8f0] bg-[#f8fafc] text-[#475569]", title: "Yopilgan", text: () => "Bu e’lon yopilgan." },
};

export function ModBanner({ status, reason }: { status: string; reason?: string | null }) {
  const b = MOD_BANNER[status] ?? MOD_BANNER.pending;
  return (
    <div className={cn("mb-4 rounded-2xl border px-4 py-3", b.cls)} data-testid="mod-banner" data-status={status}>
      <p className="text-[14px] font-bold">{b.title}</p>
      <p className="mt-0.5 text-[13px]">{b.text(reason)}</p>
    </div>
  );
}

export function TabBar<T extends string>({ tabs, value, onChange }: { tabs: readonly (readonly [T, string])[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-full bg-[#eef2f8] p-1" role="tablist">
      {tabs.map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className={cn("h-10 shrink-0 rounded-full px-4 text-[13px] font-semibold", value === id ? "bg-white text-[#0F766E] shadow-sm" : "text-[#6b7280]")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function StatusPill({ label, cls }: { label: string; cls: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", cls)}>{label}</span>;
}
