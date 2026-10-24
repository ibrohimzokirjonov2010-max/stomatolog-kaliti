"use client";
/* eslint-disable @next/next/no-img-element -- mobile home sizes photos with the fluid unit */

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Filter,
  FlaskConical,
  GraduationCap,
  Package,
  Search,
  ShoppingBag,
  ShoppingCart,
  Shirt,
  Wrench,
  CalendarDays,
  Clock,
  Heart,
  MapPin,
  Star,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useCommunityWork } from "@/components/community-provider";
import { useSeminarRegs } from "@/components/seminar-provider";
import { getSeminarSpeakers, seminarDayMonth, seminarHref, seminarPriceText, upcomingSeminars, type Seminar } from "@/data/seminars";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import { catalogHref, fetchCatalogProducts, productFromCatalog, type CatalogCard } from "@/lib/catalog-client";
import { BONUS_SIGNUP_UZS } from "@/lib/bonus";
import { formatGroupedNumber, formatMoney } from "@/lib/format";
import "./mobile-home.css";

const tiles = [
  { href: "/seminarlar", label: "Seminarlar", icon: CalendarDays, bg: "#e7f6f4", color: "#1497a8" },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag, bg: "#F0FDFA", color: "#0F766E" },
  { href: "/ortiqcha-material", label: "Ortiqcha material", icon: Package, bg: "#fff1e6", color: "#f59e0b" },
  { href: "/forma", label: "Forma", icon: Shirt, bg: "#f3e8ff", color: "#8b5cf6" },
  { href: "/talim", label: "Ta’lim", icon: GraduationCap, bg: "#ffe8ee", color: "#f43f5e" },
  { href: "/kitoblar", label: "Kitoblar", icon: BookOpen, bg: "#F0FDFA", color: "#0F766E" },
  { href: "/ustalar", label: "Ustalar", icon: Wrench, bg: "#e7f6f4", color: "#0d9488" },
  { href: "/laboratoriya", label: "Laboratoriya", icon: FlaskConical, bg: "#f3e8ff", color: "#7c3aed" },
] as const;

/** "10:00"–"18:00" → "8 soat"; empty when either end is missing. */
function duration(seminar: Seminar) {
  const toMin = (value: string) => {
    const match = /^(\d{1,2}):(\d{2})/.exec(value || "");
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };
  const start = toMin(seminar.time);
  const end = toMin(seminar.timeEnd);
  if (start == null || end == null || end <= start) return "";
  const hours = Math.round(((end - start) / 60) * 2) / 2;
  return `${String(hours).replace(".", ",")} soat`;
}

