"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  Crown,
  Globe,
  Search,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { ShNavTree, useProfilActive } from "@/components/nav/sh-nav-tree";
import { UserRound } from "lucide-react";
import "./market-frame.css";

export type MarketNavKey = "home" | "cats" | "brands" | "all" | "new" | "popular" | "sale" | "fav" | "orders" | "seller";

export type FrameLink = { key: string; label: string; href: string; icon: LucideIcon };
export type HeaderLink = { href: string; label: string; key?: string };



const headerNav = [
  { href: "/", label: "Bosh sahifa" },
  { href: "/marketplace", label: "Marketplace", key: "market" },
  { href: "/seminarlar", label: "Seminarlar" },
  { href: "/ustalar", label: "Ustalar" },
  { href: "/forma", label: "Forma" },
  { href: "/kitoblar", label: "Kitoblar" },
];

export function MarketFrame({
  promoTitle = "Rasmiy brendlar bir joyda!",
  promoText = "Dunyoning yetakchi stomatologiya brendlari",
  promoCta = "Barcha brendlar",
  promoHref = "/marketplace/brendlar",
  promoImage = "/img/implant.jpg",
  promoIcon,
  promoClass,
  onPromo,
  headerLinks = headerNav,
  headerActive = "market",
  searchPlaceholder = "Mahsulot, brend yoki kategoriya qidiring...",
  headerQuery,
  onHeaderQuery,
  onHeaderSubmit,
  children,
}: {
  active: string;
  promoTitle?: string;
  promoText?: string;
  promoCta?: string;
  promoHref?: string;
  promoImage?: string;
  promoIcon?: ReactNode;
  promoClass?: string;
  onPromo?: () => void;
  headerLinks?: HeaderLink[];
  headerActive?: string;
  searchPlaceholder?: string;
  headerQuery?: string;
  onHeaderQuery?: (value: string) => void;
  onHeaderSubmit?: (value: string) => void;
  children: ReactNode;
}) {
  const profilActive = useProfilActive();
  const router = useRouter();
  const { count } = useCart();
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState(false);
  const searchValue = onHeaderQuery ? (headerQuery ?? "") : query;

  function onSearch(event: FormEvent) {
    event.preventDefault();
    if (onHeaderSubmit) {
      onHeaderSubmit(searchValue.trim());
      return;
    }
    if (onHeaderQuery) return;
    const q = query.trim();
    router.push(q ? `/marketplace?q=${encodeURIComponent(q)}` : "/marketplace");
  }

  return (
    <div className="sh brd">
      <header className="brd-top">
        <Link className="brd-logo" href="/" aria-label="STOMAHUB">
          <i>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 3.2c-2.2 0-4 1.6-4 3.6 0 1-.3 2.4-.8 3.8C6.6 12.4 6 14 6 15.4c0 2 1.5 3.4 3.2 3.4 1 0 1.7-.6 2.8-.6s1.8.6 2.8.6c1.7 0 3.2-1.4 3.2-3.4 0-1.4-.6-3-1.2-4.8-.5-1.4-.8-2.8-.8-3.8 0-2-1.8-3.6-4-3.6z" />
            </svg>
          </i>
          <b>STOMAHUB</b>
        </Link>
        <form className="brd-q" onSubmit={onSearch}>
          <Search className="i" />
          <input
            value={searchValue}
            onChange={(event) => (onHeaderQuery ? onHeaderQuery(event.target.value) : setQuery(event.target.value))}
            placeholder={searchPlaceholder}
            aria-label="Qidiruv"
          />
        </form>
        <nav className={headerLinks.length > 6 ? "brd-nav tight" : "brd-nav"} aria-label="Bo‘limlar">
          {headerLinks.map((item) => (
            <Link key={item.href} href={item.href} className={item.key === headerActive ? "on" : undefined} aria-current={item.key === headerActive ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="brd-actions">
          <Link className="brd-ic" href="/savat" aria-label="Savat">
            <ShoppingCart className="i" />
            <em className="badge" data-testid="mf-cart-badge">{count + 3}</em>
          </Link>
          <span style={{ position: "relative" }}>
            <button className="brd-ic" type="button" aria-label="Bildirishnomalar" aria-expanded={notes} onClick={() => setNotes((value) => !value)}>
              <Bell className="i" />
              <em className="dot" />
            </button>
            {notes ? <div className="brd-note">Yangi bildirishnoma yo‘q</div> : null}
          </span>
          <Link href="/profil" aria-label="Profil">
            <img className="brd-ava" src="/img/design-pr13/ui/avatar.png" alt="" />
          </Link>
        </div>
      </header>
      <div className="brd-body">
        <aside className="brd-side">
          <ShNavTree variant="brd" />
          <Link className={profilActive ? "brd-item on" : "brd-item"} href="/profil">
            <UserRound className="i" />
            <span>Profil</span>
          </Link>
          <div className={promoClass ? `brd-promo ${promoClass}` : "brd-promo"}>
            {promoIcon ?? <Crown className="crown i" />}
            <b>{promoTitle}</b>
            <small>{promoText}</small>
            {onPromo ? (
              <button type="button" className="go" data-testid="mf-promo" onClick={onPromo}>
                {promoCta} <ChevronRight className="i" />
              </button>
            ) : (
              <Link className="go" href={promoHref} data-testid="mf-promo">
                {promoCta} <ChevronRight className="i" />
              </Link>
            )}
            <img src={promoImage} alt="" />
          </div>
        </aside>
        <main className="brd-main">{children}</main>
      </div>
    </div>
  );
}

export function BrandMark({ slug }: { slug: string }) {
  return <img className="mk-logo" src={`/img/design-pr13/brands/${slug}.png`} alt="" />;
}

export function CountrySelect({ value, onChange, countries, testId }: { value: string; onChange: (value: string) => void; countries: string[]; testId: string }) {
  return (
    <label className="brd-country">
      <Globe className="i" />
      <select data-testid={testId} aria-label="Davlat" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Barcha davlatlar</option>
        {countries.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </select>
      <ChevronRight className="i" style={{ transform: "rotate(90deg)" }} />
    </label>
  );
}
