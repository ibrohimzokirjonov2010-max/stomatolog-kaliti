"use client";
/* eslint-disable @next/next/no-img-element -- mobile home sizes photos with the fluid unit */

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  Clock,
  Filter,
  FlaskConical,
  GraduationCap,
  MapPin,
  MoreHorizontal,
  Package,
  Search,
  ShoppingBag,
  ShoppingCart,
  Shirt,
  Star,
  UserRound,
  Wrench,
  CalendarDays,
  Heart,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { NotificationBell } from "@/components/notification-bell";
import { seminarHref } from "@/data/seminars";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/data/products";
import "./mobile-home.css";

const tiles = [
  { href: "/seminarlar", label: "Seminarlar", icon: CalendarDays, bg: "#e7f6f4", color: "#1497a8" },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag, bg: "#e8f1ff", color: "#0066ff" },
  { href: "/ortiqcha-material", label: "Ortiqcha material", icon: Package, bg: "#fff1e6", color: "#f59e0b" },
  { href: "/forma", label: "Forma", icon: Shirt, bg: "#f3e8ff", color: "#8b5cf6" },
  { href: "/talim", label: "Ta’lim", icon: GraduationCap, bg: "#ffe8ee", color: "#f43f5e" },
  { href: "/kitoblar", label: "Kitoblar", icon: BookOpen, bg: "#e8f1ff", color: "#3b82f6" },
  { href: "/ustalar", label: "Ustalar", icon: Wrench, bg: "#e7f6f4", color: "#0d9488" },
  { href: "/laboratoriya", label: "Laboratoriya", icon: FlaskConical, bg: "#f3e8ff", color: "#7c3aed" },
] as const;

const seminars = [
  {
    id: "implantologiya-implantdan-tojgacha",
    date: "21/10",
    image: "/img/mobile/implant.jpg",
    title: "Implantologiya: Implantdan tojgacha",
    doctor: "Dr. Sardorbek Rahimov",
    city: "Toshkent",
    hours: "8 soat",
    price: 1_800_000,
  },
  {
    id: "endo-complex",
    date: "22/10",
    image: "/img/mobile/dilnoza.jpg",
    title: "Endodontiyada zamonaviy yondashuvlar",
    doctor: "Dr. Dilnoza Karimova",
    city: "Toshkent",
    hours: "6 soat",
    price: 1_200_000,
  },
] as const;

const sdrProduct: Product = {
  id: "home-sdr-flow",
  name: "SDR flow+",
  brand: "Dentsply Sirona",
  category: "materiallar",
  price: 920_000,
  oldPrice: 1_150_000,
  discount: 20,
  rating: 4.9,
  reviews: 124,
  inStock: true,
  delivery: "Toshkent 24 soat",
  image: "/img/mobile/sdr.jpg",
  description: "SDR flow+ kompozit, 2 × 1 g",
};

const deals = [
  {
    id: "kerr-optibond",
    brand: "Kerr",
    name: "OptiBond Solo Plus",
    size: "5 ml",
    discount: 15,
    rating: 4.8,
    reviews: 96,
    price: 275_000,
    old: 323_500,
    image: "/img/mobile/optibond.jpg",
    href: "/marketplace/kerr-optibond",
    extra: undefined as Product | undefined,
  },
  {
    id: sdrProduct.id,
    brand: "Dentsply Sirona",
    name: "SDR flow+",
    size: "2 × 1 g",
    discount: 20,
    rating: 4.9,
    reviews: 124,
    price: 920_000,
    old: 1_150_000,
    image: "/img/mobile/sdr.jpg",
    href: "/marketplace/sdr-flow",
    extra: sdrProduct,
  },
];

