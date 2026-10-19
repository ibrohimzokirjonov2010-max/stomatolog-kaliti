"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Search, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { NotificationBell } from "@/components/notification-bell";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import "./mobile-ui.css";

function focusSearch() {
  const input = document.querySelector<HTMLInputElement>("[data-section-search]");
  if (input) {
    input.scrollIntoView({ block: "center", behavior: "smooth" });
    input.focus();
  }
}

/** Mobile design top bar: STOMAHUB wordmark + round actions. Badges show real counts only. */
export function MobileBrandBar({
  search = false,
  cart = true,
  bell = true,
  extra,
  onSearch,
}: {
  search?: boolean;
  cart?: boolean;
  bell?: boolean;
  extra?: ReactNode;
  onSearch?: () => void;
}) {
  const { count } = useCart();
  return (
    <header className="mb-bar lg:hidden" data-testid="mobile-brand-bar">
      <div className="flex min-w-0 items-center gap-1">
        <MobileMenuButton variant="brand" />
        <Link href="/" className="mb-logo" aria-label="StomaHub — bosh sahifa">
          STOMA<span>HUB</span>
        </Link>
      </div>
      <div className="mb-acts">
        {extra}
        {search ? (
          <button type="button" className="mb-ic round" aria-label="Qidirish" data-testid="section-search-btn" onClick={onSearch ?? focusSearch}>
            <Search />
          </button>
        ) : null}
        {cart ? (
          <Link href="/savat" className="mb-ic" aria-label={count ? `Savat, ${count} ta` : "Savat"}>
            <ShoppingCart />
            {count > 0 ? <em data-testid="mb-cart-badge">{count > 9 ? "9+" : count}</em> : null}
          </Link>
        ) : null}
        {bell ? <NotificationBell variant="mobile" buttonClassName="mb-bell" /> : null}
      </div>
    </header>
  );
}
