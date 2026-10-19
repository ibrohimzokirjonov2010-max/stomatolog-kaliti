"use client";
/* eslint-disable @next/next/no-img-element -- catalog photos are fixed card crops */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Heart, LayoutGrid, MapPin, Plus, Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useFavorites } from "@/components/favorites-provider";
import { useSurplusWork } from "@/components/surplus-provider";
import { MobileBrandBar } from "@/components/mobile/MobileBrandBar";
import {
  mobileSurplusChips,
  mobileSurplusItems,
  mobileSurplusSorts,
  type MobileSurplusChip,
  type MobileSurplusSort,
} from "@/data/mobile-surplus";
import { surplusView, type SurplusView } from "./surplus-view";
import { formatMoney } from "@/lib/format";
import "./surplus-mobile.css";

export function SurplusMobileCatalog({ onPost }: { onPost: () => void }) {
  const favorites = useFavorites();
  const { feed } = useSurplusWork();
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<MobileSurplusChip>("all");
  const [sort, setSort] = useState<MobileSurplusSort>("new");
  const [filters, setFilters] = useState(false);
  const [city, setCity] = useState("");
  const [condition, setCondition] = useState("");

  const all = useMemo<SurplusView[]>(
    () => [...feed.filter((item) => item.active !== false).map(surplusView), ...mobileSurplusItems.map((item) => surplusView(item))],
    [feed],
  );
  const cities = useMemo(() => [...new Set(all.map((item) => item.city).filter(Boolean))], [all]);
  const conditions = useMemo(() => [...new Set(all.map((item) => item.condition).filter(Boolean))], [all]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = all.filter((item) => {
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
  }, [all, chip, city, condition, query, sort]);
  const active = Number(Boolean(city)) + Number(Boolean(condition));

  return (
    <div className="om lg:hidden" data-testid="mobile-surplus">
      <div className="om-body">
        <MobileBrandBar />
        <div className="om-title">
          <div className="mb-head">
            <h1>Ortiqcha material</h1>
            <p>Stomatologlarning ortiqcha, ishlatilmayotgan materiallari</p>
          </div>
          <button type="button" className="om-post" data-testid="om-post" onClick={onPost}>
            <Plus /> E’lon berish
          </button>
        </div>

        <form className="mb-search" onSubmit={(event) => event.preventDefault()}>
          <label>
            <Search />
            <input data-section-search value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Material, brend, nom, model..." aria-label="Qidiruv" />
          </label>
          <button type="button" className="mb-filter" aria-label="Filtr" aria-expanded={filters} data-testid="om-filter" onClick={() => setFilters(true)}>
            <SlidersHorizontal />
            {active ? <em>{active}</em> : null}
          </button>
        </form>

        <div className="mb-chips" role="tablist" aria-label="Kategoriyalar">
          {mobileSurplusChips.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={chip === item.id} className={chip === item.id ? "on" : undefined} onClick={() => setChip(item.id)}>
              {item.id === "all" ? <LayoutGrid /> : null}
              {item.label}
            </button>
          ))}
        </div>

        <div className="om-tools">
          <b data-testid="om-count">{list.length} ta e’lon</b>
          <label className="om-sort">
            <span>Saralash:</span>
            <select aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as MobileSurplusSort)}>
              {mobileSurplusSorts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown />
          </label>
        </div>

        {list.length === 0 ? (
          <div className="om-empty" data-testid="om-empty">
            <b>Mos e’lon topilmadi</b>
            <span>Filtrlarni o‘zgartiring yoki birinchi bo‘lib e’lon bering.</span>
          </div>
        ) : (
          <div className="om-grid">
            {list.map((item) => (
              <SurplusCard key={item.id} item={item} saved={favorites.has(item.id)} onSave={() => favorites.toggle(item.id)} />
            ))}
          </div>
        )}
      </div>

      {filters ? (
        <div className="mb-sheet" role="dialog" aria-label="Filtr">
          <button type="button" aria-label="Yopish" className="bg" onClick={() => setFilters(false)} />
          <form
            className="mb-panel"
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
                onClick={() => {
                  setCity("");
                  setCondition("");
                  setFilters(false);
                }}
              >
                Tozalash
              </button>
              <button type="submit" className="go">
                Ko‘rsatish ({list.length})
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function SurplusCard({ item, saved, onSave }: { item: SurplusView; saved: boolean; onSave: () => void }) {
  const href = `/ortiqcha-material/${item.id}`;
  return (
    <article className="om-card" data-testid="om-card" data-real={item.real ? "1" : undefined}>
      <div className="om-ph">
        <Link href={href} aria-label={item.name} tabIndex={-1}>
          <img src={item.image} alt="" />
        </Link>
        <button type="button" className={saved ? "om-heart on" : "om-heart"} aria-label="Sevimlilar" aria-pressed={saved} onClick={onSave}>
          <Heart fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <Link href={href} className="om-info">
        <h3>{item.name}</h3>
        <p className="spec">{[item.brand, item.spec].filter(Boolean).join(" · ")}</p>
        <div className="om-tags">
          {item.condition ? <span className="ok">{item.condition}</span> : null}
          {item.expiry ? <span>Yaroqlilik: {item.expiry}</span> : null}
        </div>
        <div className="om-price">
          <b>{formatMoney(item.price, "UZS")}</b>
          {item.oldPrice > item.price ? <s>{formatMoney(item.oldPrice, "UZS")}</s> : null}
          {item.discount > 0 ? <em>-{item.discount}%</em> : null}
        </div>
        <p className="om-pin">
          <MapPin /> {item.city}
        </p>
      </Link>
    </article>
  );
}
