"use client";
/* eslint-disable @next/next/no-img-element -- category photos are fixed card crops */

import Link from "next/link";
import { ChevronRight, Gem, } from "lucide-react";
import { CATEGORIES } from "@/components/catalog-pages/kategoriyalar";
import { formatGroupedNumber } from "@/lib/format";
import { MarketFrame, } from "./MarketFrame";
import "./kategoriyalar.css";

const COUNTS: Record<string, number> = {
  terapiya: 1240,
  ortopediya: 980,
  jarrohlik: 860,
  implantologiya: 1320,
  endodontiya: 910,
  ortodontiya: 740,
  gigiyena: 680,
  asboblar: 1560,
  uskunalar: 640,
};

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
              <b>9 ta kategoriya</b>
              <span>10 000+ mahsulot</span>
            </span>
          </div>
        </div>
        <div className="kat-grid">
          {CATEGORIES.map((item) => {
            const Icon = item.icon;
            const count = COUNTS[item.id] ?? 0;
            return (
              <Link key={item.id} className="kat-card" href={HREFS[item.id] ?? `/marketplace?q=${encodeURIComponent(item.name)}`} data-testid={`kat-${item.id}`}>
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
