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

function countFor(item: (typeof CATEGORIES)[number], products: CatalogCard[]) {
  if (item.cat) return products.filter((product) => product.category === item.cat).length;
  const q = (item.q ?? "").toLowerCase();
  if (!q) return 0;
  return products.filter((product) => `${product.name} ${product.brand} ${product.description}`.toLowerCase().includes(q)).length;
}

export function KategoriyalarDesktop() {
  const [products, setProducts] = useState<CatalogCard[]>([]);
  useEffect(() => {
    void fetchCatalogProducts().then(setProducts);
  }, []);
  return (
    <MarketFrame
      active="cats"
      promoTitle="Sotuvchi bo‘lishni xohlaysizmi?"
      promoText="Do‘kon oching va mahsulotlaringizni soting"
      promoCta="Ro‘yxatdan o‘tish"
      promoHref="/marketplace/sotuvchi"
      promoImage="/img/design-pr13/promo/toothbrush.png"
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
              <span>{formatGroupedNumber(products.length)} ta mahsulot</span>
            </span>
          </div>
        </div>
        <div className="kat-grid">
          {CATEGORIES.map((item) => {
            const Icon = item.icon;
            const count = countFor(item, products);
            const href = item.cat ? `/marketplace?cat=${item.cat}` : `/marketplace?q=${encodeURIComponent(item.q ?? item.name)}`;
            return (
              <Link key={item.id} className="kat-card" href={href} data-testid={`kat-${item.id}`}>
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
                    <em>{formatGroupedNumber(count)} ta mahsulot</em>
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
