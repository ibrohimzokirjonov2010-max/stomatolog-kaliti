"use client";
/* eslint-disable @next/next/no-img-element -- catalog photos are sized by the fluid unit */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Heart, MapPin, Plus, Search, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import {
  MOBILE_SURPLUS_TOTAL,
  mobileSurplusChips,
  mobileSurplusItems,
  mobileSurplusSorts,
  type MobileSurplusChip,
  type MobileSurplusItem,
  type MobileSurplusSort,
} from "@/data/mobile-surplus";
import { formatMoney } from "@/lib/format";
import "./surplus-mobile.css";

const cities = [...new Set(mobileSurplusItems.map((item) => item.city))];
const conditions = [...new Set(mobileSurplusItems.map((item) => item.condition))];

export function SurplusMobileCatalog({ onPost }: { onPost: () => void }) {
  const { count } = useCart();
  const favorites = useFavorites();
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<MobileSurplusChip>("all");
  const [sort, setSort] = useState<MobileSurplusSort>("new");
  const [filters, setFilters] = useState(false);
  const [city, setCity] = useState("");
  const [condition, setCondition] = useState("");
  const cartBadge = count > 0 ? count : 3;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = mobileSurplusItems.filter((item) => {
      if (chip !== "all" && item.chip !== chip) return false;
      if (city && item.city !== city) return false;
      if (condition && item.condition !== condition) return false;
      if (!q) return true;
      return `${item.name} ${item.brand} ${item.spec} ${item.city}`.toLowerCase().includes(q);
    });
    if (sort === "cheap") return [...items].sort((a, b) => a.price - b.price);
    if (sort === "dear") return [...items].sort((a, b) => b.price - a.price);
    if (sort === "discount") return [...items].sort((a, b) => b.discount - a.discount);
    return items;
  }, [chip, city, condition, query, sort]);

  const narrowed = chip !== "all" || Boolean(query.trim()) || Boolean(city) || Boolean(condition);
  const shown = narrowed ? list.length : MOBILE_SURPLUS_TOTAL;

  return (
    <div className="om lg:hidden" data-testid="mobile-surplus">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/" className="mh-logo">
          STOMAHUB
        </Link>
        <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          <span className="mh-badge" data-testid="om-cart-badge">
            {cartBadge > 9 ? "9+" : cartBadge}
          </span>
        </Link>
        <NotificationBell variant="mobile" minBadge={2} buttonClassName="size-10 text-[#1a1d26]" />
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

        <div className="om-chips" role="tablist" aria-label="Kategoriyalar">
          {mobileSurplusChips.map((item) => (
            <button key={item.id} type="button" className={chip === item.id ? "on" : undefined} onClick={() => setChip(item.id)}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="om-tools">
          <b data-testid="om-count">{shown} ta e‘lon</b>
          <select aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as MobileSurplusSort)}>
            {mobileSurplusSorts.map((item) => (
              <option key={item.id} value={item.id}>
                Saralash: {item.label}
              </option>
            ))}
          </select>
        </div>

        {list.length === 0 ? (
          <p className="om-note">Mos e‘lon topilmadi</p>
        ) : (
          <div className="om-grid">
            {list.map((item) => (
              <SurplusCard key={item.id} item={item} saved={favorites.has(item.id)} onSave={() => favorites.toggle(item.id)} />
            ))}
          </div>
        )}
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
            <select aria-label="Holat" value={condition} onChange={(event) => setCondition(event.target.value)}>
              <option value="">Barcha holat</option>
              {conditions.map((item) => (
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
                  setCondition("");
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

function SurplusCard({ item, saved, onSave }: { item: MobileSurplusItem; saved: boolean; onSave: () => void }) {
  return (
    <article className="om-card">
      <div className="om-ph">
        <Link href={`/ortiqcha-material/${item.id}`} aria-label={item.name}>
          <img src={item.image} alt="" />
        </Link>
        <button type="button" className={saved ? "om-heart on" : "om-heart"} aria-label="Sevimlilar" aria-pressed={saved} onClick={onSave}>
          <Heart fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <Link href={`/ortiqcha-material/${item.id}`}>
        <h3>{item.name}</h3>
        <p className="spec">
          {item.brand} · {item.spec}
        </p>
        <div className="om-tags">
          <span className="ok">{item.condition}</span>
          <span>Yaroqlilik: {item.expiry}</span>
        </div>
        <div className="om-price">
          <b>{formatMoney(item.price, "UZS")}</b>
          <s>{formatMoney(item.oldPrice, "UZS")}</s>
          <em>-{item.discount}%</em>
        </div>
        <p className="om-pin">
          <MapPin /> {item.city}
        </p>
      </Link>
    </article>
  );
}
