"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Content wrapper for the catalog pages. Navigation lives in the app's global sidebar only. */
export function CatalogLayout({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}

export function PageTitle({ title, subtitle, right }: { title: string; subtitle: string; right?: ReactNode }) {
  return (
    <header className="mb-4 flex flex-wrap items-start gap-3 lg:mb-5">
      <div className="min-w-0">
        <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#111827] lg:text-[30px]">{title}</h1>
        <p className="mt-1 text-[13.5px] text-[#8b93a7] lg:text-[15px]">{subtitle}</p>
      </div>
      {right ? <div className="ml-auto flex items-center gap-2.5">{right}</div> : null}
    </header>
  );
}

export function StatBadge({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#F0FDFA] bg-[#EEF4FF] px-4 py-2.5">
      <Icon className="size-6 shrink-0 text-[#0F766E]" strokeWidth={1.7} />
      <div className="leading-tight">
        <div className="text-[13px] font-bold text-[#111827]">{title}</div>
        {text ? <div className="mt-0.5 text-[11.5px] text-[#6b7590]">{text}</div> : null}
      </div>
    </div>
  );
}

/** Horizontally scrolling chip row (wraps-free on mobile, single line on desktop). */
export function ChipRow<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0", className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "h-9 shrink-0 rounded-lg border px-3.5 text-[12.5px] font-medium whitespace-nowrap transition-colors",
            value === item.id
              ? "border-[#0F766E] bg-[#0F766E] text-white"
              : "border-[#e6eaf2] bg-white text-[#111827] hover:border-[#0F766E]/40",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
