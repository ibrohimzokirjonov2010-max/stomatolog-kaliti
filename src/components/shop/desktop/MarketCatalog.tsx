"use client";

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
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Wrench,
} from "lucide-react";
import {
  PRICE_MAX,
  marketBrands,
  marketChips,
  marketHref,
  marketProducts,
  marketSeed,
  type ShopCategory,
} from "@/data/desktop-shop";
import { shopAdd, som, useShopCart } from "./shop-cart";
import { CartRail, CheckRow, RadioRow, RangeSlider, Stars } from "./parts";
import { ShopShell } from "./ShopShell";

type SortKey = "ommabop" | "arzon" | "qimmat" | "yangi";
type StockFilter = "all" | "ombor" | "buyurtma";
type RatingFilter = "all" | "5" | "4" | "3";

const chipIcon = {
  all: LayoutGrid,
  kompozitlar: Droplets,
  bondlar: Sparkles,
  endodontiya: Activity,
  implantlar: Box,
  uchliklar: Wrench,
  asboblar: Stethoscope,
  uskunalar: Grid3x3,
  gigiyena: Sparkles,
} as const;

export function MarketCatalog() {
  const params = useSearchParams();
  const lines = useShopCart(marketSeed);
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const brandParam = (params.get("brand") ?? "").trim();
  const [cat, setCat] = useState<ShopCategory | "all">("all");
  const [brands, setBrands] = useState<string[]>(brandParam ? [brandParam] : []);
  useEffect(() => {
    if (brandParam) setBrands([brandParam]);
  }, [brandParam]);
  const [brandQ, setBrandQ] = useState("");
  const [moreBrands, setMoreBrands] = useState(false);
  const [price, setPrice] = useState<[number, number]>([0, PRICE_MAX]);
  const [stock, setStock] = useState<StockFilter>("all");
  const [official, setOfficial] = useState(false);
  const [rating, setRating] = useState<RatingFilter>("all");
  const [sort, setSort] = useState<SortKey>("ommabop");
  const [list, setList] = useState(false);
  const [sale] = useState(params.get("sale") === "1");
  const [pulse, setPulse] = useState<string | null>(null);

  const shownBrands = moreBrands ? marketBrands : marketBrands.slice(0, 8);

  const items = useMemo(() => {
    let rows = marketProducts.filter((item) => {
      if (cat !== "all" && item.category !== cat) return false;
      if (brands.length && !brands.includes(item.brandKey)) return false;
      if (item.price < price[0] || item.price > price[1]) return false;
      if (stock !== "all" && item.stock !== stock) return false;
      if (official && !item.official) return false;
      if (rating === "5" && item.rating < 4.5) return false;
      if (rating === "4" && item.rating < 4) return false;
      if (rating === "3" && item.rating < 3.5) return false;
      if (sale && !item.discount) return false;
      if (q && !`${item.name} ${item.brand}`.toLowerCase().includes(q)) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      if (sort === "arzon") return a.price - b.price;
      if (sort === "qimmat") return b.price - a.price;
      if (sort === "yangi") return Number(b.isNew) - Number(a.isNew) || b.popularity - a.popularity;
      return b.popularity - a.popularity;
    });
    return rows;
  }, [brands, cat, official, price, q, rating, sale, sort, stock]);

  const countLabel = brands.length || cat !== "all" || stock !== "all" || official || rating !== "all" || sale || q || price[0] > 0 || price[1] < PRICE_MAX ? items.length : 1248;

  function toggleBrand(key: string) {
    if (key === "all") {
      setBrands([]);
      return;
    }
    setBrands((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  function add(id: string) {
    const product = marketProducts.find((item) => item.id === id);
    if (!product) return;
    shopAdd({ id: product.id, name: product.name, price: product.price, image: product.image, href: marketHref(product.id) });
    setPulse(id);
    window.setTimeout(() => setPulse(null), 280);
  }

  const filteredBrands = shownBrands.filter((item) => item.label.toLowerCase().includes(brandQ.toLowerCase()));

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
          {marketChips.map((chip) => {
            const Icon = chipIcon[chip.id];
            return (
              <button key={chip.id} type="button" className={cat === chip.id ? "dk-chip on" : "dk-chip"} onClick={() => setCat(chip.id)}>
                <Icon className="i" /> {chip.label}
              </button>
            );
          })}
        </div>
        <div className="dk-cols">
          <aside className="dk-panel">
            <h4>
              Filtrlar
              <button
                type="button"
                onClick={() => {
                  setCat("all");
                  setBrands([]);
                  setBrandQ("");
                  setPrice([0, PRICE_MAX]);
                  setStock("all");
                  setOfficial(false);
                  setRating("all");
                }}
              >
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
              <CheckRow key={brand.key} label={brand.label} count={brand.count} on={brand.key === "all" ? brands.length === 0 : brands.includes(brand.key)} onClick={() => toggleBrand(brand.key)} />
            ))}
            <button type="button" className="dk-more" onClick={() => setMoreBrands((value) => !value)}>
              {moreBrands ? "Yig‘ish" : "Yana ko‘rsatish"}
            </button>
            <div className="dk-sec">
              <h4>Narx oralig‘i (so‘m)</h4>
              <RangeSlider min={0} max={PRICE_MAX} value={price} onChange={setPrice} />
            </div>
            <div className="dk-sec">
              <h4>Mavjudligi</h4>
              <RadioRow label="Barchasi" count={1248} on={stock === "all"} onClick={() => setStock("all")} />
              <RadioRow label="Omborda bor" count={986} on={stock === "ombor"} onClick={() => setStock("ombor")} />
              <RadioRow label="Buyurtma asosida" count={262} on={stock === "buyurtma"} onClick={() => setStock("buyurtma")} />
            </div>
            <div className="dk-sec">
              <h4>Rasmiy distribyutor</h4>
              <CheckRow label="Faqat rasmiy" count={427} on={official} onClick={() => setOfficial((value) => !value)} />
            </div>
            <div className="dk-sec">
              <h4>Reyting</h4>
              <RadioRow label="4.5+" count={612} on={rating === "5"} onClick={() => setRating(rating === "5" ? "all" : "5")} />
              <RadioRow label="4.0+" count={856} on={rating === "4"} onClick={() => setRating(rating === "4" ? "all" : "4")} />
              <RadioRow label="3.5+" count={1102} on={rating === "3"} onClick={() => setRating(rating === "3" ? "all" : "3")} />
            </div>
          </aside>
          <div>
            <div className="dk-tools">
              <span className="count">{countLabel.toLocaleString("ru-RU")} ta mahsulot</span>
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
            {items.length === 0 ? (
              <div className="dk-empty">
                <b>Mos mahsulot topilmadi</b>
                <p>Filtrlarni o‘zgartiring.</p>
                <button
                  type="button"
                  onClick={() => {
                    setCat("all");
                    setBrands([]);
                    setPrice([0, PRICE_MAX]);
                    setStock("all");
                    setOfficial(false);
                    setRating("all");
                  }}
                >
                  Tozalash
                </button>
              </div>
            ) : (
              <div className={list ? "dk-list" : "dk-grid"}>
                {items.map((item) => (
                  <article className="dk-card" key={item.id}>
                    <Link href={marketHref(item.id)} className="ph">
                      <img src={item.image} alt="" />
                      {item.official ? <span className="dk-badge mint">Rasmiy distribyutor</span> : item.discount ? <span className="dk-badge red">-{item.discount}%</span> : null}
                    </Link>
                    <div className="brand">{item.brand}</div>
                    <h3>
                      <Link href={marketHref(item.id)}>{item.name}</Link>
                    </h3>
                    <Stars value={item.rating} reviews={item.reviews} />
                    <div className="dk-stock">Omborda bor</div>
                    <div className="dk-price">
                      <strong>{som(item.price)}</strong>
                      {item.oldPrice && !item.official ? <s>{som(item.oldPrice)}</s> : null}
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
