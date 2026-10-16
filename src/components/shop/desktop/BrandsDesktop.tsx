"use client";
/* eslint-disable @next/next/no-img-element -- product thumbs are fixed-size cards */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Award, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { brandCountries, brandLetters, deskBrands, filterDeskBrands, getDeskBrand } from "@/data/desktop-brands";
import { marketHref, marketProducts } from "@/data/desktop-shop";
import { formatMoney } from "@/lib/format";
import { BrandMark, CountrySelect, MarketFrame } from "./MarketFrame";

export function BrandsDesktop({ slug }: { slug?: string }) {
  if (slug) return <BrandDetail slug={slug} />;
  return <BrandDirectory />;
}

function BrandDirectory() {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [letter, setLetter] = useState("");
  const countries = useMemo(() => brandCountries(), []);
  const items = useMemo(() => filterDeskBrands(deskBrands, { q, country, letter }), [q, country, letter]);

  function reset() {
    setQ("");
    setCountry("");
    setLetter("");
  }

  return (
    <MarketFrame active="brands" onPromo={reset}>
      <div data-testid="brands-desktop">
        <div className="brd-head">
          <div>
            <h1>Brendlar</h1>
            <p>Dunyoning yetakchi stomatologiya brendlari</p>
          </div>
          <div className="brd-badge">
            <span className="medal">
              <Award className="i" />
            </span>
            <span>
              <b>100+ brend</b>
              <span>Rasmiy yetkazib beruvchilar</span>
            </span>
          </div>
        </div>
        <div className="brd-tools">
          <label className="brd-search">
            <Search className="i" />
            <input data-testid="brand-search" aria-label="Brend nomi" value={q} placeholder="Brend nomi bo‘yicha qidiring..." onChange={(event) => setQ(event.target.value)} />
          </label>
          <CountrySelect value={country} onChange={setCountry} countries={countries} testId="brand-country" />
        </div>
        <div className="brd-letters" role="tablist" aria-label="Harf">
          <button type="button" className={letter === "" ? "all on" : "all"} data-testid="brand-letter-all" onClick={() => setLetter("")}>
            Barchasi
          </button>
          {brandLetters.map((item) => (
            <button key={item} type="button" className={letter === item ? "on" : undefined} data-testid={`brand-letter-${item}`} onClick={() => setLetter(item)}>
              {item}
            </button>
          ))}
        </div>
        {items.length === 0 ? (
          <div className="brd-empty" data-testid="brand-empty">
            <p>Brend topilmadi</p>
            <button type="button" onClick={reset}>
              Tozalash
            </button>
          </div>
        ) : (
          <div className="brd-grid">
            {items.map((item) => (
              <Link key={item.slug} className="brd-card" href={`/marketplace/brendlar/${item.slug}`} data-testid="brand-card">
                <div className="brd-mark">
                  <BrandMark slug={item.slug} />
                </div>
                <h2>{item.name}</h2>
                <p className="where">
                  <span aria-hidden="true">{item.flag}</span>
                  {item.country}
                </p>
                <div className="brd-foot">
                  <em>
                    {item.count} ta mahsulot
                  </em>
                  <span className="brd-go" aria-hidden="true">
                    <ChevronRight className="i" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MarketFrame>
  );
}

function BrandDetail({ slug }: { slug: string }) {
  const brand = getDeskBrand(slug);
  const products = brand ? marketProducts.filter((item) => item.brandKey === brand.brandKey) : [];

  return (
    <MarketFrame active="brands">
      <div data-testid="brand-detail">
        <Link className="brd-back" href="/marketplace/brendlar">
          <ChevronLeft className="i" /> Brendlar
        </Link>
        {!brand ? (
          <div className="brd-empty">
            <p>Brend topilmadi</p>
            <Link className="go" href="/marketplace/brendlar">
              Barcha brendlar
            </Link>
          </div>
        ) : (
          <>
            <article className="brd-hero">
              <div className="brd-mark">
                <BrandMark slug={brand.slug} />
              </div>
              <div>
                <h1>{brand.name}</h1>
                <p>
                  {brand.flag} {brand.country} · {brand.count} ta mahsulot
                </p>
              </div>
            </article>
            {products.length === 0 ? (
              <div className="brd-empty">
                <p>Bu brend mahsulotlari katalogda tez orada qo‘shiladi.</p>
                <Link className="go" href={`/marketplace?q=${encodeURIComponent(brand.name)}`}>
                  Marketplaceda qidirish
                </Link>
              </div>
            ) : (
              <div className="brd-prods">
                {products.map((item) => (
                  <Link key={item.id} className="brd-prod" href={marketHref(item.id)}>
                    <div className="ph">
                      <img src={item.image} alt="" />
                    </div>
                    <h3>{item.name}</h3>
                    <b>{formatMoney(item.price, "UZS")}</b>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </MarketFrame>
  );
}
