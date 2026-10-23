"use client";
/* eslint-disable @next/next/no-img-element -- phone cards use fixed-size thumbs */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Heart, LayoutGrid, Package, Search, ShoppingCart, SlidersHorizontal, Store } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { categoryLabels, type ProductCategory } from "@/data/products";
import { brandLetters, deskBrands } from "@/data/desktop-brands";
import { fetchCatalogProducts, productFromCatalog, type CatalogCard } from "@/lib/catalog-client";
import { marketHref } from "@/data/desktop-shop";
import { formatMoney } from "@/lib/format";
import "./brand-mobile.css";

type LiveBrand = { slug: string; name: string; count: number };

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

/** Simple phone fallback. The desktop page is drawn by the shop overlay. */
export function BrandsMobile({ slug }: { slug?: string }) {
  if (slug) return <MobileDetail slug={slug} />;
  return <MobileDirectory />;
}

const LETTER_PAIRS = Array.from({ length: Math.ceil(brandLetters.length / 2) }, (_, i) => brandLetters.slice(i * 2, i * 2 + 2));

/** Design logo for a catalog brand, when one is drawn for it. */
function logoOf(brand: { slug: string; name: string }) {
  const name = brand.name.toLowerCase();
  const desk = deskBrands.find((item) => item.brandKey === brand.slug || item.slug === brand.slug || item.name.toLowerCase() === name);
  return desk ? `/img/design-pr13/brands/${desk.slug}.png` : "";
}

