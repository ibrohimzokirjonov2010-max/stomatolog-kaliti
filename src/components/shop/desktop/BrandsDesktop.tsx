"use client";
/* eslint-disable @next/next/no-img-element -- product thumbs are fixed-size cards */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Award, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { brandLetters } from "@/data/desktop-brands";
import { fetchCatalogProducts, type CatalogCard } from "@/lib/catalog-client";
import { marketHref } from "@/data/desktop-shop";
import { formatMoney } from "@/lib/format";
import { MarketFrame } from "./MarketFrame";

type LiveBrand = { slug: string; name: string; count: number };

export function BrandsDesktop({ slug }: { slug?: string }) {
  if (slug) return <BrandDetail slug={slug} />;
  return <BrandDirectory />;
}

function useCatalog() {
  const [products, setProducts] = useState<CatalogCard[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let stop = false;
    void fetchCatalogProducts().then((rows) => {
      if (stop) return;
      setProducts(rows);
      setReady(true);
    });
    return () => {
      stop = true;
    };
  }, []);
  return { products, ready };
}

function brandsOf(products: CatalogCard[]) {
  const map = new Map<string, LiveBrand>();
  for (const item of products) {
    const prev = map.get(item.brandKey);
    if (prev) prev.count += 1;
    else map.set(item.brandKey, { slug: item.brandKey, name: item.brand, count: 1 });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "uz"));
}

function BrandDirectory() {
  const { products, ready } = useCatalog();
  const [q, setQ] = useState("");
  const [letter, setLetter] = useState("");
  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    return brandsOf(products).filter((item) => {
      if (letter && !item.name.toUpperCase().startsWith(letter)) return false;
      if (query && !item.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [letter, products, q]);

  function reset() {
    setQ("");
    setLetter("");
  }

  return (
    <MarketFrame active="brands" promoImage="/img/design-pr13/promo/implant.png" onPromo={reset}>
      <div data-testid="brands-desktop">
        <div className="brd-head">
          <div>
            <h1>Brendlar</h1>
            <p>Marketplace’dagi do‘konlar e’lonlaridan</p>
          </div>
          <div className="brd-badge">
            <span className="medal">
              <Award className="i" />
            </span>
            <span>
              <b>{brandsOf(products).length} ta brend</b>
              <span>Haqiqiy katalog</span>
            </span>
          </div>
        </div>
        <div className="brd-tools">
          <label className="brd-search">
            <Search className="i" />
            <input data-testid="brand-search" aria-label="Brend nomi" value={q} placeholder="Brend nomi bo‘yicha qidiring..." onChange={(event) => setQ(event.target.value)} />
          </label>
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
        {!ready || items.length === 0 ? (
          <div className="brd-empty" data-testid="brand-empty">
            <p>{!ready ? "Yuklanmoqda..." : products.length === 0 ? "Hozircha brend yo‘q" : "Brend topilmadi"}</p>
            {q || letter ? (
              <button type="button" onClick={reset}>
                Tozalash
              </button>
            ) : null}
          </div>
        ) : (
          <div className="brd-grid">
            {items.map((item) => (
              <Link key={item.slug} className="brd-card" href={`/marketplace/brendlar/${item.slug}`} data-testid="brand-card">
                <div className="brd-mark">
                  <b>{item.name.slice(0, 1)}</b>
                </div>
                <h2>{item.name}</h2>
                <div className="brd-foot">
                  <em>{item.count} ta mahsulot</em>
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
  const { products, ready } = useCatalog();
  const brand = brandsOf(products).find((item) => item.slug === slug);
  const rows = products.filter((item) => item.brandKey === slug);

  return (
    <MarketFrame active="brands">
      <div data-testid="brand-detail">
        <Link className="brd-back" href="/marketplace/brendlar">
          <ChevronLeft className="i" /> Brendlar
        </Link>
        {!ready ? (
          <div className="brd-empty">
            <p>Yuklanmoqda...</p>
          </div>
        ) : !brand ? (
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
                <b>{brand.name.slice(0, 1)}</b>
              </div>
              <div>
                <h1>{brand.name}</h1>
                <p>{brand.count} ta mahsulot</p>
              </div>
            </article>
            {rows.length === 0 ? (
              <div className="brd-empty">
                <p>Hozircha mahsulot yo‘q</p>
              </div>
            ) : (
              <div className="brd-prods">
                {rows.map((item) => (
                  <Link key={item.id} className="brd-prod" href={marketHref(item.id)}>
                    <div className="ph">{item.image ? <img src={item.image} alt="" /> : null}</div>
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
