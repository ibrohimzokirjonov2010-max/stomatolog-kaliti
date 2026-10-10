"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useSellerWork } from "@/components/seller-provider";
import { NotificationBell } from "@/components/notification-bell";


export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { count } = useCart();
  const { ready, profile } = useDoctorProfile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  const onIshlar = pathname === "/ishlar" || pathname.startsWith("/ishlar/");
  const onCommunity = pathname === "/community" || pathname.startsWith("/community/");
  const onLabs = pathname === "/laboratoriya" || pathname.startsWith("/laboratoriya/");
  const onSurplus = pathname === "/ortiqcha-material" || pathname.startsWith("/ortiqcha-material/");
  const onHome = pathname === "/" || pathname.startsWith("/bosh-sahifa");
  const onMarketplace = pathname === "/marketplace" || pathname.startsWith("/marketplace/");
  const onSotuvchi = pathname === "/sotuvchi" || pathname.startsWith("/marketplace/sotuvchi");
  const { session: sellerSession } = useSellerWork();
  const onCabinet = onSotuvchi && sellerSession?.verified === "active";
  const cabinetTab = useSearchParams().get("tab");
  const onUstalar = pathname === "/ustalar" || pathname.startsWith("/ustalar/");
  const onForma = pathname === "/forma" || pathname.startsWith("/forma/");

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
    const q = query.trim();
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
      const cur = new URLSearchParams(window.location.search).get("tab");
      const t = cur === "orders" || cur === "card" ? "orders" : cur === "messages" || cur === "reviews" ? cur : "products";
      router.push(q ? `/marketplace/sotuvchi?tab=${t}&q=${encodeURIComponent(q)}` : `/marketplace/sotuvchi?tab=${t}`);
      return;
    }
    if (onSotuvchi) {
      router.push(q ? `/marketplace?q=${encodeURIComponent(q)}` : "/marketplace");
      return;
    }
    router.push(q ? `/marketplace?q=${encodeURIComponent(q)}` : "/marketplace");
  }

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
    : onHome
    ? "Stomatologga nima kerak?"
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
                  : "Stomatologga nima kerak?";

  return (
    <header className="sticky top-0 z-30 flex h-[64px] items-center gap-4 border-b border-border bg-white px-5">
      <form onSubmit={onSearch} className="relative max-w-[560px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-full border border-border bg-[#f7f8fb] pr-14 pl-10 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:ring-3 focus:ring-primary/20"
        />
        {onUstalar || onForma ? null : (
          <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md border border-border bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-400">
            ⌘K
          </kbd>
        )}
      </form>

      <div className="ml-auto flex items-center gap-1.5">
        <Link
          href="/savat"
          className="relative flex size-10 items-center justify-center rounded-full hover:bg-slate-50"
          aria-label="Savat"
        >
          <ShoppingCart className="size-[18px] text-slate-600" />
          {count > 0 ? (
            <span className="absolute top-0.5 right-0.5 flex size-[18px] items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {count}
            </span>
          ) : null}
        </Link>

        <NotificationBell variant="desktop" />

        {ready && !profile ? (
          <Link
            href="/kirish"
            className="ml-1 inline-flex h-10 items-center justify-center rounded-full bg-[#0066FF] px-4 text-[13px] font-bold text-white shadow-[0_4px_12px_rgba(0,102,255,0.25)] hover:bg-[#0052cc]"
          >
            Kirish
          </Link>
        ) : null}
      </div>
    </header>
  );
}
