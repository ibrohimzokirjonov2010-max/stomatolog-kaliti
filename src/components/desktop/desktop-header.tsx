"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { NotificationBell } from "@/components/notification-bell";
import { useSellerWork } from "@/components/seller-provider";
import "./desktop-chrome.css";

export const DESKTOP_LOGO_SRC = "/brand/stomahub-mark.svg";

const NAV = [
  { href: "/", label: "Bosh sahifa", test: (path: string) => path === "/" || path.startsWith("/bosh-sahifa") },
  {
    href: "/marketplace",
    label: "Marketplace",
    test: (path: string) =>
      path.startsWith("/marketplace") ||
      path.startsWith("/kategoriyalar") ||
      path.startsWith("/ortiqcha-material") ||
      path.startsWith("/product") ||
      path.startsWith("/savat") ||
      path.startsWith("/cart") ||
      path.startsWith("/checkout") ||
      path.startsWith("/buyurtma"),
  },
  { href: "/seminarlar", label: "Seminarlar", test: (path: string) => path.startsWith("/seminarlar") },
  { href: "/ustalar", label: "Ustalar", test: (path: string) => path.startsWith("/ustalar") },
  { href: "/forma", label: "Forma", test: (path: string) => path.startsWith("/forma") },
  { href: "/kitoblar", label: "Kitoblar", test: (path: string) => path.startsWith("/kitoblar") },
] as const;

const DEMO_AVATAR = "/img/design-pr13/ui/avatar.png";

export type DesktopHeaderProps = {
  searchPlaceholder?: string;
  searchPath?: string;
  headerQuery?: string;
  onHeaderQuery?: (value: string) => void;
  onHeaderSubmit?: (value: string) => void;
};

export function DesktopHeader({
  searchPlaceholder = "Mahsulot, brend yoki kategoriya qidiring...",
  searchPath = "/marketplace",
  headerQuery,
  onHeaderQuery,
  onHeaderSubmit,
}: DesktopHeaderProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { count } = useCart();
  const { profile, logout } = useDoctorProfile();
  const [localQuery, setLocalQuery] = useState("");
  const [menu, setMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const value = onHeaderQuery ? (headerQuery ?? "") : localQuery;

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

  const name = profile?.fullName || "Dr. Ibrohim";
  const role = profile?.specialty || "Stomatolog";
  const avatar = profile?.avatarUrl || DEMO_AVATAR;

  return (
    <header className="dh-top" data-testid="desktop-header">
      <Link className="dh-logo" href="/" aria-label="StomaHub">
        <img src={DESKTOP_LOGO_SRC} alt="" data-testid="desktop-logo" data-logo-src={DESKTOP_LOGO_SRC} />
        <span>
          <span className="dh-word">
            Stoma<b>Hub</b>
          </span>
          <span className="dh-tag">Stomatologlar uchun yagona platforma</span>
        </span>
      </Link>
      <form className="dh-search" onSubmit={onSearch} role="search">
        <Search className="i" />
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => (onHeaderQuery ? onHeaderQuery(event.target.value) : setLocalQuery(event.target.value))}
          placeholder={searchPlaceholder}
          aria-label="Qidiruv"
        />
      </form>
      <nav className="dh-nav" aria-label="Bo‘limlar" data-testid="desktop-nav">
        {NAV.map((item) => {
          const on = item.test(pathname);
          return (
            <Link key={item.href} href={item.href} className={on ? "on" : undefined} aria-current={on ? "page" : undefined}>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="dh-actions">
        <Link className="dh-ic" href="/savat" aria-label="Savat" data-testid="desktop-cart">
          <ShoppingCart className="i" />
          {count > 0 ? (
            <em className="badge" data-testid="desktop-cart-badge">
              {count}
            </em>
          ) : null}
        </Link>
        <span className="dh-bell">
          <NotificationBell variant="desktop" buttonClassName="dh-icon-btn" />
        </span>
        <div className="dh-user">
          <button type="button" aria-label="Profil" aria-expanded={menu} aria-haspopup="menu" data-testid="desktop-profile" onClick={() => setMenu((open) => !open)}>
            <img src={avatar} alt="" />
            <span>
              <b>{name}</b>
              <small>{role}</small>
            </span>
            <ChevronDown className="chev" />
          </button>
          {menu ? (
            <div className="dh-menu" role="menu">
              <Link href="/profil" role="menuitem" onClick={() => setMenu(false)}>
                Profil
              </Link>
              {profile ? (
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
              ) : (
                <Link href="/kirish" role="menuitem" onClick={() => setMenu(false)}>
                  Kirish
                </Link>
              )}
            </div>
          ) : null}
        </div>
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