export function MobileHome() {
  const { profile } = useDoctorProfile();
  const { count, add } = useCart();
  const favorites = useFavorites();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(false);
  const [menu, setMenu] = useState(false);
  const first = (profile?.fullName ?? "Ibrohim").replace(/^Dr\.?\s*/i, "").split(/\s+/)[0] || "Ibrohim";
  const cartBadge = count > 0 ? count : 3;

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/marketplace?q=${encodeURIComponent(q)}` : "/marketplace");
  }

  return (
    <div className="mh lg:hidden" data-testid="mobile-home">
      <header className="mh-bar">
        <Link href="/" className="mh-logo">STOMAHUB</Link>
        <button type="button" className="mh-ic" aria-label="Qidirish" onClick={() => document.querySelector<HTMLInputElement>("[data-section-search]")?.focus()}>
          <Search />
        </button>
        <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          <span className="mh-badge" data-testid="home-cart-badge">{cartBadge > 9 ? "9+" : cartBadge}</span>
        </Link>
        <NotificationBell variant="mobile" minBadge={2} buttonClassName="size-10 text-[#1a1d26]" />
      </header>

      <div className="mh-body">
        <div className="mh-hello">
          <img src={profile?.avatarUrl || "/img/mobile/avatar.jpg"} alt="" />
          <div>
            <b>Salom, {first}!</b>
            <span>Stomatologlar uchun barcha narsa bir joyda</span>
          </div>
        </div>

        <form className="mh-search" onSubmit={onSearch}>
          <Search />
          <input
            data-section-search
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Stomatologga nima kerak?"
            aria-label="Qidiruv"
          />
          <button type="button" className="mh-filter" aria-label="Filtr" aria-expanded={filters} onClick={() => setFilters(true)}>
            <Filter />
          </button>
        </form>

        <nav className="mh-grid" aria-label="Tezkor bo‘limlar">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link key={tile.href} href={tile.href} className="mh-tile">
                <i style={{ background: tile.bg, color: tile.color }}><Icon /></i>
                {tile.label}
              </Link>
            );
          })}
        </nav>

        <section className="mh-banner">
          <img src="/img/mobile/gift.jpg" alt="" />
          <div>
            <b>Marketplace’da <em>10 000 so‘m bonus</em></b>
            <span>Birinchi xaridingizda foydalaning!</span>
          </div>
          <Link className="go" href="/bonuslarim">Batafsil →</Link>
        </section>

        <section>
          <div className="mh-head">
            <h2>Bugungi seminarlar</h2>
            <Link className="mh-more" href="/seminarlar">Barchasi &gt;</Link>
          </div>
          <div className="mh-list" style={{ marginTop: "calc(.7 * var(--u))" }}>
            {seminars.map((seminar) => (
              <article className="mh-sem" key={seminar.id}>
                <div className="mh-thumb">
                  <img src={seminar.image} alt="" />
                  <span className="mh-date">{seminar.date}</span>
                </div>
                <div>
                  <h3>{seminar.title}</h3>
                  <div className="mh-meta">
                    <span><UserRound /> {seminar.doctor}</span>
                    <span><MapPin /> {seminar.city}</span>
                    <span><Clock /> {seminar.hours}</span>
                    <span><Award /> Sertifikat</span>
                  </div>
                </div>
                <div className="mh-side">
                  <b>{formatMoney(seminar.price, "UZS")}</b>
                  <Link className="mh-reg" href={seminarHref(seminar.id)}>Ro‘yxatdan o‘tish</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="mh-head">
            <h2>Chegirmadagi mahsulotlar</h2>
            <Link className="mh-more" href="/marketplace">Barchasi &gt;</Link>
          </div>
          <div className="mh-deals" style={{ marginTop: "calc(.7 * var(--u))" }}>
            {deals.map((deal) => {
              const saved = favorites.has(deal.id);
              return (
                <article className="mh-deal" key={deal.id}>
                  <div className="mh-ph">
                    <Link href={deal.href}><img src={deal.image} alt={deal.name} /></Link>
                    <span className="mh-off">-{deal.discount}%</span>
                    <button
                      type="button"
                      className={saved ? "mh-heart on" : "mh-heart"}
                      aria-label={saved ? "Saqlangan" : "Saqlash"}
                      aria-pressed={saved}
                      onClick={() => favorites.toggle(deal.id)}
                    >
                      <Heart fill={saved ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <Link href={deal.href}>
                    <p className="brand">{deal.brand}</p>
                    <h3>{deal.name}</h3>
                    <p className="size">{deal.size}</p>
                  </Link>
                  <p className="mh-rate"><Star /> {deal.rating} ({deal.reviews} ta baho)</p>
                  <div className="mh-price">
                    <div>
                      <b>{formatMoney(deal.price, "UZS")}</b>
                      <s>{formatMoney(deal.old, "UZS")}</s>
                    </div>
                    <button
                      type="button"
                      className="mh-add"
                      aria-label={`${deal.name} savatga`}
                      onClick={() => add(deal.id, deal.extra)}
                    >
                      <ShoppingCart />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mh-head">
            <h2>Community</h2>
            <Link className="mh-more" href="/community">Barchasi &gt;</Link>
          </div>
          <article className="mh-post" style={{ marginTop: "calc(.7 * var(--u))" }}>
            <div>
              <div className="top">
                <div className="who">
                  <img src="/img/mobile/dilnoza.jpg" alt="" />
                  <div>
                    <h3>Dr. Nigora Saidova</h3>
                    <p className="role">Stomatolog · 2 soat oldin</p>
                  </div>
                </div>
                <button type="button" className="mh-dots" aria-label="Yana" aria-expanded={menu} onClick={() => setMenu((open) => !open)}>
                  <MoreHorizontal />
                </button>
              </div>
              <p>Klinikada raqamli skaner bilan ishlash tajribam. Juda qulay va aniq natijalar beradi. Sizlarda qanday tajriba?</p>
              {menu ? (
                <Link href="/community" className="mh-more">Muhokamani ochish</Link>
              ) : null}
            </div>
            <img className="shot" src="/img/mobile/aligner.jpg" alt="" />
          </article>
        </section>
      </div>

      {filters ? (
        <div className="mh-sheet" role="presentation" onClick={() => setFilters(false)}>
          <div className="mh-panel" role="dialog" aria-label="Filtr" onClick={(event) => event.stopPropagation()}>
            <h3>Qayerdan qidiramiz?</h3>
            {tiles.map((tile) => (
              <Link key={tile.href} href={tile.href}>{tile.label}</Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
