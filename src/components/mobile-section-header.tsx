"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Search, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { NotificationBell } from "@/components/notification-bell";
import { cn } from "@/lib/utils";

const actionCls = "relative grid size-11 shrink-0 place-items-center rounded-full bg-[#eaf2ff] text-[#0066FF]";

/** Focus the section's own search input (marked with data-section-search). */
function focusSectionSearch() {
  const el = document.querySelector<HTMLInputElement>("[data-section-search]");
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.focus({ preventScroll: true });
}

/**
 * One standard phone header for every main section (Forma mock):
 * title (+ optional subtitle) on the left; search · cart · bell on the same row.
 * Replaces the old top bar (logo · Toshkent · avatar) on section pages.
 */
export function MobileSectionHeader({
  title,
  subtitle,
  onSearch,
  searchOpen,
  extra,
  className,
  topPad = "0px",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Custom search action (e.g. toggle a search row). Defaults to focusing the page's search input. */
  onSearch?: () => void;
  searchOpen?: boolean;
  /** Optional section-specific action placed before search (keep to one). */
  extra?: ReactNode;
  className?: string;
  /** Extra top padding for pages that bleed to the top edge (-mt-4). */
  topPad?: string;
}) {
  const { count } = useCart();
  return (
    <header
      data-testid="mobile-section-header"
      className={cn("mb-3 flex items-start justify-between gap-2 lg:hidden", className)}
      style={{ paddingTop: `max(${topPad}, env(safe-area-inset-top))` }}
    >
      <div className="min-w-0 pt-1">
        <h1 className="text-[26px] leading-tight font-bold tracking-tight text-[#0B1F4D]">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-[13px] leading-snug text-[#8b93a7]">{subtitle}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {extra}
        <button
          type="button"
          aria-label="Qidirish"
          aria-expanded={searchOpen}
          data-testid="section-search-btn"
          onClick={onSearch ?? focusSectionSearch}
          className={actionCls}
        >
          <Search className="size-5" />
        </button>
        <Link href="/savat" aria-label="Savat" className={actionCls}>
          <ShoppingCart className="size-5" />
          {count > 0 ? (
            <span
              data-testid="section-cart-badge"
              className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#FF3B30] px-1 text-[10px] font-bold text-white ring-2 ring-white"
            >
              {count > 9 ? "9+" : count}
            </span>
          ) : null}
        </Link>
        <div className="rounded-full bg-[#eaf2ff]">
          <NotificationBell variant="mobile" buttonClassName="rounded-full text-[#0066FF]" />
        </div>
      </div>
    </header>
  );
}

export const mobileHeaderActionCls = actionCls;
