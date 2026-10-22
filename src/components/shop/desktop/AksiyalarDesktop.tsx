"use client";
/* eslint-disable @next/next/no-img-element -- sale photos are fixed-size cards */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Heart, Search, ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { fetchCatalogProducts, productFromCatalog, type CatalogCard } from "@/lib/catalog-client";
import { formatMoney } from "@/lib/format";
import { MarketFrame } from "./MarketFrame";
import "./aksiyalar.css";

type SaleSort = "mashhurlik" | "chegirma" | "arzon" | "qimmat";

const chips = [
  { id: "materiallar", label: "Materiallar" },
  { id: "implantlar", label: "Implantlar" },
  { id: "asboblar", label: "Asboblar" },
  { id: "jihozlar", label: "Jihozlar" },
  { id: "laboratoriya", label: "Laboratoriya" },
  { id: "forma", label: "Forma" },
] as const;

function onSale(item: CatalogCard) {
  return (item.discount ?? 0) > 0 && Boolean(item.oldPrice);
}

export function AksiyalarDesktop() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SaleSort>("mashhurlik");
  const [saved, setSaved] = useState<string[]>([]);
  const [rows, setRows] = useState<CatalogCard[] | null>(null);

  useEffect(() => {
    let stop = false;
    void fetchCatalogProducts().then((items) => {
      if (!stop) setRows(items.filter(onSale));
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
    else list.sort((a, b) => b.reviews - a.reviews || b.rating - a.rating);
    return list;
  }, [category, q, rows, sort]);

  function reset() {
    setQ("");
    setCategory("");
    setSort("mashhurlik");
  }

  function toggleSave(id: string) {
    setSaved((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <MarketFrame
      active="sale"
      promoTitle="Maxsus aksiyalar va chegirmalar"
      promoText="Stomatologiya mahsulotlarini arzon narxlarda xarid qiling!"
      promoCta="Barcha aksiyalar"
      promoImage="/img/design-pr13/categories/terapiya.png"
      promoIcon={<span className="ax-pct">%</span>}
      onPromo={reset}
    >
      <div data-testid="sales-desktop">
        <div className="ax-head">
          <div>
            <h1>Aksiyalar</h1>
            <p>Maxsus takliflar va chegirmalar</p>
          </div>
          <div className="ax-tools">
            <label className="ax-search">
              <Search className="i" />
              <input data-testid="sale-search" aria-label="Aksiyalarda qidirish" value={q} placeholder="Aksiyalarda qidirish..." onChange={(event) => setQ(event.target.value)} />
            </label>
            <label className="ax-sort">
              <select data-testid="sale-sort" aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as SaleSort)}>
                <option value="mashhurlik">Mashhurlik bo‘yicha</option>
                <option value="chegirma">Chegirma %</option>
                <option value="arzon">Arzon</option>
                <option value="qimmat">Qimmat</option>
              </select>
              <ChevronRight className="i" style={{ transform: "rotate(90deg)" }} />
            </label>
          </div>
        </div>
        <div className="ax-chips" role="tablist" aria-label="Kategoriya">
          <button type="button" className={category === "" ? "on" : undefined} data-testid="sale-chip-all" onClick={() => setCategory("")}>
            Barchasi
          </button>
          {chips.map((item) => (
            <button key={item.id} type="button" className={category === item.id ? "on" : undefined} data-testid={`sale-chip-${item.id}`} onClick={() => setCategory(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        {rows === null || items.length === 0 ? (
          <div className="ax-empty" data-testid="sale-empty">
            <p>{rows === null ? "Yuklanmoqda..." : rows.length === 0 ? "Hozircha aksiya yo‘q" : "Aksiya topilmadi"}</p>
            {rows && rows.length > 0 ? (
              <button type="button" onClick={reset}>
                Tozalash
              </button>
            ) : null}
          </div>
        ) : (
          <div className="ax-grid">
            {items.map((item) => (
              <SaleCard key={item.id} item={item} saved={saved.includes(item.id)} onSave={() => toggleSave(item.id)} />
            ))}
          </div>
        )}
      </div>
    </MarketFrame>
  );
}

function SaleCard({ item, saved, onSave }: { item: CatalogCard; saved: boolean; onSave: () => void }) {
  const { add } = useCart();
  const [pulse, setPulse] = useState(false);

  function addToCart() {
    add(item.id, productFromCatalog(item));
    setPulse(true);
    window.setTimeout(() => setPulse(false), 280);
  }

  return (
    <article className="ax-card" data-testid="sale-card">
      <div className="ax-ph">
        <Link href={`/marketplace/${item.id}`}>{item.image ? <img src={item.image} alt="" /> : null}</Link>
        {item.discount ? <span className="ax-off">-{item.discount}%</span> : null}
        <button type="button" className={saved ? "ax-heart on" : "ax-heart"} data-testid="sale-heart" aria-label="Sevimlilar" aria-pressed={saved} onClick={onSave}>
          <Heart className="i" />
        </button>
      </div>
      <h3>
        <Link href={`/marketplace/${item.id}`}>{item.name}</Link>
      </h3>
      <p className="ax-brand">{item.brand}</p>
      <p className="ax-meta">
        <Star className="star i" />
        <b>
          {item.rating} ({item.reviews})
        </b>
      </p>
      <div className="ax-buy">
        <span>
          <b>{formatMoney(item.price, "UZS")}</b>
          {item.oldPrice ? <s>{formatMoney(item.oldPrice, "UZS")}</s> : null}
        </span>
        <button type="button" className={pulse ? "ax-cart pulse" : "ax-cart"} data-testid="sale-cart" aria-label={`${item.name} savatga`} onClick={addToCart}>
          <ShoppingCart className="i" />
        </button>
      </div>
    </article>
  );
}
