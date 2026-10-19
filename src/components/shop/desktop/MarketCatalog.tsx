"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  Box,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock3,
  Droplets,
  Grid3x3,
  Heart,
  LayoutGrid,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Star,
  Stethoscope,
  Wrench,
} from "lucide-react";
import {
  PRICE_MAX,
  marketBrands,
  marketChips,
  marketHref,
  marketProducts,
  type MarketProduct,
  type ShopCategory,
  type StockKind,
} from "@/data/desktop-shop";
import { shopAdd, shopToggleFav, som, somPlain, useShopFavs, useShopLines } from "./shop-cart";
import { CartRail, CheckRow, RangeSlider } from "./parts";
import { ShopShell } from "./ShopShell";
import "./market-catalog.css";

type SortKey = "ommabop" | "arzon" | "qimmat" | "yangi";
type RatingFilter = "all" | "4.5" | "4" | "3.5";
type DropId = "brend" | "narx" | "mavjud" | "rasmiy" | "reyting" | null;

const shopCats: ShopCategory[] = ["kompozitlar", "bondlar", "endodontiya", "implantlar", "uchliklar", "asboblar", "uskunalar", "gigiyena"];

const catAlias: Record<string, ShopCategory> = {
  materiallar: "kompozitlar",
  terapiya: "kompozitlar",
  laboratoriya: "bondlar",
  ortopediya: "bondlar",
  implantologiya: "implantlar",
  jarrohlik: "uchliklar",
  jihozlar: "uskunalar",
};

function catsFromQuery(raw: string): ShopCategory[] {
  if (shopCats.includes(raw as ShopCategory)) return [raw as ShopCategory];
  return catAlias[raw] ? [catAlias[raw]] : [];
}

function isSortKey(value: string): value is SortKey {
  return value === "ommabop" || value === "arzon" || value === "qimmat" || value === "yangi";
}

const sortLabels: Record<SortKey, string> = { ommabop: "Ommabop", arzon: "Arzonroq", qimmat: "Qimmatroq", yangi: "Yangi" };

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

const catLabel = Object.fromEntries(marketChips.map((chip) => [chip.id, chip.label])) as Record<ShopCategory | "all", string>;
const brandLabel = Object.fromEntries(marketBrands.map((brand) => [brand.key, brand.label])) as Record<string, string>;

/** Real counts from the catalog — never invented totals. */
function countBy<K extends string>(rows: MarketProduct[], key: (row: MarketProduct) => K) {
  const map = new Map<K, number>();
  for (const row of rows) map.set(key(row), (map.get(key(row)) ?? 0) + 1);
  return map;
}

