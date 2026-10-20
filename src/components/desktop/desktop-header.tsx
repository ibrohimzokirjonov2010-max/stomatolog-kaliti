"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Camera, ChevronDown, Heart, MapPin, Search, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { NotificationBell } from "@/components/notification-bell";
import { useSellerWork } from "@/components/seller-provider";
import "./desktop-chrome.css";

export const DESKTOP_LOGO_SRC = "/brand/stomahub-mark.svg";

const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Andijon", "Namangan", "Farg‘ona", "Nukus"];

const SEARCH_CATS = [
  { href: "/kategoriyalar", label: "Barcha kategoriyalar" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/marketplace/brendlar", label: "Brendlar" },
  { href: "/marketplace/aksiyalar", label: "Aksiyalar" },
  { href: "/ortiqcha-material", label: "Ortiqcha material" },
  { href: "/forma", label: "Tibbiy forma" },
  { href: "/jihozlar", label: "Jihozlar" },
];

export type DesktopHeaderProps = {
  searchPlaceholder?: string;
  searchPath?: string;
  headerQuery?: string;
  onHeaderQuery?: (value: string) => void;
  onHeaderSubmit?: (value: string) => void;
  /** Force the camera pill off (kitoblar). Marketplace paths show it unless this is false. */
  showCamera?: boolean;
};

function isMarketplacePath(pathname: string) {
  if (pathname === "/marketplace" || pathname.startsWith("/product/")) return true;
  if (pathname.startsWith("/marketplace/") && !pathname.startsWith("/marketplace/sotuvchi")) return true;
  return false;
}

export function DesktopHeader({
  searchPlaceholder = "Mahsulot, brend yoki kategoriya qidiring...",
  searchPath = "/marketplace",
  headerQuery,
  onHeaderQuery,
  onHeaderSubmit,
  showCamera,
}: DesktopHeaderProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { count } = useCart();
  const { profile, ready, logout, updateProfile } = useDoctorProfile();
  const [localQuery, setLocalQuery] = useState("");
  const [menu, setMenu] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [city, setCity] = useState(profile?.city || "Toshkent");
  useEffect(() => {
    if (profile?.city) setCity(profile.city);
  }, [profile?.city]);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const value = onHeaderQuery ? (headerQuery ?? "") : localQuery;
  const market = isMarketplacePath(pathname);
  const camera = market && showCamera !== false;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const q = value.trim();
    if (onHeaderSubmit) {
      onHeaderSubmit(q);
      return;
    }
    router.push(q ? `${searchPath}?q=${encodeURIComponent(q)}` : searchPath);
  }

  const name = profile?.fullName?.trim() || "";
  const role = profile?.specialty?.trim() || "";
  const avatar = profile?.avatarUrl || "";

  return (
    <header className="dh-top" data-testid="desktop-header">
      <Link className="dh-logo" href="/" aria-label="StomaHub">
        <img src={DESKTOP_LOGO_SRC} alt="" data-testid="desktop-logo" data-logo-src={DESKTOP_LOGO_SRC} />
        <span className="dh-word">
          Stoma<b>Hub</b>
        </span>
      </Link>
      <form className={market ? "dh-search dh-search-market" : "dh-search"} onSubmit={onSearch} role="search">
        {market ? (
          <div className="dh-cats">
            <button type="button" aria-expanded={catsOpen} aria-haspopup="listbox" data-testid="header-cats" onClick={() => setCatsOpen((open) => !open)}>
              Barcha kategoriyalar
              <ChevronDown className="i" />
            </button>
            {catsOpen ? (
              <div className="dh-menu dh-cat-menu" role="listbox">
                {SEARCH_CATS.map((item) => (
                  <Link key={item.href + item.label} href={item.href} role="option" onClick={() => setCatsOpen(false)}>
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        <Search className="i" />
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => (onHeaderQuery ? onHeaderQuery(event.target.value) : setLocalQuery(event.target.value))}
          placeholder={searchPlaceholder}
          aria-label="Qidiruv"
        />
        <button type="submit" className="dh-go" aria-label="Qidirish">
          <Search className="i" />
        </button>
      </form>
      {camera ? (
        <>
          <button type="button" className="dh-cam" data-testid="header-camera" onClick={() => fileRef.current?.click()}>
            <Camera className="i" />
            Rasm orqali qidirish
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden aria-hidden="true" tabIndex={-1} />
        </>
      ) : null}
      <div className="dh-actions">
        <div className="dh-city">
          <button type="button" aria-expanded={cityOpen} aria-haspopup="listbox" data-testid="header-city" onClick={() => setCityOpen((open) => !open)}>
            <MapPin className="i" />
            <span>{city}</span>
            <ChevronDown className="i chev" />
          </button>
          {cityOpen ? (
            <div className="dh-menu" role="listbox" aria-label="Shahar">
              {CITIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="option"
                  aria-selected={item === city}
                  onClick={() => {
                    setCity(item);
                    setCityOpen(false);
                    if (profile) void updateProfile({ city: item });
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <span className="dh-bell">
          <NotificationBell variant="desktop" buttonClassName="dh-icon-btn" />
        </span>
        <Link className="dh-ic" href="/profil" aria-label="Sevimlilar" data-testid="desktop-heart">
          <Heart className="i" />
        </Link>
        <Link className="dh-ic" href="/savat" aria-label="Savat" data-testid="desktop-cart">
          <ShoppingCart className="i" />
          {count > 0 ? (
            <em className="badge" data-testid="desktop-cart-badge">
              {count}
            </em>
          ) : null}
        </Link>
        {!ready ? (
          <div className="dh-user" data-testid="desktop-profile-pending" aria-hidden="true" />
        ) : profile && name ? (
          <div className="dh-user">
            <button type="button" aria-label="Profil" aria-expanded={menu} aria-haspopup="menu" data-testid="desktop-profile" onClick={() => setMenu((open) => !open)}>
              {avatar ? <img src={avatar} alt="" /> : <span className="dh-initials" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>}
              <span>
                <b>{name}</b>
                {role ? <small>{role}</small> : null}
              </span>
              <ChevronDown className="chev" />
            </button>
            {menu ? (
              <div className="dh-menu" role="menu">
                <Link href="/profil" role="menuitem" onClick={() => setMenu(false)}>
                  Profil
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    void logout();
                  }}
                >
                  Chiqish
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="dh-auth" data-testid="desktop-guest">
            <Link className="dh-login" href="/kirish" data-testid="header-login">
              Kirish
            </Link>
            <Link className="dh-login dh-login-solid" href="/royxat" data-testid="header-register">
              Ro‘yxatdan o‘tish
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

/** Route-specific search for pages that still render through the dashboard shell. */
export function useDashboardSearch(): Pick<DesktopHeaderProps, "searchPlaceholder" | "onHeaderSubmit"> {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { session: sellerSession } = useSellerWork();
  const cabinetTab = useSearchParams().get("tab");
  const onIshlar = pathname === "/ishlar" || pathname.startsWith("/ishlar/");
  const onCommunity = pathname === "/community" || pathname.startsWith("/community/");
  const onLabs = pathname === "/laboratoriya" || pathname.startsWith("/laboratoriya/");
  const onSurplus = pathname === "/ortiqcha-material" || pathname.startsWith("/ortiqcha-material/");
  const onMarketplace = pathname === "/marketplace" || pathname.startsWith("/marketplace/");
  const onSotuvchi = pathname === "/sotuvchi" || pathname.startsWith("/marketplace/sotuvchi");
  const onCabinet = onSotuvchi && sellerSession?.verified === "active";
  const onUstalar = pathname === "/ustalar" || pathname.startsWith("/ustalar/");
  const onForma = pathname === "/forma" || pathname.startsWith("/forma/");

  const placeholder = onCabinet
    ? cabinetTab === "orders"
      ? "Buyurtma raqami, mijoz, mahsulot yoki shahar bo‘yicha qidiring..."
      : cabinetTab === "card"
        ? "Savdo, buyurtma yoki to‘lov bo‘yicha qidiring..."
        : cabinetTab === "analytics"
          ? "Savdo, mahsulot, mijoz yoki davr bo‘yicha qidiring..."
          : cabinetTab === "messages"
            ? "Mijoz nomi, buyurtma raqami yoki xabar matni bo‘yicha qidirish..."
            : cabinetTab === "reviews"
              ? "Mahsulot, mijoz, buyurtma yoki sharh bo‘yicha qidiring..."
              : cabinetTab === "settings"
                ? "Mahsulot, mijoz, buyurtma yoki sozlama qidirish..."
                : "Mahsulot nomi, brend yoki SKU bo‘yicha qidiring..."
    : onSurplus
      ? "Material, brend yoki kategoriya bo‘yicha qidirish..."
      : onLabs
        ? "Qidirish: lab nomi, xizmat, material..."
        : onCommunity
          ? "Qidirish..."
          : onIshlar
            ? "Qidirish: lavozim, klinika, shahar..."
            : onUstalar
              ? "Usta yoki xizmat turi bo‘yicha qidiring..."
              : onForma
                ? "Mahsulot, brend yoki kategoriya qidirish..."
                : onMarketplace && !onSotuvchi
                  ? "Material, brend yoki kategoriya bo‘yicha qidiring..."
                  : "Mahsulot, brend yoki kategoriya qidiring...";

  function onHeaderSubmit(q: string) {
    if (onIshlar) {
      router.push(q ? `/ishlar?q=${encodeURIComponent(q)}` : "/ishlar");
      return;
    }
    if (onCommunity) {
      router.push(q ? `/community?q=${encodeURIComponent(q)}` : "/community");
      return;
    }
    if (onLabs) {
      router.push(q ? `/laboratoriya?q=${encodeURIComponent(q)}` : "/laboratoriya");
      return;
    }
    if (onSurplus) {
      router.push(q ? `/ortiqcha-material?q=${encodeURIComponent(q)}` : "/ortiqcha-material");
      return;
    }
    if (onUstalar) {
      router.push(q ? `/ustalar?q=${encodeURIComponent(q)}` : "/ustalar");
      return;
    }
    if (onForma) {
      router.push(q ? `/forma?q=${encodeURIComponent(q)}` : "/forma");
      return;
    }
    if (onCabinet) {
      const t = cabinetTab === "orders" || cabinetTab === "card" ? "orders" : cabinetTab === "messages" || cabinetTab === "reviews" ? cabinetTab : "products";
      router.push(q ? `/marketplace/sotuvchi?tab=${t}&q=${encodeURIComponent(q)}` : `/marketplace/sotuvchi?tab=${t}`);
      return;
    }
    router.push(q ? `/marketplace?q=${encodeURIComponent(q)}` : "/marketplace");
  }

  return { searchPlaceholder: placeholder, onHeaderSubmit };
}

export function DashboardHeader() {
  const search = useDashboardSearch();
  return <DesktopHeader searchPlaceholder={search.searchPlaceholder} onHeaderSubmit={search.onHeaderSubmit} />;
}