function MobileDirectory() {
  const { products, ready } = useCatalog();
  const [q, setQ] = useState("");
  const [pair, setPair] = useState<string[]>([]);
  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    return brandsOf(products)
      .filter((item) => {
        if (pair.length && !pair.includes(item.name.charAt(0).toUpperCase())) return false;
        if (query && !item.name.toLowerCase().includes(query)) return false;
        return true;
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [pair, products, q]);

  return (
    <div className="bd lg:hidden" data-testid="brands-mobile">
      <h1>Brendlar</h1>
      <p className="bd-lead">Mashhur stomatologik brendlar va ishlab chiqaruvchilar</p>
      <label className="bd-search">
        <Search />
        <input aria-label="Brend nomi" value={q} placeholder="Brend nomi bo‘yicha qidirish..." onChange={(event) => setQ(event.target.value)} />
      </label>
      <div className="bd-letters">
        <button type="button" className={pair.length === 0 ? "on" : ""} onClick={() => setPair([])}>Barchasi</button>
        {LETTER_PAIRS.map((item) => {
          const key = item.join("-");
          const on = pair.join("-") === key;
          return <button key={key} type="button" className={on ? "on" : ""} onClick={() => setPair(on ? [] : item)}>{key}</button>;
        })}
      </div>
      {!ready || items.length === 0 ? (
        <p className="bd-empty">{!ready ? "Yuklanmoqda…" : "Hozircha brend yo‘q"}</p>
      ) : (
        <div className="bd-grid">
          {items.map((item) => {
            const logo = logoOf(item);
            return (
              <Link key={item.slug} href={`/marketplace/brendlar/${item.slug}`} className="bd-card">
                <span className="bd-logo">{logo ? <img src={logo} alt={item.name} /> : <b>{item.name}</b>}</span>
                <span className="bd-meta"><b>{item.name}</b><small>{item.count} mahsulot</small></span>
                <span className="bd-go"><ChevronRight /></span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

type Sort = "new" | "cheap" | "dear";
const SORTS: { id: Sort; label: string }[] = [
  { id: "new", label: "Yangilari" },
  { id: "cheap", label: "Arzonroq" },
  { id: "dear", label: "Qimmatroq" },
];

function MobileDetail({ slug }: { slug: string }) {
  const { products, ready } = useCatalog();
  const cart = useCart();
  const favorites = useFavorites();
  const [cat, setCat] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("new");
  const [sortOpen, setSortOpen] = useState(false);
  const brand = brandsOf(products).find((item) => item.slug === slug);
  const desk = deskBrands.find((item) => item.brandKey === slug || item.slug === slug);
  const rows = products.filter((item) => item.brandKey === slug);
  const cats = Array.from(new Set(rows.map((item) => item.category).filter(Boolean)));
  const shops = new Set(rows.map((item) => item.shopName).filter(Boolean)).size;
  const q = query.trim().toLowerCase();
  const shown = rows
    .filter((item) => (!cat || item.category === cat) && (!q || `${item.name} ${item.description}`.toLowerCase().includes(q)))
    .sort((a, b) => (sort === "cheap" ? a.price - b.price : sort === "dear" ? b.price - a.price : b.createdAt.localeCompare(a.createdAt)));
  const followId = `brand:${slug}`;
  const following = favorites.has(followId);
  const cover = rows.find((item) => item.image)?.image;
  const label = (id: string) => categoryLabels[id as ProductCategory] ?? id;

  if (!ready) return <p className="bm2-state lg:hidden">Yuklanmoqda…</p>;
  if (!brand) {
    return (
      <div className="bm2-state lg:hidden" data-testid="brand-mobile">
        <p>Brend topilmadi</p>
        <Link href="/marketplace/brendlar">Brendlarga qaytish</Link>
      </div>
    );
  }

  return (
    <div className="bm2 lg:hidden" data-testid="brand-mobile">
      <section className="bm2-banner">
        <div className="bm2-banner-copy">
          <b>{brand.name}</b>
          <span>{desk ? `${desk.flag} ${desk.country}` : "Stomatologik mahsulotlar"}</span>
        </div>
        {cover ? <img src={cover} alt="" /> : null}
      </section>

      <section className="bm2-id">
        <span className="bm2-logo">{logoOf(brand) ? <img src={logoOf(brand)} alt="" /> : brand.name.slice(0, 1).toUpperCase()}</span>
        <div>
          <h1>{brand.name}</h1>
          <p>{cats.length ? cats.slice(0, 3).map(label).join(", ") : "Stomatologik mahsulotlar"}</p>
        </div>
        <button type="button" className={following ? "bm2-follow on" : "bm2-follow"} aria-pressed={following} onClick={() => favorites.toggle(followId)}>
          <Heart /> {following ? "Kuzatilmoqda" : "Kuzatish"}
        </button>
      </section>

      <div className="bm2-feats">
        <span><i><Package /></i><b>{brand.count} ta mahsulot</b><small>Marketplace’da</small></span>
        <span><i><Store /></i><b>{shops} ta do‘kon</b><small>Sotuvchilar</small></span>
        <span><i><LayoutGrid /></i><b>{cats.length} ta kategoriya</b><small>Yo‘nalishlar</small></span>
      </div>

      {cats.length > 1 ? (
        <div className="bm2-chips" role="tablist">
          <button type="button" role="tab" aria-selected={!cat} className={!cat ? "on" : ""} onClick={() => setCat("")}>Barcha mahsulotlar</button>
          {cats.map((item) => (
            <button key={item} type="button" role="tab" aria-selected={cat === item} className={cat === item ? "on" : ""} onClick={() => setCat(item)}>{label(item)}</button>
          ))}
        </div>
      ) : null}

      <div className="bm2-tools">
        <label className="bm2-search"><Search /><input value={query} placeholder="Mahsulot qidirish..." aria-label="Mahsulot qidirish" onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="bm2-sort">
          <button type="button" aria-expanded={sortOpen} onClick={() => setSortOpen((open) => !open)}><SlidersHorizontal /> Filtr <ChevronDown /></button>
          {sortOpen ? (
            <div className="bm2-sort-menu">
              {SORTS.map((item) => (
                <button key={item.id} type="button" className={sort === item.id ? "on" : ""} onClick={() => { setSort(item.id); setSortOpen(false); }}>{item.label}</button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="bm2-empty">{rows.length === 0 ? "Hozircha mahsulot yo‘q" : "Mos mahsulot topilmadi"}</p>
      ) : (
        <ul className="bm2-grid">
          {shown.map((item) => {
            const inStock = item.inStock && item.stockQty > 0;
            const liked = favorites.has(item.id);
            return (
              <li key={item.id}>
                <Link href={marketHref(item.id)} className="bm2-img">
                  {item.image ? <img src={item.image} alt="" /> : <Package />}
                </Link>
                <button type="button" className={liked ? "bm2-like on" : "bm2-like"} aria-label="Saqlash" aria-pressed={liked} onClick={() => favorites.toggle(item.id)}><Heart /></button>
                <Link href={marketHref(item.id)} className="bm2-name">{item.name}</Link>
                <p className="bm2-sub">{[label(item.category), item.shopName].filter(Boolean).join(" · ")}</p>
                <div className="bm2-foot">
                  <b>{formatMoney(item.price, "UZS")}</b>
                  <button type="button" className="bm2-cart" aria-label={`${item.name} savatga`} disabled={!inStock} onClick={() => cart.add(item.id, productFromCatalog(item))}><ShoppingCart /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
