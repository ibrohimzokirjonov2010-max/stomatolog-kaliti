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
  Wrench,
  CalendarDays,
  Heart,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useCommunityWork } from "@/components/community-provider";
import { MobileBrandBar } from "@/components/mobile/MobileBrandBar";
import { mobileMarketItems, mobileMarketProduct, type MobileMarketItem } from "@/data/mobile-market";
import { mobileSeminars } from "@/data/mobile-seminars";
import { initialsFromName } from "@/lib/doctor-profile";
import { formatMoney } from "@/lib/format";
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

/** Home deals: the same catalog items as the Marketplace (priced by the order API). */
const deals = ["kerr-optibond", "mm-sdr-flow"].map((id) => mobileMarketItems.find((item) => item.id === id)).filter((item): item is MobileMarketItem => Boolean(item));

function upcomingSeminars() {
  const today = new Date().toISOString().slice(0, 10);
  const next = mobileSeminars.filter((item) => item.day >= today).sort((a, b) => a.day.localeCompare(b.day));
  return (next.length ? next : mobileSeminars).slice(0, 2);
}

export function MobileHome() {
  const { profile } = useDoctorProfile();
  const { add } = useCart();
  const favorites = useFavorites();
  const { feed } = useCommunityWork();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(false);
  const [menu, setMenu] = useState(false);
  const [note, setNote] = useState("");
  const name = (profile?.fullName ?? "").replace(/^Dr\.?\s*/i, "").trim();
  const first = name.split(/\s+/)[0] || "doktor";
  const seminars = upcomingSeminars();
  const post = feed.find((item) => !item.demo) ?? feed[0];

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/marketplace?q=${encodeURIComponent(q)}` : "/marketplace");
  }

  return (
    <div className="mh lg:hidden" data-testid="mobile-home">
      <div className="mh-body">
        <MobileBrandBar search />
        <div className="mh-hello">
          {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span className="mh-ini">{initialsFromName(profile?.fullName ?? "S H")}</span>}
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
              <article className="mh-sem" key={seminar.id} data-testid="home-seminar">
                <Link href={`/seminarlar/${seminar.id}`} className="mh-thumb">
                  <img src={seminar.image} alt="" />
                  <span className="mh-date">{seminar.dateBadge.split(" ")[0]}</span>
                </Link>
                <div>
                  <h3><Link href={`/seminarlar/${seminar.id}`}>{seminar.title}</Link></h3>
                  <div className="mh-meta">
                    <span><img className="sp" src={seminar.speakerImage} alt="" /> {seminar.speaker}</span>
                    <span><MapPin /> {seminar.place.split(",").pop()?.trim()}</span>
                    <span><Clock /> {seminar.time}</span>
                    <span><Award /> Sertifikat</span>
                  </div>
                </div>
                <div className="mh-side">
                  <b>{formatMoney(seminar.price, "UZS")}</b>
                  <Link className="mh-reg" href={`/seminarlar/${seminar.id}`}>Ro‘yxatdan o‘tish</Link>
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
              const href = `/marketplace/${deal.id}`;
              return (
                <article className="mh-deal" key={deal.id}>
                  <div className="mh-ph">
                    <Link href={href}><img src={deal.image} alt={deal.name} /></Link>
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
                  <Link href={href}>
                    <p className="brand">{deal.brand}</p>
                    <h3>{deal.name}</h3>
                    <p className="size">{deal.spec}</p>
                  </Link>
                  <p className="mh-rate"><Star /> {deal.rating} ({deal.reviews} ta baho)</p>
                  <div className="mh-price">
                    <div>
                      <b>{formatMoney(deal.price, "UZS")}</b>
                      <s>{formatMoney(deal.oldPrice, "UZS")}</s>
                    </div>
                    <button
                      type="button"
                      className="mh-add"
                      aria-label={`${deal.name} savatga`}
                      data-testid="home-deal-add"
                      onClick={() => {
                        add(deal.id, mobileMarketProduct(deal));
                        setNote(`${deal.name} savatga qo‘shildi`);
                      }}
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
          {post ? (
            <article className="mh-post" style={{ marginTop: "calc(.7 * var(--u))" }} data-testid="home-post">
              <div>
                <div className="top">
                  <div className="who">
                    {post.author.avatar ? <img src={post.author.avatar} alt="" /> : <span className="mh-ini sm">{initialsFromName(post.author.name)}</span>}
                    <div>
                      <h3>{post.author.name}</h3>
                      <p className="role">{post.author.specialty || "Stomatolog"} · {post.time}</p>
                    </div>
                  </div>
                  <button type="button" className="mh-dots" aria-label="Yana" aria-expanded={menu} onClick={() => setMenu((open) => !open)}>
                    <MoreHorizontal />
                  </button>
                </div>
                <p>{post.text}</p>
                {menu ? (
                  <Link href={`/community?post=${post.id}`} className="mh-more">Muhokamani ochish</Link>
                ) : null}
              </div>
              {post.images?.[0] ? <img className="shot" src={post.images[0]} alt="" /> : null}
            </article>
          ) : (
            <Link href="/community" className="mh-post empty" style={{ marginTop: "calc(.7 * var(--u))" }}>
              Hamjamiyatda birinchi bo‘lib tajribangiz bilan bo‘lishing →
            </Link>
          )}
        </section>
        {note ? <p className="mh-note" role="status">{note}</p> : null}
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
