"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Search, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { NotificationBell } from "@/components/notification-bell";
import { cn } from "@/lib/utils";

const actionCls = "relative grid size-10 shrink-0 place-items-center rounded-full bg-[#eef3f7] text-[#0B1A3A]";

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
  /** Omit (null) for sections whose mockup shows only the logo row. */
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
      className={cn("mb-3 lg:hidden", className)}
      style={{ paddingTop: `max(${topPad}, env(safe-area-inset-top))` }}
    >
      <div className="flex items-center justify-between gap-2">
        <Link href="/" className="text-[20px] font-black tracking-[0.02em] text-[#0B1A3A]">
          STOMA<span className="text-[#0b7f7d]">HUB</span>
        </Link>
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
            <Search className="size-[19px]" />
          </button>
          <Link href="/savat" aria-label="Savat" className={actionCls}>
            <ShoppingCart className="size-[19px]" />
            {count > 0 ? (
              <span
                data-testid="section-cart-badge"
                className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#FF3B30] px-1 text-[10px] font-bold text-white ring-2 ring-white"
              >
                {count > 9 ? "9+" : count}
              </span>
            ) : null}
          </Link>
          <div className="rounded-full bg-[#eef3f7]">
            <NotificationBell variant="mobile" buttonClassName="rounded-full text-[#0B1A3A]" />
          </div>
        </div>
      </div>
      {title ? (
        <div className="mt-2 min-w-0">
          <h1 className="text-[24px] leading-tight font-extrabold tracking-tight text-[#0B1A3A]">{title}</h1>
          {subtitle ? <p className="mt-0.5 text-[11.5px] leading-snug text-[#7b8aa5]">{subtitle}</p> : null}
        </div>
      ) : null}
    </header>
  );
}

export const mobileHeaderActionCls = actionCls;
