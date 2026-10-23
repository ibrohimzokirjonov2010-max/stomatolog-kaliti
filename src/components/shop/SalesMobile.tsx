"use client";
/* eslint-disable @next/next/no-img-element -- phone cards use fixed-size thumbs */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronDown, Flame, Gift, Heart, Percent, Search, Settings2, ShoppingCart, Star } from "lucide-react";
import { useFavorites } from "@/components/favorites-provider";
import { useCart } from "@/components/cart-provider";
import { catalogHref, fetchCatalogProducts, productFromCatalog, type CatalogCard } from "@/lib/catalog-client";
import { formatMoney } from "@/lib/format";
import "./sales-mobile.css";

type SaleSort = "mashhurlik" | "chegirma" | "arzon" | "qimmat";

const chips = [
  { id: "materiallar", label: "Materiallar" },
  { id: "implantlar", label: "Implantlar" },
  { id: "asboblar", label: "Asboblar" },
  { id: "jihozlar", label: "Jihozlar" },
  { id: "laboratoriya", label: "Laboratoriya" },
  { id: "forma", label: "Forma" },
] as const;

/** Phone sale list. Discounted catalog rows only. */
export function SalesMobile() {
  const { add } = useCart();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SaleSort>("mashhurlik");
  const [rows, setRows] = useState<CatalogCard[] | null>(null);
  const [brand, setBrand] = useState("");
  const favorites = useFavorites();

  useEffect(() => {
    let stop = false;
    void fetchCatalogProducts().then((items) => {
      if (!stop) setRows(items.filter((item) => (item.discount ?? 0) > 0 && item.oldPrice));
    });
    return () => {
      stop = true;
    };
  }, []);

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = (rows ?? []).filter((item) => {
      if (category && item.category !== category) return false;
      if (query && !`${item.name} ${item.brand}`.toLowerCase().includes(query)) return false;
      return true;
    });
    if (sort === "chegirma") list.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
    else if (sort === "arzon") list.sort((a, b) => a.price - b.price);
    else if (sort === "qimmat") list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => b.reviews - a.reviews);
    return list;
  }, [category, q, rows, sort]);

  const brands = Array.from(new Set((rows ?? []).map((item) => item.brand))).sort();
  const shown = brand ? items.filter((item) => item.brand === brand) : items;

  return (
    <div className="sl lg:hidden" data-testid="sales-mobile">
      <header className="sl-head">
        <div>
          <h1>Aksiyalar</h1>
          <p>Stomatologik mahsulotlarda maxsus takliflar</p>
        </div>
        <Link href="/marketplace" className="sl-all"><Gift /> Marketplace</Link>
      </header>
      <label className="sl-search">
        <Search />
        <input aria-label="Aksiyalarda qidirish" value={q} placeholder="Mahsulot, brend yoki kategoriya qidirish..." onChange={(event) => setQ(event.target.value)} />
      </label>
      <div className="sl-chips">
        <button type="button" className={category === "" ? "on" : ""} onClick={() => setCategory("")}>Barchasi</button>
        {chips.map((item) => (
          <button key={item.id} type="button" className={category === item.id ? "on" : ""} onClick={() => setCategory(item.id)}>{item.label}</button>
        ))}
      </div>
      <div className="sl-sorts">
        <button type="button" className={sort === "mashhurlik" ? "on" : ""} onClick={() => setSort("mashhurlik")}><Flame /> Eng mashhur</button>
        <button type="button" className={sort === "chegirma" ? "on" : ""} onClick={() => setSort("chegirma")}><Percent /> Chegirma</button>
        <button type="button" className={sort === "arzon" || sort === "qimmat" ? "on" : ""} onClick={() => setSort(sort === "arzon" ? "qimmat" : "arzon")}><ArrowUpDown /> {sort === "qimmat" ? "Qimmat" : "Arzon"}</button>
        <label className="sl-brand">
          <Settings2 />
          <select aria-label="Brend" value={brand} onChange={(event) => setBrand(event.target.value)}>
            <option value="">Brendlar</option>
            {brands.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <ChevronDown />
        </label>
      </div>
      {rows === null || shown.length === 0 ? (
        <p className="sl-empty">{rows === null ? "Yuklanmoqda…" : rows.length === 0 ? "Hozircha aksiya yo‘q" : "Aksiya topilmadi"}</p>
      ) : (
        <ul className="sl-list">
          {shown.map((item) => {
            const href = catalogHref(item.category, item.id);
            const liked = favorites.has(item.id);
            const sub = item.subcategory || item.description.split(/[.\n]/)[0];
            return (
              <li key={item.id} className="sl-card">
                <Link href={href} className="sl-img">
                  {item.image ? <img src={item.image} alt="" /> : null}
                  {item.discount ? <span>-{item.discount}%</span> : null}
                </Link>
                <div className="sl-body">
                  <small>{item.brand}</small>
                  <Link href={href} className="sl-name">{item.name}</Link>
                  {sub ? <p className="sl-sub">{sub}</p> : null}
                  {item.reviews > 0 ? <p className="sl-rate"><Star /> {item.rating.toFixed(1)} <span>({item.reviews} ta sharh)</span></p> : null}
                  <p className="sl-price"><b>{formatMoney(item.price, "UZS")}</b>{item.oldPrice ? <s>{formatMoney(item.oldPrice, "UZS")}</s> : null}</p>
                </div>
                <div className="sl-side">
                  <button type="button" className={liked ? "sl-like on" : "sl-like"} aria-label="Saqlash" aria-pressed={liked} onClick={() => favorites.toggle(item.id)}><Heart /></button>
                  <button type="button" className="sl-cart" aria-label={`${item.name} savatga`} disabled={!item.inStock} onClick={() => add(item.id, productFromCatalog(item))}><ShoppingCart /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
