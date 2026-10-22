"use client";
/* eslint-disable @next/next/no-img-element -- product thumbs are fixed-size cards */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Award, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { brandLetters, deskBrands, type DeskBrand } from "@/data/desktop-brands";
import { fetchCatalogProducts, type CatalogCard } from "@/lib/catalog-client";
import { marketHref } from "@/data/desktop-shop";
import { formatMoney } from "@/lib/format";
import { BrandMark, CountrySelect, MarketFrame } from "./MarketFrame";
import { Flag } from "./Flag";

type LiveBrand = { slug: string; name: string; count: number };

/** Origin of catalog brands that have no logo card in deskBrands. */
const EXTRA_COUNTRY: Record<string, string> = { anthos: "Italiya", bestex: "Xitoy", cherokee: "AQSH", diplomat: "Slovakiya", fengdan: "Xitoy", woodpecker: "Xitoy", woson: "Xitoy", dentsply: "Germaniya" };

function metaOf(brand: LiveBrand): { logo: DeskBrand | null; country: string } {
  const key = brand.slug.toLowerCase();
  const name = brand.name.toLowerCase();
  const logo = deskBrands.find((item) => item.brandKey === key || item.slug === key || item.name.toLowerCase() === name || (name === "w&h" && item.slug === "wh")) ?? null;
  return { logo, country: logo?.country ?? EXTRA_COUNTRY[key] ?? EXTRA_COUNTRY[name] ?? "" };
}

function Wordmark({ name }: { name: string }) {
  return <span className="brd-word">{name}</span>;
}

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
  const [country, setCountry] = useState("");
  const countries = useMemo(() => [...new Set(brandsOf(products).map((item) => metaOf(item).country).filter(Boolean))].sort((a, b) => a.localeCompare(b, "uz")), [products]);
  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    return brandsOf(products).filter((item) => {
      if (letter && !item.name.toUpperCase().startsWith(letter)) return false;
      if (country && metaOf(item).country !== country) return false;
      if (query && !item.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [country, letter, products, q]);

  function reset() {
    setQ("");
    setLetter("");
    setCountry("");
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
          {countries.length ? <CountrySelect value={country} onChange={setCountry} countries={countries} testId="brand-country" /> : null}
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
            {q || letter || country ? (
              <button type="button" onClick={reset}>
                Tozalash
              </button>
            ) : null}
          </div>
        ) : (
          <div className="brd-grid">
            {items.map((item) => {
              const meta = metaOf(item);
              return (
              <Link key={item.slug} className="brd-card" href={`/marketplace/brendlar/${item.slug}`} data-testid="brand-card">
                <div className="brd-mark">
                  {meta.logo ? <BrandMark slug={meta.logo.slug} /> : <Wordmark name={item.name} />}
                </div>
                <h2>{item.name}</h2>
                {meta.country ? <span className="where"><Flag country={meta.country} />{meta.country}</span> : null}
                <div className="brd-foot">
                  <em>{item.count} ta mahsulot</em>
                  <span className="brd-go" aria-hidden="true">
                    <ChevronRight className="i" />
                  </span>
                </div>
              </Link>
              );
            })}
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
                {metaOf(brand).logo ? <BrandMark slug={metaOf(brand).logo!.slug} /> : <Wordmark name={brand.name} />}
              </div>
              <div>
                <h1>{brand.name}</h1>
                <p>{[metaOf(brand).country, `${brand.count} ta mahsulot`].filter(Boolean).join(" · ")}</p>
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
