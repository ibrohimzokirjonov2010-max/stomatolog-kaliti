"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgePercent,
  Bell,
  ChevronRight,
  ClipboardList,
  Crown,
  Globe,
  Heart,
  Home,
  LayoutGrid,
  Package,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import "./market-frame.css";

export type MarketNavKey = "home" | "cats" | "brands" | "all" | "new" | "popular" | "sale" | "fav" | "orders" | "seller";

const mainNav: { key: MarketNavKey; label: string; href: string; icon: LucideIcon }[] = [
  { key: "home", label: "Bosh sahifa", href: "/", icon: Home },
  { key: "cats", label: "Kategoriyalar", href: "/marketplace", icon: LayoutGrid },
  { key: "brands", label: "Brendlar", href: "/marketplace/brendlar", icon: Tag },
  { key: "all", label: "Barcha mahsulotlar", href: "/marketplace", icon: Package },
  { key: "new", label: "Yangi mahsulotlar", href: "/marketplace?sort=yangi", icon: Sparkles },
  { key: "popular", label: "Ommabop mahsulotlar", href: "/marketplace?sort=ommabop", icon: ShoppingBag },
  { key: "sale", label: "Aksiyalar", href: "/marketplace/aksiyalar", icon: BadgePercent },
];

const secondNav: { key: MarketNavKey; label: string; href: string; icon: LucideIcon }[] = [
  { key: "fav", label: "Sevimlilar", href: "/marketplace", icon: Heart },
  { key: "orders", label: "Mening buyurtmalarim", href: "/buyurtmalarim", icon: ClipboardList },
  { key: "seller", label: "Sotuvchi bo‘lish", href: "/marketplace/sotuvchi", icon: Store },
];

const headerNav = [
  { href: "/", label: "Bosh sahifa" },
  { href: "/marketplace", label: "Marketplace", key: "market" },
  { href: "/seminarlar", label: "Seminarlar" },
  { href: "/ustalar", label: "Ustalar" },
  { href: "/forma", label: "Forma" },
  { href: "/kitoblar", label: "Kitoblar" },
];

export function MarketFrame({
  active,
  promoTitle = "Rasmiy brendlar bir joyda",
  promoText = "Dunyoning yetakchi stomatologiya brendlari",
  promoCta = "Barcha brendlar",
  promoHref = "/marketplace/brendlar",
  promoImage = "/img/implant.jpg",
  promoIcon,
  onPromo,
  children,
}: {
  active: MarketNavKey;
  promoTitle?: string;
  promoText?: string;
  promoCta?: string;
  promoHref?: string;
  promoImage?: string;
  promoIcon?: ReactNode;
  onPromo?: () => void;
  children: ReactNode;
}) {
  const router = useRouter();
  const { count } = useCart();
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState(false);

  function onSearch(event: FormEvent) {
    event.preventDefault();
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
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Mahsulot, brend yoki kategoriya qidiring..."
            aria-label="Qidiruv"
          />
        </form>
        <nav className="brd-nav" aria-label="Bo‘limlar">
          {headerNav.map((item) => (
            <Link key={item.href} href={item.href} className={item.key === "market" ? "on" : undefined} aria-current={item.key === "market" ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="brd-actions">
          <Link className="brd-ic" href="/savat" aria-label="Savat">
            <ShoppingCart className="i" />
            {count > 0 ? <em className="badge">{count}</em> : null}
          </Link>
          <span style={{ position: "relative" }}>
            <button className="brd-ic" type="button" aria-label="Bildirishnomalar" aria-expanded={notes} onClick={() => setNotes((value) => !value)}>
              <Bell className="i" />
              <em className="dot" />
            </button>
            {notes ? <div className="brd-note">Yangi bildirishnoma yo‘q</div> : null}
          </span>
          <Link href="/profil" aria-label="Profil">
            <img className="brd-ava" src="/img/shop/avatar.jpg" alt="" />
          </Link>
        </div>
      </header>
      <div className="brd-body">
        <aside className="brd-side">
          <nav className="brd-navlist" aria-label="Marketplace">
            {mainNav.map((item) => (
              <Link key={item.key} href={item.href} className={active === item.key ? "brd-item on" : "brd-item"} data-testid={`mf-${item.key}`}>
                <item.icon className="i" />
                <span>{item.label}</span>
              </Link>
            ))}
            <div className="brd-split" />
            {secondNav.map((item) => (
              <Link key={item.key} href={item.href} className={active === item.key ? "brd-item on" : "brd-item"} data-testid={`mf-${item.key}`}>
                <item.icon className="i" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="brd-promo">
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
  switch (slug) {
    case "3m":
      return <span className="mk mk-3m">3M</span>;
    case "dentsply-sirona":
      return (
        <span className="mk mk-dentsply">
          <b>Dentsply</b>
          <span>Sirona</span>
        </span>
      );
    case "ivoclar":
      return (
        <span className="mk mk-ivoclar">
          <i>i</i>voclar
        </span>
      );
    case "straumann":
      return (
        <span className="mk mk-straumann">
          <i>/</i>straumann
        </span>
      );
    case "nobel-biocare":
      return (
        <span className="mk mk-nobel">
          <i>N</i>
          <span>
            Nobel
            <br />
            Biocare
          </span>
        </span>
      );
    case "zimmer-biomet":
      return (
        <span className="mk mk-zimmer">
          <i>Z</i>
          ZIMMER BIOMET
        </span>
      );
    case "coltene":
      return <span className="mk mk-coltene">COLTENE</span>;
    case "kerr":
      return <span className="mk mk-kerr">Kerr</span>;
    case "gc":
      return <span className="mk mk-gc">GC</span>;
    case "tokuyama":
      return (
        <span className="mk mk-toku">
          <i>T</i>Tokuyama
        </span>
      );
    case "fanta-dental":
      return <span className="mk mk-fanta">fanta</span>;
    case "ultradent":
      return <span className="mk mk-ultra">ULTRADENT</span>;
    case "mectron":
      return (
        <span className="mk mk-mectron">
          <i>m</i>ectron
        </span>
      );
    case "nsk":
      return <span className="mk mk-nsk">NSK</span>;
    case "wh":
      return <span className="mk mk-wh">W&H</span>;
    case "vatech":
      return <span className="mk mk-vatech">vatech</span>;
    case "planmeca":
      return <span className="mk mk-plan">PLANMECA</span>;
    case "osstem":
      return <span className="mk mk-osstem">OSSTEM</span>;
    case "mindray":
      return <span className="mk mk-mindray">mindray</span>;
    case "angelus":
      return <span className="mk mk-angelus">angelus</span>;
    default:
      return <span className="mk">{slug}</span>;
  }
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
