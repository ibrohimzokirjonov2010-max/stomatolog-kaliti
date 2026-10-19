"use client";
/* eslint-disable @next/next/no-img-element -- catalog thumbs are fixed-size cards */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  Box,
  ChevronRight,
  Droplets,
  Gift,
  Grid3x3,
  LayoutGrid,
  List,
  Search,
  Shirt,
  ShoppingCart,
  Stethoscope,
} from "lucide-react";
import { fetchCatalogProducts, type CatalogCard } from "@/lib/catalog-client";
import { marketHref } from "@/data/desktop-shop";
import { shopAdd, som, useShopCart } from "./shop-cart";
import { CartRail, CheckRow, RadioRow, RangeSlider, Stars } from "./parts";
import { ShopShell } from "./ShopShell";

type SortKey = "ommabop" | "arzon" | "qimmat" | "yangi";
type StockFilter = "all" | "ombor" | "buyurtma";
type RatingFilter = "all" | "5" | "4" | "3";
type CatId = "all" | "materiallar" | "implantlar" | "asboblar" | "jihozlar" | "laboratoriya" | "forma";

const PRICE_CAP = 50_000_000;

const catalogChips: { id: CatId; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "materiallar", label: "Materiallar" },
  { id: "implantlar", label: "Implantlar" },
  { id: "asboblar", label: "Asboblar" },
  { id: "jihozlar", label: "Jihozlar" },
  { id: "laboratoriya", label: "Laboratoriya" },
  { id: "forma", label: "Forma" },
];

const chipIcon = {
  all: LayoutGrid,
  materiallar: Droplets,
  implantlar: Box,
  asboblar: Stethoscope,
  jihozlar: Grid3x3,
  laboratoriya: Activity,
  forma: Shirt,
} as const;

const catAlias: Record<string, CatId> = {
  kompozitlar: "materiallar",
  terapiya: "materiallar",
  bondlar: "materiallar",
  endodontiya: "asboblar",
  uchliklar: "asboblar",
  uskunalar: "jihozlar",
  gigiyena: "forma",
};

function shopCatFromQuery(raw: string): CatId {
  if (catalogChips.some((chip) => chip.id === raw)) return raw as CatId;
  return catAlias[raw] ?? "all";
}

function isSortKey(value: string): value is SortKey {
  return value === "ommabop" || value === "arzon" || value === "qimmat" || value === "yangi";
}

function isNew(createdAt: string) {
  const time = Date.parse(createdAt);
  return Number.isFinite(time) && time > Date.now() - 14 * 86_400_000;
}

