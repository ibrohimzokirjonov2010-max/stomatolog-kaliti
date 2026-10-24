"use client";
/* eslint-disable @next/next/no-img-element -- sale photos are fixed-size cards */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Heart, LayoutGrid, List, Search, ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { fetchCatalogProducts, productFromCatalog, type CatalogCard } from "@/lib/catalog-client";
import { formatMoney } from "@/lib/format";
import { MarketFrame } from "./MarketFrame";
import "./aksiyalar.css";

type SaleSort = "mashhurlik" | "chegirma" | "arzon" | "qimmat";

const categories = [
  { id: "materiallar", label: "Materiallar" },
  { id: "implantlar", label: "Implantlar" },
  { id: "asboblar", label: "Asboblar" },
  { id: "jihozlar", label: "Jihozlar" },
  { id: "laboratoriya", label: "Laboratoriya" },
  { id: "forma", label: "Forma" },
] as const;

const bands = [
  { id: "lt10", label: "10% gacha", test: (d: number) => d < 10 },
  { id: "10-20", label: "10% – 20%", test: (d: number) => d >= 10 && d < 20 },
  { id: "20-30", label: "20% – 30%", test: (d: number) => d >= 20 && d < 30 },
  { id: "30+", label: "30% dan yuqori", test: (d: number) => d >= 30 },
] as const;

