"use client";
/* eslint-disable @next/next/no-img-element -- seller uploads are sized by the fluid unit */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Heart, MapPin, Plus, Search, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import { useSurplusWork } from "@/components/surplus-provider";
import { conditionLabel, listingExpiry, surplusCategoryLabel, type SurplusListing } from "@/data/surplus";
import { formatMoney } from "@/lib/format";
import "./surplus-mobile.css";

type Sort = "new" | "cheap" | "dear";

export function SurplusMobileCatalog({ onPost }: { onPost: () => void }) {
  const { count } = useCart();
  const favorites = useFavorites();
  const { feed, ready } = useSurplusWork();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("new");
  const [filters, setFilters] = useState(false);
  const [city, setCity] = useState("");

  const cities = useMemo(() => [...new Set(feed.map((item) => item.city).filter(Boolean))], [feed]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = feed.filter((item) => {
      if (city && item.city !== city) return false;
      if (!q) return true;
      return `${item.name} ${item.brand} ${item.seller} ${item.city}`.toLowerCase().includes(q);
    });
    if (sort === "cheap") return [...items].sort((a, b) => a.price - b.price);
    if (sort === "dear") return [...items].sort((a, b) => b.price - a.price);
    return items;
  }, [city, feed, query, sort]);

  return (
    <div className="om lg:hidden" data-testid="mobile-surplus">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/" className="mh-logo">
          STOMAHUB
        </Link>
        <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          {count > 0 ? (
            <span className="mh-badge" data-testid="om-cart-badge">
              {count > 9 ? "9+" : count}
            </span>
          ) : null}
        </Link>
        <NotificationBell variant="mobile" buttonClassName="size-10 text-[#1a1d26]" />
      </header>

      <div className="om-body">
        <div className="om-title">
          <h1>Ortiqcha material</h1>
          <button type="button" className="om-post" onClick={onPost}>
            <Plus /> E‘lon berish
          </button>
        </div>
        <p className="om-sub">Stomatologlarning ortiqcha, ishlatilmayotgan materiallari</p>

        <form className="om-search" onSubmit={(event) => event.preventDefault()}>
          <Search />
          <input
            data-section-search
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Material, brend, nom, model..."
            aria-label="Qidiruv"
          />
          <button type="button" className="om-filter" aria-label="Filtr" aria-expanded={filters} onClick={() => setFilters(true)}>
            <SlidersHorizontal />
          </button>
        </form>

        <div className="om-tools">
          <b data-testid="om-count">{ready ? list.length : "…"} ta e‘lon</b>
          <select aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
            <option value="new">Saralash: Eng yangi</option>
            <option value="cheap">Saralash: Arzon</option>
            <option value="dear">Saralash: Qimmat</option>
          </select>
        </div>

        {!ready ? <p className="om-note">Yuklanmoqda...</p> : null}
        {ready && list.length === 0 ? (
          <p className="om-note" data-testid="surplus-mobile-empty">
            {feed.length === 0 ? "Hozircha e’lonlar yo‘q" : "Mos e’lon topilmadi"}
          </p>
        ) : null}
        {list.length > 0 ? (
          <div className="om-grid">
            {list.map((item) => (
              <SurplusCard key={item.id} item={item} saved={favorites.has(item.id)} onSave={() => favorites.toggle(item.id)} />
            ))}
          </div>
        ) : null}
      </div>

      {filters ? (
        <div className="om-sheet" role="dialog" aria-label="Filtr">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setFilters(false)} />
          <form
            className="om-panel"
            onSubmit={(event) => {
              event.preventDefault();
              setFilters(false);
            }}
          >
            <h3>Filtr</h3>
            <select aria-label="Shahar" value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="">Barcha shaharlar</option>
              {cities.map((item) => (
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
                  setCity("");
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

function SurplusCard({ item, saved, onSave }: { item: SurplusListing; saved: boolean; onSave: () => void }) {
  return (
    <article className="om-card">
      <div className="om-ph">
        <Link href={`/ortiqcha-material/${item.id}`} aria-label={item.name}>
          {item.image ? <img src={item.image} alt="" /> : <span className="om-note">Rasm yo‘q</span>}
        </Link>
        <button type="button" className={saved ? "om-heart on" : "om-heart"} aria-label="Sevimlilar" aria-pressed={saved} onClick={onSave}>
          <Heart fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <Link href={`/ortiqcha-material/${item.id}`}>
        <h3>{item.name}</h3>
        <p className="spec">
          {item.brand} · {surplusCategoryLabel(item.category)}
        </p>
        <div className="om-tags">
          <span className="ok">{item.condition ? conditionLabel[item.condition] : "Holat ko‘rsatilmagan"}</span>
          <span>Yaroqlilik: {listingExpiry(item)}</span>
        </div>
        <div className="om-price">
          <b>{formatMoney(item.price, "UZS")}</b>
        </div>
        <p className="om-pin">
          <MapPin /> {item.city || "Shahar ko‘rsatilmagan"}
        </p>
      </Link>
    </article>
  );
}