function ratingOk(value: number, filter: RatingFilter) {
  return filter === "all" || value >= Number(filter);
}

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function MarketCatalog() {
  const params = useSearchParams();
  const lines = useShopLines();
  const favs = useShopFavs();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const brandParam = (params.get("brand") ?? "").trim();
  const catParam = params.get("cat") ?? "";
  const sortParam = params.get("sort") ?? "";
  const sale = params.get("sale") === "1";
  const savedOnly = params.get("saqlangan") === "1";

  const [cats, setCats] = useState<ShopCategory[]>(() => catsFromQuery(catParam));
  const [brands, setBrands] = useState<string[]>(brandParam ? [brandParam] : []);
  const [brandQ, setBrandQ] = useState("");
  const [moreBrands, setMoreBrands] = useState(false);
  const [price, setPrice] = useState<[number, number]>([0, PRICE_MAX]);
  const [stocks, setStocks] = useState<StockKind[]>([]);
  const [official, setOfficial] = useState(false);
  const [rating, setRating] = useState<RatingFilter>("all");
  const [sort, setSort] = useState<SortKey>(() => (isSortKey(sortParam) ? sortParam : "ommabop"));
  const [panel, setPanel] = useState(true);
  const [drop, setDrop] = useState<DropId>(null);
  const [closed, setClosed] = useState<string[]>([]);
  const [pulse, setPulse] = useState<string | null>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (brandParam) setBrands([brandParam]);
  }, [brandParam]);
  useEffect(() => {
    setCats(catsFromQuery(catParam));
  }, [catParam]);
  useEffect(() => {
    if (isSortKey(sortParam)) setSort(sortParam);
  }, [sortParam]);

  // Close an open toolbar dropdown on outside click / Escape.
  useEffect(() => {
    if (!drop) return;
    const onDown = (event: MouseEvent) => {
      if (!toolsRef.current?.contains(event.target as Node)) setDrop(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrop(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [drop]);

  const catCounts = useMemo(() => countBy(marketProducts, (row) => row.category), []);
  const brandCounts = useMemo(() => countBy(marketProducts, (row) => row.brandKey), []);
  const stockCounts = useMemo(() => countBy(marketProducts, (row) => row.stock), []);
  const officialCount = useMemo(() => marketProducts.filter((row) => row.official).length, []);

  const brandRows = useMemo(() => {
    const keys = [...brandCounts.keys()];
    // A brand chosen from /marketplace/brendlar stays visible even with 0 products.
    for (const key of brands) if (!keys.includes(key)) keys.push(key);
    return keys
      .map((key) => ({ key, label: brandLabel[key] ?? marketProducts.find((row) => row.brandKey === key)?.brand ?? key, count: brandCounts.get(key) ?? 0 }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [brandCounts, brands]);

  const items = useMemo(() => {
    const rows = marketProducts.filter((item) => {
      if (cats.length && !cats.includes(item.category)) return false;
      if (brands.length && !brands.includes(item.brandKey)) return false;
      if (item.price < price[0] || item.price > price[1]) return false;
      if (stocks.length && !stocks.includes(item.stock)) return false;
      if (official && !item.official) return false;
      if (!ratingOk(item.rating, rating)) return false;
      if (sale && !item.discount) return false;
      if (savedOnly && !favs.includes(item.id)) return false;
      if (q && !`${item.name} ${item.cardTitle ?? ""} ${item.cardSub ?? ""} ${item.subtitle} ${item.brand}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sort === "arzon") return a.price - b.price;
      if (sort === "qimmat") return b.price - a.price;
      if (sort === "yangi") return Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)) || b.popularity - a.popularity;
      return b.popularity - a.popularity;
    });
  }, [brands, cats, favs, official, price, q, rating, sale, savedOnly, sort, stocks]);

  const priceOn = price[0] > 0 || price[1] < PRICE_MAX;

  function resetAll() {
    setCats([]);
    setBrands([]);
    setBrandQ("");
    setPrice([0, PRICE_MAX]);
    setStocks([]);
    setOfficial(false);
    setRating("all");
  }

  function add(item: MarketProduct) {
    shopAdd({
      id: item.id,
      name: item.cardTitle ?? item.name,
      variant: item.cardSub,
      price: item.price,
      image: item.image,
      href: marketHref(item.id),
      seller: "StomaHub Market",
      official: item.official,
    });
    setPulse(item.id);
    window.setTimeout(() => setPulse(null), 320);
  }

  const isClosed = (id: string) => closed.includes(id);
  const flip = (id: string) => setClosed((list) => toggle(list, id));
  const shownBrands = brandRows.filter((row) => row.label.toLowerCase().includes(brandQ.trim().toLowerCase()));
  const visibleBrands = moreBrands || brandQ ? shownBrands : shownBrands.slice(0, 8);

  const brandList = (
    <>
      {visibleBrands.map((brand) => (
        <CheckRow key={brand.key} label={brand.label} count={brand.count} on={brands.includes(brand.key)} onClick={() => setBrands((list) => toggle(list, brand.key))} />
      ))}
      {visibleBrands.length === 0 ? <p className="mk-none">Brend topilmadi</p> : null}
    </>
  );

  const stockList = (
    <>
      <CheckRow label="Omborda bor" count={stockCounts.get("ombor") ?? 0} on={stocks.includes("ombor")} onClick={() => setStocks((list) => toggle(list, "ombor"))} />
      <CheckRow label="Buyurtma asosida" count={stockCounts.get("buyurtma") ?? 0} on={stocks.includes("buyurtma")} onClick={() => setStocks((list) => toggle(list, "buyurtma"))} />
    </>
  );

  const ratingList = (
    <>
      {(["4.5", "4", "3.5"] as const).map((value) => (
        <button key={value} type="button" className={rating === value ? "dk-radio on" : "dk-radio"} onClick={() => setRating(rating === value ? "all" : value)}>
          <span className="dot" />
          <span className="mk-stars-row">
            <Star className="i" /> {Number(value).toFixed(1)} va yuqori
          </span>
          <em>{marketProducts.filter((row) => row.rating >= Number(value)).length}</em>
        </button>
      ))}
    </>
  );

  const priceInputs = (
    <div className="mk-price-in">
      <label>
        <span className="sr">Narx: dan (so‘m)</span>
        <input inputMode="numeric" value={somPlain(price[0])} onChange={(event) => setPrice([Math.min(Number(event.target.value.replace(/\D/g, "")) || 0, price[1]), price[1]])} />
      </label>
      <label>
        <span className="sr">Narx: gacha (so‘m)</span>
        <input inputMode="numeric" value={somPlain(price[1])} onChange={(event) => setPrice([price[0], Math.max(Math.min(Number(event.target.value.replace(/\D/g, "")) || 0, PRICE_MAX), price[0])])} />
      </label>
    </div>
  );

  return (
    <ShopShell searchPath="/marketplace" cartCount={lines.reduce((sum, line) => sum + line.qty, 0)}>
      <div className="mk" data-testid="market-catalog">
        <div className="mk-main">
          <h1 className="mk-h1">Stomatologik mahsulotlar</h1>
          <p className="mk-sub">Sifatli materiallar, zamonaviy asboblar va ishonchli brendlar – StomaHub’da</p>

          <div className="mk-chips">
            {marketChips.map((chip) => {
              const Icon = chipIcon[chip.id];
              const on = chip.id === "all" ? cats.length === 0 : cats.length === 1 && cats[0] === chip.id;
              return (
                <button key={chip.id} type="button" className={on ? "mk-chip on" : "mk-chip"} data-testid={`market-chip-${chip.id}`} aria-pressed={on} onClick={() => setCats(chip.id === "all" ? [] : [chip.id])}>
                  <Icon className="i" /> {chip.label}
                </button>
              );
            })}
          </div>

          <div className="mk-tools" ref={toolsRef}>
            <button type="button" className={panel ? "mk-filtr on" : "mk-filtr"} aria-pressed={panel} onClick={() => setPanel((value) => !value)}>
              <SlidersHorizontal className="i" /> Filtrlar
            </button>
            <Drop id="brend" label="Brend" active={brands.length > 0} drop={drop} setDrop={setDrop}>
              <label className="dk-search">
                <Search className="i" />
                <input value={brandQ} onChange={(event) => setBrandQ(event.target.value)} placeholder="Brend qidirish..." aria-label="Brend qidirish" />
              </label>
              {brandList}
            </Drop>
            <Drop id="narx" label="Narx oralig‘i (so‘m)" active={priceOn} drop={drop} setDrop={setDrop} wide>
              {priceInputs}
              <RangeSlider min={0} max={PRICE_MAX} value={price} onChange={setPrice} />
            </Drop>
            <Drop id="mavjud" label="Mavjudligi" active={stocks.length > 0} drop={drop} setDrop={setDrop}>
              {stockList}
            </Drop>
            <Drop id="rasmiy" label="Rasmiy distribyutor" active={official} drop={drop} setDrop={setDrop}>
              <CheckRow label="Faqat rasmiy" count={officialCount} on={official} onClick={() => setOfficial((value) => !value)} />
            </Drop>
            <Drop id="reyting" label="Reyting" icon={<Star className="i star" />} active={rating !== "all"} drop={drop} setDrop={setDrop}>
              {ratingList}
            </Drop>
            <label className="mk-sort">
              <span>Saralash:</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} aria-label="Saralash">
                {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                  <option key={key} value={key}>
                    {sortLabels[key]}
                  </option>
                ))}
              </select>
              <ChevronDown className="i" />
            </label>
          </div>

          <div className={panel ? "mk-body" : "mk-body wide"}>
            {panel ? (
              <aside className="mk-panel" aria-label="Filtrlar">
                <Section id="kat" title="Kategoriya" closed={isClosed("kat")} flip={flip}>
                  <CheckRow label="Barchasi" count={marketProducts.length} on={cats.length === 0} onClick={() => setCats([])} />
                  {shopCats.map((id) => (
                    <CheckRow key={id} label={catLabel[id]} count={catCounts.get(id) ?? 0} on={cats.includes(id)} onClick={() => setCats((list) => toggle(list, id))} />
                  ))}
                </Section>
                <Section id="brend" title="Brend" closed={isClosed("brend")} flip={flip}>
                  <label className="dk-search">
                    <Search className="i" />
                    <input value={brandQ} onChange={(event) => setBrandQ(event.target.value)} placeholder="Brend qidirish..." aria-label="Brend qidirish" />
                  </label>
                  {brandList}
                  {!brandQ && shownBrands.length > 8 ? (
                    <button type="button" className="mk-more" onClick={() => setMoreBrands((value) => !value)}>
                      {moreBrands ? "Yig‘ish" : "Yana ko‘rsatish"} {moreBrands ? <ChevronUp className="i" /> : <ChevronDown className="i" />}
                    </button>
                  ) : null}
                </Section>
                <Section id="narx" title="Narx oralig‘i (so‘m)" closed={isClosed("narx")} flip={flip}>
                  {priceInputs}
                  <RangeSlider min={0} max={PRICE_MAX} value={price} onChange={setPrice} />
                </Section>
                <Section id="mavjud" title="Mavjudligi" closed={isClosed("mavjud")} flip={flip}>
                  {stockList}
                </Section>
                <Section id="rasmiy" title="Rasmiy distribyutor" closed={isClosed("rasmiy")} flip={flip}>
                  <CheckRow label="Faqat rasmiy" count={officialCount} on={official} onClick={() => setOfficial((value) => !value)} />
                </Section>
                <Section id="reyting" title="Reyting" closed={isClosed("reyting")} flip={flip}>
                  {ratingList}
                </Section>
                <button type="button" className="mk-reset" onClick={resetAll}>
                  Filtrlarni tozalash
                </button>
              </aside>
            ) : null}

            <div>
              {items.length === 0 ? (
                <div className="mk-empty">
                  <b>Mos mahsulot topilmadi</b>
                  <p>{brands.length === 1 && !brandCounts.get(brands[0]) ? `${brandLabel[brands[0]] ?? brands[0]} mahsulotlari tez orada qo‘shiladi.` : "Filtrlarni o‘zgartirib ko‘ring."}</p>
                  <button type="button" onClick={resetAll}>
                    Filtrlarni tozalash
                  </button>
                </div>
              ) : (
                <div className="mk-grid">
                  {items.map((item) => {
                    const fav = favs.includes(item.id);
                    return (
                      <article className="mk-card" key={item.id}>
                        <Link href={marketHref(item.id)} className="ph" aria-label={item.name}>
                          <img src={item.image} alt="" />
                        </Link>
                        {item.discount ? <span className="mk-badge sale">-{item.discount}%</span> : item.isNew ? <span className="mk-badge new">Yangi</span> : null}
                        <button type="button" className={fav ? "mk-fav on" : "mk-fav"} aria-label={fav ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"} aria-pressed={fav} onClick={() => shopToggleFav(item.id)}>
                          <Heart className="i" />
                        </button>
                        <h3>
                          <Link href={marketHref(item.id)}>{item.cardTitle ?? item.name}</Link>
                        </h3>
                        <div className="sub">{item.cardSub ?? item.subtitle}</div>
                        <div className="brand">{item.brand}</div>
                        <div className="rate">
                          <Star className="i" /> <b>{item.rating.toFixed(1)}</b> <span>({item.reviews} ta sharh)</span>
                        </div>
                        {item.stock === "ombor" ? (
                          <div className="stock">
                            <CheckCircle2 className="i" /> Omborda bor
                          </div>
                        ) : (
                          <div className="stock order">
                            <Clock3 className="i" /> Buyurtma asosida
                          </div>
                        )}
                        <div className="foot">
                          <div className="price">
                            {item.oldPrice && item.discount ? <s>{som(item.oldPrice)}</s> : null}
                            <strong className={item.discount ? "sale" : undefined}>{som(item.price)}</strong>
                          </div>
                          <button type="button" className={pulse === item.id ? "mk-add pulse" : "mk-add"} aria-label={`${item.cardTitle ?? item.name} — savatga qo‘shish`} onClick={() => add(item)}>
                            <ShoppingCart className="i" />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        <CartRail lines={lines} />
      </div>
    </ShopShell>
  );
}

function Drop({
  id,
  label,
  icon,
  active,
  drop,
  setDrop,
  wide,
  children,
}: {
  id: Exclude<DropId, null>;
  label: string;
  icon?: ReactNode;
  active: boolean;
  drop: DropId;
  setDrop: (next: DropId) => void;
  wide?: boolean;
  children: ReactNode;
}) {
  const open = drop === id;
  return (
    <div className={`mk-drop${active ? " active" : ""}${open ? " open" : ""}`}>
      <button type="button" aria-expanded={open} onClick={() => setDrop(open ? null : id)}>
        {icon}
        <span>{label}</span>
        <ChevronDown className="i chev" />
      </button>
      {open ? <div className={wide ? "mk-pop wide" : "mk-pop"}>{children}</div> : null}
    </div>
  );
}

function Section({ id, title, closed, flip, children }: { id: string; title: string; closed: boolean; flip: (id: string) => void; children: ReactNode }) {
  return (
    <section className="mk-sec">
      <button type="button" className="mk-sec-hd" aria-expanded={!closed} onClick={() => flip(id)}>
        {title}
        {closed ? <ChevronDown className="i" /> : <ChevronUp className="i" />}
      </button>
      {closed ? null : <div className="mk-sec-bd">{children}</div>}
    </section>
  );
}