function onSale(item: CatalogCard) {
  return (item.discount ?? 0) > 0 && Boolean(item.oldPrice);
}

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** Desktop /marketplace/aksiyalar (mock "aksiyalar dizayini"): banner, counted chips, filter rail, product grid. */
export function AksiyalarDesktop() {
  const [q, setQ] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [off, setOff] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [brandQ, setBrandQ] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState<SaleSort>("mashhurlik");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [saved, setSaved] = useState<string[]>([]);
  const [rows, setRows] = useState<CatalogCard[] | null>(null);

  useEffect(() => {
    let stop = false;
    void fetchCatalogProducts().then((items) => {
      if (!stop) setRows(items.filter(onSale));
    });
    return () => {
      stop = true;
    };
  }, []);

  const all = useMemo(() => rows ?? [], [rows]);
  const brandList = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of all) if (item.brand) counts.set(item.brand, (counts.get(item.brand) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, [all]);

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    const lo = Number(min) || 0;
    const hi = Number(max) || Infinity;
    const list = all.filter((item) => {
      if (cats.length && !cats.includes(item.category)) return false;
      if (off.length && !bands.some((band) => off.includes(band.id) && band.test(item.discount ?? 0))) return false;
      if (brands.length && !brands.includes(item.brand)) return false;
      if (item.price < lo || item.price > hi) return false;
      if (query && !`${item.name} ${item.brand}`.toLowerCase().includes(query)) return false;
      return true;
    });
    if (sort === "chegirma") list.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
    else if (sort === "arzon") list.sort((a, b) => a.price - b.price);
    else if (sort === "qimmat") list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => b.reviews - a.reviews || b.rating - a.rating);
    return list;
  }, [all, brands, cats, max, min, off, q, sort]);

  const countCat = (id: string) => all.filter((item) => item.category === id).length;
  const countBand = (test: (d: number) => boolean) => all.filter((item) => test(item.discount ?? 0)).length;
  const shownBrands = brandList.filter(([name]) => name.toLowerCase().includes(brandQ.trim().toLowerCase())).slice(0, 8);

  function reset() {
    setQ("");
    setCats([]);
    setOff([]);
    setBrands([]);
    setBrandQ("");
    setMin("");
    setMax("");
    setSort("mashhurlik");
  }

  return (
    <MarketFrame active="sale" showPromo={false} headerQuery={q} onHeaderQuery={setQ} onHeaderSubmit={setQ}>
      <div className="axp" data-testid="sales-desktop">
        <div className="axp-top">
          <div>
            <h1>Aksiyalar</h1>
            <p>Maxsus takliflar va chegirmalar</p>
          </div>
          <div className="axp-banner">
            <span>
              <small>Stomatologlar uchun</small>
              <b>MAXSUS TAKLIFLAR</b>
              <em>Sifatli mahsulotlar - qulay narxlarda</em>
            </span>
            <img src="/img/marketing/aksiya-banner.jpg" alt="" />
          </div>
        </div>

        <div className="axp-chips" role="tablist" aria-label="Kategoriya">
          <button type="button" className={cats.length === 0 ? "on" : undefined} data-testid="sale-chip-all" onClick={() => setCats([])}>
            Barchasi ({all.length})
          </button>
          {categories.map((item) => (
            <button key={item.id} type="button" className={cats.length === 1 && cats[0] === item.id ? "on" : undefined} data-testid={`sale-chip-${item.id}`} onClick={() => setCats([item.id])}>
              {item.label} ({countCat(item.id)})
            </button>
          ))}
        </div>

        <div className="axp-body">
          <aside className="axp-filters" aria-label="Filtrlar">
            <header>
              <b>Filtrlar</b>
              <button type="button" onClick={reset}>Tozalash</button>
            </header>
            <section>
              <h3>Kategoriya</h3>
              <Check on={cats.length === 0} label="Barchasi" count={all.length} onClick={() => setCats([])} />
              {categories.map((item) => (
                <Check key={item.id} on={cats.includes(item.id)} label={item.label} count={countCat(item.id)} onClick={() => setCats(toggle(cats, item.id))} />
              ))}
            </section>
            <section>
              <h3>Chegirma foizi</h3>
              <Check on={off.length === 0} label="Barchasi" count={all.length} onClick={() => setOff([])} />
              {bands.map((band) => (
                <Check key={band.id} on={off.includes(band.id)} label={band.label} count={countBand(band.test)} onClick={() => setOff(toggle(off, band.id))} />
              ))}
            </section>
            <section>
              <h3>Narx oralig‘i</h3>
              <div className="axp-range">
                <input inputMode="numeric" aria-label="Eng kam narx" placeholder="0" value={min} onChange={(event) => setMin(event.target.value.replace(/\D/g, ""))} />
                <input inputMode="numeric" aria-label="Eng ko‘p narx" placeholder="5 000 000" value={max} onChange={(event) => setMax(event.target.value.replace(/\D/g, ""))} />
              </div>
            </section>
            {brandList.length ? (
              <section>
                <h3>Brendlar</h3>
                <label className="axp-bsearch">
                  <Search />
                  <input placeholder="Brend qidirish..." value={brandQ} onChange={(event) => setBrandQ(event.target.value)} />
                </label>
                {shownBrands.map(([name, count]) => (
                  <Check key={name} on={brands.includes(name)} label={name} count={count} onClick={() => setBrands(toggle(brands, name))} />
                ))}
              </section>
            ) : null}
          </aside>

          <div className="axp-results">
            <div className="axp-bar">
              <b>{rows === null ? "…" : `${items.length} ta mahsulot`}</b>
              <label className="axp-sort">
                <ArrowUpDown />
                <select data-testid="sale-sort" aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as SaleSort)}>
                  <option value="mashhurlik">Mashhurlik bo‘yicha</option>
                  <option value="chegirma">Chegirma foizi bo‘yicha</option>
                  <option value="arzon">Arzonroq</option>
                  <option value="qimmat">Qimmatroq</option>
                </select>
              </label>
              <div className="axp-view">
                <button type="button" aria-label="Katak" aria-pressed={view === "grid"} className={view === "grid" ? "on" : undefined} onClick={() => setView("grid")}><LayoutGrid /></button>
                <button type="button" aria-label="Ro‘yxat" aria-pressed={view === "list"} className={view === "list" ? "on" : undefined} onClick={() => setView("list")}><List /></button>
              </div>
            </div>
            {rows === null || items.length === 0 ? (
              <div className="axp-empty" data-testid="sale-empty">
                <p>{rows === null ? "Yuklanmoqda..." : rows.length === 0 ? "Hozircha aksiya yo‘q" : "Aksiya topilmadi"}</p>
                {rows && rows.length > 0 ? <button type="button" onClick={reset}>Filtrlarni tozalash</button> : null}
              </div>
            ) : (
              <div className={view === "grid" ? "axp-grid" : "axp-grid list"}>
                {items.map((item) => (
                  <SaleCard key={item.id} item={item} saved={saved.includes(item.id)} onSave={() => setSaved(toggle(saved, item.id))} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MarketFrame>
  );
}

function Check({ on, label, count, onClick }: { on: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button type="button" className={on ? "axp-check on" : "axp-check"} aria-pressed={on} onClick={onClick}>
      <i />
      <span>{label}</span>
      <small>{count}</small>
    </button>
  );
}

function SaleCard({ item, saved, onSave }: { item: CatalogCard; saved: boolean; onSave: () => void }) {
  const { add } = useCart();
  const [pulse, setPulse] = useState(false);
  const href = `/marketplace/${item.id}`;
  const inStock = item.inStock && item.stockQty !== 0;

  function addToCart() {
    add(item.id, productFromCatalog(item));
    setPulse(true);
    window.setTimeout(() => setPulse(false), 280);
  }

  return (
    <article className="axp-card" data-testid="sale-card">
      <div className="axp-ph">
        <Link href={href}>{item.image ? <img src={item.image} alt="" /> : null}</Link>
        {item.discount ? <span className="axp-off">-{item.discount}%</span> : null}
        <button type="button" className={saved ? "axp-heart on" : "axp-heart"} data-testid="sale-heart" aria-label="Sevimlilar" aria-pressed={saved} onClick={onSave}>
          <Heart fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="axp-info">
        <h3><Link href={href}>{item.name}</Link></h3>
        <p className="axp-brand">{item.brand}</p>
        {item.reviews > 0 ? <p className="axp-rate"><Star /> {item.rating.toFixed(1)} <span>({item.reviews})</span></p> : null}
        <div className="axp-buy">
          <span>
            {item.oldPrice ? <s>{formatMoney(item.oldPrice, "UZS")}</s> : null}
            <b>{formatMoney(item.price, "UZS")}</b>
            <em className={inStock ? undefined : "no"}>{inStock ? "Sotuvda mavjud" : "Tugagan"}</em>
          </span>
          <button type="button" className={pulse ? "axp-cart pulse" : "axp-cart"} data-testid="sale-cart" aria-label={`${item.name} savatga`} disabled={!inStock} onClick={addToCart}>
            <ShoppingCart />
          </button>
        </div>
      </div>
    </article>
  );
}
