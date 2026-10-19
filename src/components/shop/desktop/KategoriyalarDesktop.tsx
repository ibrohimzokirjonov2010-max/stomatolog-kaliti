"use client";
/* eslint-disable @next/next/no-img-element -- category photos are fixed card crops */

import Link from "next/link";
import { ChevronRight, Gem, } from "lucide-react";
import { CATEGORIES } from "@/components/catalog-pages/kategoriyalar";
import { marketProducts } from "@/data/desktop-shop";
import { formatGroupedNumber } from "@/lib/format";
import { MarketFrame, } from "./MarketFrame";
import "./kategoriyalar.css";

/** Desktop catalog chips. Clinical names map onto the shop categories that actually filter the grid. */
const HREFS: Record<string, string> = {
  terapiya: "/marketplace?cat=kompozitlar",
  ortopediya: "/marketplace?cat=bondlar",
  jarrohlik: "/marketplace?cat=uchliklar",
  implantologiya: "/marketplace?cat=implantlar",
  endodontiya: "/marketplace?cat=endodontiya",
  ortodontiya: "/marketplace?q=ortodont",
  gigiyena: "/marketplace?cat=gigiyena",
  asboblar: "/marketplace?cat=asboblar",
  uskunalar: "/marketplace?cat=uskunalar",
};


/** How many catalog products the category link actually shows (same rule as the marketplace filter). */
function countFor(href: string) {
  const params = new URLSearchParams(href.split("?")[1] ?? "");
  const cat = params.get("cat");
  const q = (params.get("q") ?? "").toLowerCase();
  return marketProducts.filter((item) => (cat ? item.category === cat : true) && (q ? `${item.name} ${item.brand} ${item.blurb} ${item.subtitle}`.toLowerCase().includes(q) : true)).length;
}

export function KategoriyalarDesktop() {
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
              <span>{formatGroupedNumber(marketProducts.length)} ta mahsulot</span>
            </span>
          </div>
        </div>
        <div className="kat-grid">
          {CATEGORIES.map((item) => {
            const Icon = item.icon;
            const href = HREFS[item.id] ?? `/marketplace?q=${encodeURIComponent(item.name)}`;
            const count = countFor(href);
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
                    <em className={count ? undefined : "soon"} data-testid="kat-count">{count ? `${formatGroupedNumber(count)} ta mahsulot` : "Tez orada"}</em>
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
