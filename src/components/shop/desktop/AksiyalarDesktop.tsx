"use client";
/* eslint-disable @next/next/no-img-element -- sale photos are fixed-size cards */

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Clock, Heart, Search, ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import {
  filterSales,
  formatCountdown,
  saleCategories,
  saleProducts,
  sortSales,
  type SaleCategory,
  type SaleProduct,
  type SaleSort,
} from "@/data/desktop-sales";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/data/products";
import { MarketFrame } from "./MarketFrame";
import "./aksiyalar.css";

export function AksiyalarDesktop() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<SaleCategory | "">("");
  const [sort, setSort] = useState<SaleSort>("mashhurlik");
  const [saved, setSaved] = useState<string[]>([]);
  const items = useMemo(() => sortSales(filterSales(saleProducts, { q, category }), sort), [q, category, sort]);

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
      promoImage="/img/design-pr13/promo/gift.png"
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
          {saleCategories.map((item) => (
            <button key={item.id} type="button" className={category === item.id ? "on" : undefined} data-testid={`sale-chip-${item.id}`} onClick={() => setCategory(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        {items.length === 0 ? (
          <div className="ax-empty" data-testid="sale-empty">
            <p>Aksiya topilmadi</p>
            <button type="button" onClick={reset}>
              Tozalash
            </button>
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

function SaleCard({ item, saved, onSave }: { item: SaleProduct; saved: boolean; onSave: () => void }) {
  const { add } = useCart();
  const [left, setLeft] = useState(item.seconds);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setLeft((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, []);

  function addToCart() {
    const product: Product = {
      id: item.id,
      name: item.name,
      brand: item.brand,
      category: "materiallar",
      price: item.price,
      oldPrice: item.oldPrice,
      discount: item.discount,
      rating: item.rating,
      reviews: item.reviews,
      inStock: true,
      delivery: "Toshkent 24 soat",
      image: item.image,
      stockQty: 20,
    };
    add(item.id, product);
    setPulse(true);
    window.setTimeout(() => setPulse(false), 280);
  }

  return (
    <article className="ax-card" data-testid="sale-card">
      <div className="ax-ph">
        <img src={item.image} alt="" />
        <span className="ax-off">-{item.discount}%</span>
        <button type="button" className={saved ? "ax-heart on" : "ax-heart"} data-testid="sale-heart" aria-label="Sevimlilar" aria-pressed={saved} onClick={onSave}>
          <Heart className="i" />
        </button>
      </div>
      <p className="ax-time">
        <Clock className="i" />
        <span data-testid="sale-timer">{formatCountdown(left)}</span>
      </p>
      <h3>{item.name}</h3>
      <p className="ax-brand">{item.brand}</p>
      <p className="ax-meta">
        <Star className="star i" />
        <b>
          {item.rating} ({item.reviews})
        </b>
        <span className="sold">{item.sold}+ sotilgan</span>
      </p>
      <div className="ax-buy">
        <span>
          <b>{formatMoney(item.price, "UZS")}</b>
          <s>{formatMoney(item.oldPrice, "UZS")}</s>
        </span>
        <button type="button" className={pulse ? "ax-cart pulse" : "ax-cart"} data-testid="sale-cart" aria-label={`${item.name} savatga`} onClick={addToCart}>
          <ShoppingCart className="i" />
        </button>
      </div>
    </article>
  );
}
