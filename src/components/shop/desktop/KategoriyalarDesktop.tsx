"use client";
/* eslint-disable @next/next/no-img-element -- category photos are fixed card crops */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Gem, } from "lucide-react";
import { CATEGORIES } from "@/components/catalog-pages/kategoriyalar";
import { fetchCatalogProducts, type CatalogCard } from "@/lib/catalog-client";
import { formatGroupedNumber } from "@/lib/format";
import { MarketFrame, } from "./MarketFrame";
import "./kategoriyalar.css";

type Cat = (typeof CATEGORIES)[number];

/** Keyword cards win over the broad catalog category, so a product is never counted twice. */
function cardOf(product: CatalogCard): Cat["id"] | null {
  const text = `${product.name} ${product.brand}`.toLowerCase();
  const byWord = CATEGORIES.find((item) => item.q && text.includes(item.q.toLowerCase()));
  if (byWord) return byWord.id;
  return CATEGORIES.find((item) => item.cat && item.cat === product.category)?.id ?? null;
}

export function KategoriyalarDesktop() {
  const [products, setProducts] = useState<CatalogCard[]>([]);
  useEffect(() => {
    void fetchCatalogProducts().then(setProducts);
  }, []);
  const counts = new Map<string, number>();
  for (const product of products) {
    const id = cardOf(product);
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
  const cards = [...CATEGORIES].sort((a, b) => Number((counts.get(b.id) ?? 0) > 0) - Number((counts.get(a.id) ?? 0) > 0));
  return (
    <MarketFrame
      active="cats"
      promoTitle="Sotuvchi bo‘lishni xohlaysizmi?"
      promoText="Do‘kon oching va mahsulotlaringizni soting"
      promoCta="Ro‘yxatdan o‘tish"
      promoHref="/marketplace/sotuvchi"
      promoImage="/img/design-pr13/categories/gigiyena.png"
    >
      <div data-testid="cats-desktop">
        <div className="brd-head">
          <div>
            <h1>Kategoriyalar</h1>
            <p>Stomatologiya mahsulotlarini kategoriya bo‘yicha tanlang</p>
          </div>
          <div className="brd-badge">
            <span className="medal">
              <Gem className="i" />
            </span>
            <span>
              <b>{CATEGORIES.length} ta kategoriya</b>
              <span>{formatGroupedNumber(total)} ta mahsulot</span>
            </span>
          </div>
        </div>
        <div className="kat-grid">
          {cards.map((item) => {
            const Icon = item.icon;
            const count = counts.get(item.id) ?? 0;
            const href = item.cat ? `/marketplace?cat=${item.cat}` : `/marketplace?q=${encodeURIComponent(item.q ?? item.name)}`;
            return (
              <Link key={item.id} className={count ? "kat-card" : "kat-card empty"} href={href} data-testid={`kat-${item.id}`}>
                <div className="kat-ph">
                  <img src={`/img/design-pr13/categories/${item.id}.png`} alt="" />
                </div>
                <div className="kat-body">
                  <span className="kat-ic">
                    <Icon className="i" />
                  </span>
                  <div>
                    <h2>{item.name}</h2>
                    <p>{item.desc}</p>
                    <em>{count ? `${formatGroupedNumber(count)} ta mahsulot` : "Tez orada"}</em>
                  </div>
                  <span className="brd-go" aria-hidden="true">
                    <ChevronRight className="i" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </MarketFrame>
  );
}
