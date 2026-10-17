"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { type ReactNode } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Crown,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { DesktopHeader } from "@/components/desktop/desktop-header";
import { DesktopSidebar } from "@/components/desktop/desktop-sidebar";
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
  active,
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
  void active;
  void headerLinks;
  void headerActive;

  const promo = (
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
  );

  return (
    <div className="sh brd dh">
      <DesktopHeader
        searchPlaceholder={searchPlaceholder}
        headerQuery={headerQuery}
        onHeaderQuery={onHeaderQuery}
        onHeaderSubmit={onHeaderSubmit}
      />
      <div className="sh-body brd-body">
        <DesktopSidebar />
        <main className="brd-main">
          {promo}
          {children}
        </main>
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
