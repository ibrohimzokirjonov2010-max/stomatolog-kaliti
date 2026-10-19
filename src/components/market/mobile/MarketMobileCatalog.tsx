"use client";
/* eslint-disable @next/next/no-img-element -- catalog photos are sized by the fluid unit */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  ChevronRight,
  FlaskConical,
  Heart,
  LayoutGrid,
  List,
  Monitor,
  Package,
  Scissors,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import {
  MOBILE_MARKET_TOTAL,
  mobileMarketCatalog,
  mobileMarketChips,
  mobileMarketProduct,
  type MobileMarketChip,
  type MobileMarketItem,
} from "@/data/mobile-market";
import { formatMoney } from "@/lib/format";
import "./market-mobile.css";

const icons = {
  materiallar: Package,
  implantlar: Package,
  asboblar: Scissors,
  jihozlar: Monitor,
  laboratoriya: FlaskConical,
} as const;

type SortId = "shown" | "dear" | "rating";

export function MarketMobileCatalog() {
  const params = useSearchParams();
  const { count, add } = useCart();
  const favorites = useFavorites();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [chip, setChip] = useState<MobileMarketChip>("materiallar");
  const [sort, setSort] = useState<SortId>("shown");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState(false);
  const [brand, setBrand] = useState("");
  const cartBadge = count > 0 ? count : 3;
  const brands = [...new Set(mobileMarketCatalog.map((item) => item.brand))];

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = mobileMarketCatalog.filter((item) => {
      if (item.chip !== chip) return false;
      if (brand && item.brand !== brand) return false;
      if (!q) return true;
      return `${item.brand} ${item.name} ${item.spec}`.toLowerCase().includes(q);
    });
    if (sort === "dear") return [...items].sort((a, b) => b.price - a.price);
    if (sort === "rating") return [...items].sort((a, b) => b.rating - a.rating);
    return items;
  }, [brand, chip, query, sort]);

  const narrowed = chip !== "materiallar" || Boolean(query.trim()) || Boolean(brand);
  const shown = narrowed ? list.length : MOBILE_MARKET_TOTAL;
  const badge = 1 + (brand ? 1 : 0);

  return (
    <div className="mk lg:hidden" data-testid="mobile-market">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/" className="mh-logo">
          STOMAHUB
        </Link>
        <button type="button" className="mh-ic" aria-label="Qidirish" onClick={() => document.querySelector<HTMLInputElement>("[data-market-search]")?.focus()}>
          <Search />
        </button>
        <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          <span className="mh-badge" data-testid="mk-cart-badge">
            {cartBadge > 9 ? "9+" : cartBadge}
          </span>
        </Link>
        <NotificationBell variant="mobile" minBadge={2} buttonClassName="size-10 text-[#1a1d26]" />
      </header>

      <div className="mk-body">
        <Link href="/kategoriyalar" className="mk-jump" data-testid="mk-kategoriyalar">Kategoriyalar</Link>
        <form className="mk-search" onSubmit={(event) => event.preventDefault()}>
          <Search />
          <input
            data-market-search
            data-section-search
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Stomatologga nima kerak?"
            aria-label="Qidiruv"
          />
        </form>

        <Link href="/bonuslarim" className="mk-banner">
          <img src="/img/mobile/gift.jpg" alt="" />
          <div>
            <b>
              <em>10 000 so‘m bonus</em> oling!
            </b>
            <span>Ilovada ro‘yxatdan o‘ting va birinchi xaridingizda foydalaning.</span>
          </div>
          <ChevronRight className="go" />
        </Link>

        <div className="mk-chips" aria-label="Kategoriyalar">
          {mobileMarketChips.map((item) => {
            const Icon = icons[item.id];
            return (
              <button key={item.id} type="button" className={chip === item.id ? "on" : undefined} onClick={() => setChip(item.id)}>
                <Icon />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mk-tools">
          <button type="button" className="mk-filter" onClick={() => setFilters(true)}>
            <SlidersHorizontal />
            Filtrlar
            <i>{badge}</i>
          </button>
          <p className="mk-count" data-testid="mk-count">
            {shown} ta natija
          </p>
          <label className="mk-sort">
            <ArrowUpDown />
            <select aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as SortId)}>
              <option value="shown">Arzonroq</option>
              <option value="dear">Qimmatroq</option>
              <option value="rating">Reyting</option>
            </select>
          </label>
          <div className="mk-view">
            <button type="button" className={view === "grid" ? "on" : undefined} aria-label="Grid ko‘rinish" onClick={() => setView("grid")}>
              <LayoutGrid />
            </button>
            <button type="button" className={view === "list" ? "on" : undefined} aria-label="Ro‘yxat ko‘rinish" onClick={() => setView("list")}>
              <List />
            </button>
          </div>
        </div>

        {list.length === 0 ? (
          <p className="mk-note">Mos mahsulot topilmadi</p>
        ) : (
          <div className={view === "list" ? "mk-grid list" : "mk-grid"}>
            {list.map((item) => (
              <MarketCard
                key={item.id}
                item={item}
                saved={favorites.has(item.id)}
                onSave={() => favorites.toggle(item.id)}
                onAdd={() => add(item.id, mobileMarketProduct(item))}
              />
            ))}
          </div>
        )}
      </div>

      {filters ? (
        <div className="mk-sheet" role="dialog" aria-label="Filtrlar">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setFilters(false)} />
          <form
            className="mk-panel"
            onSubmit={(event) => {
              event.preventDefault();
              setFilters(false);
            }}
          >
            <h3>Filtrlar</h3>
            <select aria-label="Brend" value={brand} onChange={(event) => setBrand(event.target.value)}>
              <option value="">Barcha brendlar</option>
              {brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <div className="row">
              <button
                type="button"
                className="go"
                style={{ background: "#eef2f6", color: "#24344d" }}
                onClick={() => {
                  setBrand("");
                  setFilters(false);
                }}
              >
                Tozalash
              </button>
              <button type="submit" className="go">
                Ko‘rish
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function MarketCard({
  item,
  saved,
  onSave,
  onAdd,
}: {
  item: MobileMarketItem;
  saved: boolean;
  onSave: () => void;
  onAdd: () => void;
}) {
  return (
    <article className="mk-card">
      <div className="mk-ph">
        <Link href={`/marketplace/${item.id}`} aria-label={item.name}>
          <img src={item.image} alt="" />
        </Link>
        <span className="mk-off">-{item.discount}%</span>
        <button type="button" className={saved ? "mk-heart on" : "mk-heart"} aria-label="Sevimlilar" aria-pressed={saved} onClick={onSave}>
          <Heart fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <Link href={`/marketplace/${item.id}`}>
        <p className="brand">{item.brand}</p>
        <h3>{item.name}</h3>
        <p className="spec">{item.spec}</p>
        <p className="mk-rate">
          <Star /> {item.rating} ({item.reviews} ta baho)
        </p>
        <div className="mk-price">
          <div>
            <b>{formatMoney(item.price, "UZS")}</b>
            <s>{formatMoney(item.oldPrice, "UZS")}</s>
          </div>
          <span className="mk-live">Sotuvda</span>
        </div>
      </Link>
      <button type="button" className="mk-add" onClick={onAdd}>
        <ShoppingCart /> Savatga
      </button>
    </article>
  );
}
