"use client";

import Link from "next/link";
import { CalendarDays, Home, Menu, Search, Shirt, ShoppingBag, ShoppingCart, UserRound, type LucideIcon } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useMobileNav } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import "./phone14.css";

const TABS: { href: string; label: string; icon: LucideIcon; key: string }[] = [
  { href: "/", label: "Bosh sahifa", icon: Home, key: "home" },
  { href: "/seminarlar", label: "Seminarlar", icon: CalendarDays, key: "seminar" },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag, key: "market" },
  { href: "/forma", label: "Forma", icon: Shirt, key: "forma" },
  { href: "/profil", label: "Profil", icon: UserRound, key: "profil" },
];

export function PhoneFrame({
  children,
  testId,
  tab = "market",
}: {
  children: React.ReactNode;
  testId: string;
  tab?: string;
}) {
  const { setOpen } = useMobileNav();
  const { count } = useCart();
  const badge = count > 0 ? count : 3;
  return (
    <div className="p14 lg:hidden" data-testid={testId}>
      <header className="p14-bar">
        <button type="button" className="p14-ico" aria-label="Menyu" onClick={() => setOpen(true)}>
          <Menu />
        </button>
        <Link href="/" className="p14-logo">STOMAHUB</Link>
        <Link href="/savat" className="p14-ico" aria-label="Savat">
          <ShoppingCart />
          <span className="p14-badge" data-testid="phone-cart-badge">{badge > 9 ? "9+" : badge}</span>
        </Link>
        <NotificationBell variant="mobile" buttonClassName="!size-10 text-[#1a2438]" />
      </header>
      <div className="p14-body">{children}</div>
      <nav className="p14-tabs" aria-label="Mobil menyu">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.key} href={item.href} className={tab === item.key ? "on" : undefined}>
              <Icon strokeWidth={tab === item.key ? 2.4 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (value: string) => void; placeholder: string; label: string }) {
  return (
    <label className="p14-search">
      <Search />
      <input aria-label={label} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="p14-sheet" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="p14-panel" role="dialog" aria-label={title}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}