export function MobileHome() {
  const { profile } = useDoctorProfile();
  const { count, add } = useCart();
  const favorites = useFavorites();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(false);
  const [deals, setDeals] = useState<CatalogCard[]>([]);
  useSeminarRegs(); // re-render when the seminar catalog arrives
  const { feed } = useCommunityWork();
  const seminarsToday = upcomingSeminars(2);
  const post = feed[0];
  const first = profile?.fullName?.replace(/^Dr\.?\s*/i, "").split(/\s+/).filter(Boolean)[0] || "";
  const cartBadge = count;

  useEffect(() => {
    void fetchCatalogProducts().then((rows) => {
      const sale = rows.filter((item) => (item.discount ?? 0) > 0);
      setDeals((sale.length ? sale : rows).slice(0, 4));
    });
  }, []);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/marketplace?q=${encodeURIComponent(q)}` : "/marketplace");
  }

  return (
    <div className="mh lg:hidden" data-testid="mobile-home">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/" className="mh-logo">STOMA<span>HUB</span></Link>
        <button type="button" className="mh-ic" aria-label="Qidirish" onClick={() => document.querySelector<HTMLInputElement>("[data-section-search]")?.focus()}>
          <Search />
        </button>
          <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          {cartBadge > 0 ? <span className="mh-badge" data-testid="home-cart-badge">{cartBadge > 9 ? "9+" : cartBadge}</span> : null}
        </Link>
        <NotificationBell variant="mobile" buttonClassName="size-10 text-[#1a1d26]" />
      </header>

      <div className="mh-body">
        <div className="mh-hello">
          {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span className="mh-ava" aria-hidden="true" />}
          <div>
            <b>{first ? `Salom, ${first}!` : "Salom!"}</b>
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
            <small>Marketplace’da</small>
            <b>{formatGroupedNumber(BONUS_SIGNUP_UZS)} so‘m bonus</b>
            <span>Birinchi xaridingizda foydalaning!</span>
          </div>
          <Link className="go" href="/bonuslarim">Batafsil →</Link>
        </section>

        <section>
          <div className="mh-head">
            <h2>Bugungi seminarlar</h2>
            <Link className="mh-more" href="/seminarlar">Barchasi &gt;</Link>
          </div>
          {seminarsToday.length === 0 ? (
            <p className="mh-empty" data-testid="home-seminars-empty">Hozircha seminar yo‘q.</p>
          ) : (
            <div className="mh-list">
              {seminarsToday.map((seminar) => {
                const speaker = getSeminarSpeakers(seminar)[0];
                const hours = duration(seminar);
                return (
                  <article className="mh-sem" key={seminar.id}>
                    <Link href={seminarHref(seminar.id)} className="mh-thumb">
                      {seminar.image ? <img src={seminar.image} alt="" /> : <span className="mh-thumb-empty" />}
                      <span className="mh-date">{seminarDayMonth(seminar.date)}</span>
                    </Link>
                    <div>
                      <Link href={seminarHref(seminar.id)}><h3>{seminar.title}</h3></Link>
                      <div className="mh-meta">
                        {speaker ? <span>{speaker.photo ? <img src={speaker.photo} alt="" className="mh-sp" /> : null}{speaker.name}</span> : null}
                        <span><MapPin /> {seminar.city}</span>
                        {hours ? <span><Clock /> {hours}</span> : null}
                      </div>
                    </div>
                    <div className="mh-side">
                      <b>{seminarPriceText(seminar)}</b>
                      <Link className="mh-reg" href={`${seminarHref(seminar.id)}/royxat`}>Ro‘yxatdan o‘tish</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="mh-head">
            <h2>Chegirmadagi mahsulotlar</h2>
            <Link className="mh-more" href="/marketplace">Barchasi &gt;</Link>
          </div>
          {deals.length === 0 ? <p className="mh-empty" data-testid="home-deals-empty">Hozircha mahsulot yo‘q.</p> : (
          <div className="mh-deals" style={{ marginTop: "calc(.7 * var(--u))" }}>
            {deals.map((deal) => {
              const saved = favorites.has(deal.id);
              const href = catalogHref(deal.category, deal.id);
              return (
                <article className="mh-deal" key={deal.id}>
                  <div className="mh-ph">
                    <Link href={href}>{deal.image ? <img src={deal.image} alt={deal.name} /> : null}</Link>
                    {deal.discount ? <span className="mh-off">-{deal.discount}%</span> : null}
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
                  <Link href={href}>
                    <p className="brand">{deal.brand}</p>
                    <h3>{deal.name}</h3>
                  </Link>
                  {deal.reviews > 0 ? (
                    <p className="mh-rate"><Star /> {deal.rating.toFixed(1)} <span>({deal.reviews} ta baho)</span></p>
                  ) : null}
                  <div className="mh-price">
                    <div>
                      <b>{formatMoney(deal.price, "UZS")}</b>
                      {deal.oldPrice ? <s>{formatMoney(deal.oldPrice, "UZS")}</s> : null}
                    </div>
                    <button
                      type="button"
                      className="mh-add"
                      aria-label={`${deal.name} savatga`}
                      onClick={() => add(deal.id, productFromCatalog(deal))}
                    >
                      <ShoppingCart />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          )}
        </section>

        <section>
          <div className="mh-head">
            <h2>Community</h2>
            <Link className="mh-more" href="/community">Barchasi &gt;</Link>
          </div>
          {post ? (
            <Link href={`/community/${post.id}`} className="mh-post" data-testid="home-community-post">
              <div>
                <div className="who">
                  {post.author.avatar ? <img src={post.author.avatar} alt="" /> : <span className="mh-ava sm" aria-hidden="true" />}
                  <span>
                    <b>{post.author.name}</b>
                    <span className="role">{[post.author.specialty, post.time].filter(Boolean).join(" · ")}</span>
                  </span>
                </div>
                <p>{post.text}</p>
              </div>
              {post.images?.[0] ? <img className="shot" src={post.images[0]} alt="" /> : null}
            </Link>
          ) : (
            <p className="mh-empty" data-testid="home-community-empty">Hozircha post yo‘q. <Link href="/community">Community</Link></p>
          )}
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