export function MarketCatalog() {
  const params = useSearchParams();
  const lines = useShopCart();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const brandParam = (params.get("brand") ?? "").trim();
  const catParam = params.get("cat") ?? "";
  const sortParam = params.get("sort") ?? "";
  const [products, setProducts] = useState<CatalogCard[]>([]);
  const [ready, setReady] = useState(false);
  const [cat, setCat] = useState<CatId>(() => shopCatFromQuery(catParam));
  const [brands, setBrands] = useState<string[]>(brandParam ? [brandParam] : []);
  useEffect(() => {
    if (brandParam) setBrands([brandParam]);
  }, [brandParam]);
  useEffect(() => {
    setCat(shopCatFromQuery(catParam));
  }, [catParam]);
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
  const [brandQ, setBrandQ] = useState("");
  const [moreBrands, setMoreBrands] = useState(false);
  const [price, setPrice] = useState<[number, number]>([0, PRICE_CAP]);
  const [stock, setStock] = useState<StockFilter>("all");
  const [rating, setRating] = useState<RatingFilter>("all");
  const [sort, setSort] = useState<SortKey>(() => (isSortKey(sortParam) ? sortParam : "ommabop"));
  useEffect(() => {
    if (isSortKey(sortParam)) setSort(sortParam);
  }, [sortParam]);
  const [list, setList] = useState(false);
  const [sale] = useState(params.get("sale") === "1");
  const [pulse, setPulse] = useState<string | null>(null);

  const brandRows = useMemo(() => {
    const map = new Map<string, { key: string; label: string; count: number }>();
    for (const item of products) {
      const prev = map.get(item.brandKey);
      if (prev) prev.count += 1;
      else map.set(item.brandKey, { key: item.brandKey, label: item.brand, count: 1 });
    }
    return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "uz"));
  }, [products]);
  const shownBrands = moreBrands ? brandRows : brandRows.slice(0, 8);
  const filteredBrands = shownBrands.filter((item) => item.label.toLowerCase().includes(brandQ.toLowerCase()));

  const filtersOn = cat !== "all" || brands.length > 0 || stock !== "all" || rating !== "all" || sale || Boolean(q) || price[0] > 0 || price[1] < PRICE_CAP;

  const items = useMemo(() => {
    const rows = products.filter((item) => {
      if (cat !== "all" && item.category !== cat) return false;
      if (brands.length && !brands.includes(item.brandKey)) return false;
      if (item.price < price[0] || item.price > price[1]) return false;
      if (stock === "ombor" && !item.inStock) return false;
      if (stock === "buyurtma" && item.inStock) return false;
      if (rating === "5" && item.rating < 4.5) return false;
      if (rating === "4" && item.rating < 4) return false;
      if (rating === "3" && item.rating < 3.5) return false;
      if (sale && !item.discount) return false;
      if (q && !`${item.name} ${item.brand}`.toLowerCase().includes(q)) return false;
      return true;
    });
    rows.sort((a, b) => {
      if (sort === "arzon") return a.price - b.price;
      if (sort === "qimmat") return b.price - a.price;
      if (sort === "yangi") return Number(isNew(b.createdAt)) - Number(isNew(a.createdAt)) || b.createdAt.localeCompare(a.createdAt);
      return b.reviews - a.reviews || a.name.localeCompare(b.name, "uz");
    });
    return rows;
  }, [brands, cat, price, products, q, rating, sale, sort, stock]);

  const stockCounts = useMemo(() => {
    let ombor = 0;
    for (const item of products) if (item.inStock) ombor += 1;
    return { all: products.length, ombor, buyurtma: products.length - ombor };
  }, [products]);

  function clearFilters() {
    setCat("all");
    setBrands([]);
    setPrice([0, PRICE_CAP]);
    setStock("all");
    setRating("all");
  }

  function toggleBrand(key: string) {
    setBrands((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  function add(id: string) {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    shopAdd({ id: product.id, name: product.name, price: product.price, image: product.image, href: marketHref(product.id) });
    setPulse(id);
    window.setTimeout(() => setPulse(null), 280);
  }

  return (
    <ShopShell searchPath="/marketplace" cartCount={lines.reduce((sum, line) => sum + line.qty, 0)}>
      <div data-testid="market-catalog">
        <section className="dk-banner">
          <span className="gift">
            <Gift className="i" />
          </span>
          <span>
            <b>10 000 so‘m bonus sizga!</b>
            <small>StomaHub marketplace’da birinchi xaridingiz uchun</small>
          </span>
          <Link className="go" href="/bonuslarim">
            Batafsil <ChevronRight className="i" />
          </Link>
        </section>
        <h1 className="dk-h1">Stomatologik mahsulotlar</h1>
        <p className="dk-sub">Sifatli materiallar, zamonaviy asboblar va ishonchli brendlar - StomaHub’da</p>
        <div className="dk-chips">
          {catalogChips.map((chip) => {
            const Icon = chipIcon[chip.id];
            return (
              <button key={chip.id} type="button" className={cat === chip.id ? "dk-chip on" : "dk-chip"} data-testid={`market-chip-${chip.id}`} onClick={() => setCat(chip.id)}>
                <Icon className="i" /> {chip.label}
              </button>
            );
          })}
        </div>
        <div className="dk-cols">
          <aside className="dk-panel">
            <h4>
              Filtrlar
              <button type="button" onClick={clearFilters}>
                Tozalash
              </button>
            </h4>
            <h4>
              Brend
              <Link className="dk-link" href="/marketplace/brendlar">
                Barcha brendlar
              </Link>
            </h4>
            <label className="dk-search">
              <Search className="i" />
              <input value={brandQ} onChange={(event) => setBrandQ(event.target.value)} placeholder="Brend qidirish" aria-label="Brend qidirish" />
            </label>
            {filteredBrands.map((brand) => (
              <CheckRow key={brand.key} label={brand.label} count={brand.count} on={brands.includes(brand.key)} onClick={() => toggleBrand(brand.key)} />
            ))}
            {brandRows.length > 8 ? (
              <button type="button" className="dk-more" onClick={() => setMoreBrands((value) => !value)}>
                {moreBrands ? "Yig‘ish" : "Yana ko‘rsatish"}
              </button>
            ) : null}
            <div className="dk-sec">
              <h4>Narx oralig‘i (so‘m)</h4>
              <RangeSlider min={0} max={PRICE_CAP} value={price} onChange={setPrice} />
            </div>
            <div className="dk-sec">
              <h4>Mavjudligi</h4>
              <RadioRow label="Barchasi" count={stockCounts.all} on={stock === "all"} onClick={() => setStock("all")} />
              <RadioRow label="Omborda bor" count={stockCounts.ombor} on={stock === "ombor"} onClick={() => setStock("ombor")} />
              <RadioRow label="Buyurtma asosida" count={stockCounts.buyurtma} on={stock === "buyurtma"} onClick={() => setStock("buyurtma")} />
            </div>
            <div className="dk-sec">
              <h4>Reyting</h4>
              <RadioRow label="4.5+" count={products.filter((item) => item.rating >= 4.5).length} on={rating === "5"} onClick={() => setRating(rating === "5" ? "all" : "5")} />
              <RadioRow label="4.0+" count={products.filter((item) => item.rating >= 4).length} on={rating === "4"} onClick={() => setRating(rating === "4" ? "all" : "4")} />
              <RadioRow label="3.5+" count={products.filter((item) => item.rating >= 3.5).length} on={rating === "3"} onClick={() => setRating(rating === "3" ? "all" : "3")} />
            </div>
          </aside>
          <div>
            <div className="dk-tools">
              <span className="count">{items.length.toLocaleString("ru-RU")} ta mahsulot</span>
              <span style={{ color: "#7d8da3", fontSize: "calc(.64 * var(--u))" }}>Saralash:</span>
              <div className="dk-sorts">
                {(
                  [
                    ["ommabop", "Ommabop"],
                    ["arzon", "Arzon"],
                    ["qimmat", "Qimmat"],
                    ["yangi", "Yangi"],
                  ] as const
                ).map(([key, label]) => (
                  <button key={key} type="button" className={sort === key ? "on" : ""} onClick={() => setSort(key)}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="dk-view">
                <button type="button" className={list ? "" : "on"} aria-label="Kataklar" onClick={() => setList(false)}>
                  <LayoutGrid className="i" />
                </button>
                <button type="button" className={list ? "on" : ""} aria-label="Ro‘yxat" onClick={() => setList(true)}>
                  <List className="i" />
                </button>
              </div>
            </div>
            {!ready || items.length === 0 ? (
              <div className="dk-empty">
                <b>{!ready ? "Yuklanmoqda..." : products.length === 0 ? "Hozircha mahsulot yo‘q" : "Mos mahsulot topilmadi"}</b>
                <p>{products.length === 0 ? "Do‘konlar e’lon joylagach, ular shu yerda chiqadi." : "Filtrlarni o‘zgartiring."}</p>
                {filtersOn ? (
                  <button type="button" onClick={clearFilters}>
                    Tozalash
                  </button>
                ) : null}
              </div>
            ) : (
              <div className={list ? "dk-list" : "dk-grid"}>
                {items.map((item) => (
                  <article className="dk-card" key={item.id}>
                    <Link href={marketHref(item.id)} className="ph">
                      {item.image ? <img src={item.image} alt="" /> : null}
                      {item.discount ? <span className="dk-badge red">-{item.discount}%</span> : null}
                    </Link>
                    <div className="brand">{item.brand}</div>
                    <h3>
                      <Link href={marketHref(item.id)}>{item.name}</Link>
                    </h3>
                    <Stars value={item.rating} reviews={item.reviews} />
                    <div className="dk-stock">{item.inStock ? "Omborda bor" : "Buyurtma asosida"}</div>
                    <div className="dk-price">
                      <strong>{som(item.price)}</strong>
                      {item.oldPrice ? <s>{som(item.oldPrice)}</s> : null}
                    </div>
                    <button type="button" className={pulse === item.id ? "dk-add pulse" : "dk-add"} onClick={() => add(item.id)}>
                      <ShoppingCart className="i" /> Savatga
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
          <CartRail lines={lines} />
        </div>
      </div>
    </ShopShell>
  );
}
