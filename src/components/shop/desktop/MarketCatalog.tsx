"use client";
/* eslint-disable @next/next/no-img-element -- catalog thumbs stay contain inside a fixed box */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  Box,
  Check,
  ChevronDown,
  Droplets,
  Heart,
  LayoutGrid,
  Pencil,
  Scissors,
  Search,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { fetchCatalogProducts, productFromCatalog, type CatalogCard } from "@/lib/catalog-client";
import { formatGroupedNumber } from "@/lib/format";
import { MP_GROUPS, isKnownGroup, marketGroupId, marketGroupLabel } from "@/lib/mp-groups";
import { ShopShell } from "./ShopShell";
import { MarketRail } from "./MarketRail";
import { som } from "./shop-cart";
import "./marketplace-faithful.css";

type SortKey = "ommabop" | "arzon" | "qimmat" | "yangi" | "reyting";
type StockFilter = "all" | "ombor" | "buyurtma" | "tez";

const ICONS: Record<string, LucideIcon> = {
  all: LayoutGrid,
  kompozitlar: Droplets,
  bondlar: Droplets,
  endodontiya: Pencil,
  implantlar: Box,
  uchliklar: Wrench,
  asboblar: Scissors,
  uskunalar: Stethoscope,
  gigiyena: Sparkles,
  laboratoriya: Activity,
  materiallar: Droplets,
};

function isSortKey(value: string): value is SortKey {
  return value === "ommabop" || value === "arzon" || value === "qimmat" || value === "yangi" || value === "reyting";
}

function isNew(item: CatalogCard) {
  if (item.attrs.isNew === true) return true;
  const time = Date.parse(item.createdAt);
  return Number.isFinite(time) && time > Date.now() - 14 * 86_400_000;
}

function specOf(item: CatalogCard) {
  const type = typeof item.attrs.type === "string" ? item.attrs.type.trim() : "";
  const volume = typeof item.attrs.volume === "string" ? item.attrs.volume.trim() : "";
  const parts = [type, volume].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  return item.subcategory.trim();
}

function stockKind(item: CatalogCard): StockFilter {
  const status = typeof item.attrs.stockStatus === "string" ? item.attrs.stockStatus : "";
  if (status === "tez" || item.attrs.comingSoon === true) return "tez";
  if (status === "buyurtma") return "buyurtma";
  if (item.inStock && item.stockQty > 0) return "ombor";
  return "buyurtma";
}

function Photo({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className="mpx-spec">Rasm yo‘q</span>;
  return <img src={src} alt={alt} onError={() => setFailed(true)} />;
}

export function MarketCatalog() {
  const params = useSearchParams();
  const router = useRouter();
  const { add } = useCart();
  const favorites = useFavorites();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const brandParam = (params.get("brand") ?? "").trim().toLowerCase();
  const catParam = (params.get("category") || params.get("cat") || "").trim().toLowerCase();
  const sortParam = params.get("sort") ?? "";
  const [products, setProducts] = useState<CatalogCard[]>([]);
  const [ready, setReady] = useState(false);
  const [group, setGroup] = useState(() => (isKnownGroup(catParam) && catParam !== "all" && marketGroupLabel(catParam) ? (ALIAS_SAFE(catParam)) : "all"));
  const [brands, setBrands] = useState<string[]>(brandParam ? [brandParam] : []);
  const [brandQ, setBrandQ] = useState("");
  const [moreBrands, setMoreBrands] = useState(false);
  const [price, setPrice] = useState<[number, number] | null>(null);
  const [stock, setStock] = useState<StockFilter>("all");
  const [officialOnly, setOfficialOnly] = useState(false);
  const [rating, setRating] = useState<"all" | "5" | "4" | "3">("all");
  const [sort, setSort] = useState<SortKey>(() => (isSortKey(sortParam) ? sortParam : "ommabop"));
  const [open, setOpen] = useState<string | null>(null);
  const [pulse, setPulse] = useState<string | null>(null);

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

  useEffect(() => {
    const next = catParam;
    if (!next) setGroup("all");
    else if (isKnownGroup(next)) setGroup(next === "all" ? "all" : marketGroupId({ name: "", brand: "", category: next, subcategory: next }));
  }, [catParam]);

  const cap = useMemo(() => {
    const max = products.reduce((hi, item) => Math.max(hi, item.price), 0);
    if (max <= 0) return 1_000_000;
    return Math.max(100_000, Math.ceil(max / 100_000) * 100_000);
  }, [products]);
  const range = price ?? ([0, cap] as [number, number]);

  const groupCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of products) {
      const id = marketGroupId(item);
      map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [products]);

  const chips = useMemo(() => {
    const rows = [{ id: "all", label: "Barchasi" }];
    for (const item of MP_GROUPS) {
      if ((groupCounts.get(item.id) ?? 0) > 0) rows.push(item);
    }
    for (const [id, count] of groupCounts) {
      if (count > 0 && !rows.some((row) => row.id === id)) rows.push({ id, label: marketGroupLabel(id) });
    }
    return rows;
  }, [groupCounts]);

  function matches(item: CatalogCard, skip?: "brand" | "group" | "stock" | "official" | "rating") {
    if (skip !== "group" && group !== "all" && marketGroupId(item) !== group) return false;
    if (skip !== "brand" && brands.length && !brands.includes(item.brandKey)) return false;
    if (item.price < range[0] || (range[1] < cap && item.price > range[1])) return false;
    if (skip !== "stock" && stock !== "all" && stockKind(item) !== stock) return false;
    if (skip !== "official" && officialOnly && item.attrs.official !== true) return false;
    if (skip !== "rating" && rating === "5" && !(item.reviews > 0 && item.rating >= 4.5)) return false;
    if (skip !== "rating" && rating === "4" && !(item.reviews > 0 && item.rating >= 4)) return false;
    if (skip !== "rating" && rating === "3" && !(item.reviews > 0 && item.rating >= 3.5)) return false;
    if (q && !`${item.name} ${item.brand} ${item.subcategory}`.toLowerCase().includes(q)) return false;
    if (params.get("sale") === "1" && !item.discount) return false;
    return true;
  }

  const items = useMemo(() => {
    const rows = products.filter((item) => matches(item));
    rows.sort((a, b) => {
      if (sort === "arzon") return a.price - b.price;
      if (sort === "qimmat") return b.price - a.price;
      if (sort === "yangi") return Number(isNew(b)) - Number(isNew(a)) || b.createdAt.localeCompare(a.createdAt);
      if (sort === "reyting") return (b.reviews > 0 ? b.rating : 0) - (a.reviews > 0 ? a.rating : 0);
      return b.reviews - a.reviews || a.name.localeCompare(b.name, "uz");
    });
    return rows;
    // range/cap/group are the real inputs; matches closes over them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, cap, group, officialOnly, params, price, products, q, rating, sort, stock]);

  const brandRows = useMemo(() => {
    const map = new Map<string, { key: string; label: string; count: number }>();
    for (const item of products) {
      if (!matches(item, "brand")) continue;
      const prev = map.get(item.brandKey);
      if (prev) prev.count += 1;
      else map.set(item.brandKey, { key: item.brandKey, label: item.brand, count: 1 });
    }
    return [...map.values()].filter((row) => row.count > 0).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "uz"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, cap, group, officialOnly, price, products, q, rating, sort, stock]);

  const shownBrands = (moreBrands || brandQ ? brandRows : brandRows.slice(0, 8)).filter((row) => row.label.toLowerCase().includes(brandQ.toLowerCase()));

  const stockCounts = useMemo(() => {
    const counts = { ombor: 0, buyurtma: 0, tez: 0 };
    for (const item of products) {
      if (!matches(item, "stock")) continue;
      const kind = stockKind(item);
      if (kind !== "all") counts[kind] += 1;
    }
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, cap, group, officialOnly, price, products, q, rating, sort, stock]);

  const officialCount = useMemo(() => products.filter((item) => item.attrs.official === true && matches(item, "official")).length, [products, brands, group, officialOnly, price, q, rating, stock, cap]);
  const ratingCounts = useMemo(() => {
    let r5 = 0;
    let r4 = 0;
    let r3 = 0;
    for (const item of products) {
      if (!matches(item, "rating") || item.reviews <= 0) continue;
      if (item.rating >= 4.5) r5 += 1;
      if (item.rating >= 4) r4 += 1;
      if (item.rating >= 3.5) r3 += 1;
    }
    return { r5, r4, r3 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, cap, group, officialOnly, price, products, q, rating, sort, stock]);

  const panelGroups = chips.filter((chip) => chip.id !== "all" && (groupCounts.get(chip.id) ?? 0) > 0);

  function selectGroup(id: string) {
    setGroup(id);
    const usp = new URLSearchParams(params.toString());
    usp.delete("category");
    if (id === "all") usp.delete("cat");
    else usp.set("cat", id);
    router.replace(`/marketplace${usp.toString() ? `?${usp}` : ""}`, { scroll: false });
  }

  function clearFilters() {
    setGroup("all");
    setBrands([]);
    setPrice(null);
    setStock("all");
    setOfficialOnly(false);
    setRating("all");
    setBrandQ("");
    selectGroup("all");
  }

  function toggleBrand(key: string) {
    setBrands((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  function setMin(value: number) {
    setPrice([Math.max(0, Math.min(value, range[1])), range[1]]);
  }
  function setMax(value: number) {
    setPrice([range[0], Math.min(cap, Math.max(value, range[0]))]);
  }

  function addItem(item: CatalogCard) {
    add(item.id, productFromCatalog(item));
    setPulse(item.id);
    window.setTimeout(() => setPulse((current) => (current === item.id ? null : current)), 280);
  }

  return (
    <ShopShell className="mp-shell" searchPath="/marketplace" cartCount={0}>
      <div className="mpx" data-testid="market-catalog">
        <h1 className="mpx-h1">Stomatologik mahsulotlar</h1>
        <p className="mpx-sub">Sifatli materiallar, zamonaviy asboblar va ishonchli brendlar — StomaHub’da</p>
        <div className="mpx-chips">
          {chips.map((chip) => {
            const Icon = ICONS[chip.id] ?? LayoutGrid;
            const on = group === chip.id || (chip.id === "all" && group === "all");
            return (
              <button key={chip.id} type="button" className={on ? "mpx-chip on" : "mpx-chip"} data-testid={`market-chip-${chip.id}`} onClick={() => selectGroup(chip.id)}>
                <Icon className="i" />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mpx-bar">
          <Drop label="Filtrlar" active={group !== "all" || brands.length > 0 || stock !== "all" || officialOnly} open={open === "filtr"} onToggle={() => setOpen(open === "filtr" ? null : "filtr")}>
            {panelGroups.map((item) => (
              <CheckRow key={item.id} label={item.label} count={groupCounts.get(item.id) ?? 0} on={group === item.id} onClick={() => selectGroup(group === item.id ? "all" : item.id)} />
            ))}
            <button type="button" className="mpx-more" onClick={clearFilters}>Barchasini tozalash</button>
          </Drop>
          {brandRows.length ? (
            <Drop label="Brend" active={brands.length > 0} open={open === "brend"} onToggle={() => setOpen(open === "brend" ? null : "brend")}>
              {shownBrands.map((brand) => (
                <CheckRow key={brand.key} label={brand.label} count={brand.count} on={brands.includes(brand.key)} onClick={() => toggleBrand(brand.key)} />
              ))}
            </Drop>
          ) : null}
          <Drop label="Narx oralig‘i (so‘m)" active={range[0] > 0 || range[1] < cap} open={open === "narx"} onToggle={() => setOpen(open === "narx" ? null : "narx")}>
            <PriceRange cap={cap} range={range} setMin={setMin} setMax={setMax} />
          </Drop>
          {stockCounts.ombor + stockCounts.buyurtma + stockCounts.tez > 0 ? (
            <Drop label="Mavjudligi" active={stock !== "all"} open={open === "stock"} onToggle={() => setOpen(open === "stock" ? null : "stock")}>
              {stockCounts.ombor > 0 ? <RadioRow label="Omborda bor" count={stockCounts.ombor} on={stock === "ombor"} onClick={() => setStock(stock === "ombor" ? "all" : "ombor")} /> : null}
              {stockCounts.buyurtma > 0 ? <RadioRow label="Buyurtma asosida" count={stockCounts.buyurtma} on={stock === "buyurtma"} onClick={() => setStock(stock === "buyurtma" ? "all" : "buyurtma")} /> : null}
              {stockCounts.tez > 0 ? <RadioRow label="Tez orada" count={stockCounts.tez} on={stock === "tez"} onClick={() => setStock(stock === "tez" ? "all" : "tez")} /> : null}
            </Drop>
          ) : null}
          {officialCount > 0 ? (
            <Drop label="Rasmiy distribyutor" active={officialOnly} open={open === "off"} onToggle={() => setOpen(open === "off" ? null : "off")}>
              <CheckRow label="Faqat rasmiy" count={officialCount} on={officialOnly} onClick={() => setOfficialOnly((value) => !value)} />
            </Drop>
          ) : null}
          {ratingCounts.r3 > 0 ? (
            <Drop label="Reyting" active={rating !== "all"} open={open === "rate"} onToggle={() => setOpen(open === "rate" ? null : "rate")}>
              {ratingCounts.r5 > 0 ? <RadioRow label="4.5+" count={ratingCounts.r5} on={rating === "5"} onClick={() => setRating(rating === "5" ? "all" : "5")} /> : null}
              {ratingCounts.r4 > 0 ? <RadioRow label="4.0+" count={ratingCounts.r4} on={rating === "4"} onClick={() => setRating(rating === "4" ? "all" : "4")} /> : null}
              {ratingCounts.r3 > 0 ? <RadioRow label="3.5+" count={ratingCounts.r3} on={rating === "3"} onClick={() => setRating(rating === "3" ? "all" : "3")} /> : null}
            </Drop>
          ) : null}
          <label className="mpx-sort">
            Saralash:
            <select aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
              <option value="ommabop">Ommabop</option>
              <option value="arzon">Arzon</option>
              <option value="qimmat">Qimmat</option>
              <option value="yangi">Yangi</option>
              {products.some((item) => item.reviews > 0) ? <option value="reyting">Reyting</option> : null}
            </select>
            <ChevronDown className="i" />
          </label>
        </div>
        <div className="mpx-cols">
          <aside className="mpx-panel">
            <h4>
              Kategoriya
              <button type="button" onClick={clearFilters}>Tozalash</button>
            </h4>
            {panelGroups.map((item) => (
              <CheckRow key={item.id} label={item.label} count={groupCounts.get(item.id) ?? 0} on={group === item.id} onClick={() => selectGroup(group === item.id ? "all" : item.id)} />
            ))}
            {brandRows.length ? (
              <>
                <h4>Brend</h4>
                <label className="mpx-search">
                  <Search className="i" />
                  <input value={brandQ} onChange={(event) => setBrandQ(event.target.value)} placeholder="Brend qidirish..." aria-label="Brend qidirish" />
                </label>
                {shownBrands.map((brand) => (
                  <CheckRow key={brand.key} label={brand.label} count={brand.count} on={brands.includes(brand.key)} onClick={() => toggleBrand(brand.key)} />
                ))}
                {!brandQ && brandRows.length > 8 ? (
                  <button type="button" className="mpx-more" onClick={() => setMoreBrands((value) => !value)}>
                    {moreBrands ? "Yig‘ish" : "Yana ko‘rsatish"}
                  </button>
                ) : null}
              </>
            ) : null}
            <h4>Narx oralig‘i (so‘m)</h4>
            <PriceRange cap={cap} range={range} setMin={setMin} setMax={setMax} />
            {stockCounts.ombor + stockCounts.buyurtma + stockCounts.tez > 0 ? (
              <>
                <h4>Mavjudligi</h4>
                {stockCounts.ombor > 0 ? <RadioRow label="Omborda bor" count={stockCounts.ombor} on={stock === "ombor"} onClick={() => setStock(stock === "ombor" ? "all" : "ombor")} /> : null}
                {stockCounts.buyurtma > 0 ? <RadioRow label="Buyurtma asosida" count={stockCounts.buyurtma} on={stock === "buyurtma"} onClick={() => setStock(stock === "buyurtma" ? "all" : "buyurtma")} /> : null}
                {stockCounts.tez > 0 ? <RadioRow label="Tez orada" count={stockCounts.tez} on={stock === "tez"} onClick={() => setStock(stock === "tez" ? "all" : "tez")} /> : null}
              </>
            ) : null}
            {officialCount > 0 ? (
              <>
                <h4>Rasmiy distribyutor</h4>
                <CheckRow label="Faqat rasmiy" count={officialCount} on={officialOnly} onClick={() => setOfficialOnly((value) => !value)} />
              </>
            ) : null}
          </aside>
          <div>
            {!ready || items.length === 0 ? (
              <div className="mpx-empty">
                <b>{!ready ? "Yuklanmoqda..." : products.length === 0 ? "Hozircha mahsulot yo‘q" : "Mos mahsulot topilmadi"}</b>
                <p className="mpx-sub">{products.length === 0 ? "Do‘konlar e’lon joylagach, ular shu yerda chiqadi." : "Filtrlarni o‘zgartiring."}</p>
                {products.length ? (
                  <button type="button" onClick={clearFilters}>Tozalash</button>
                ) : null}
              </div>
            ) : (
              <div className="mpx-grid">
                {items.map((item) => {
                  const spec = specOf(item);
                  const saved = favorites.has(item.id);
                  const inStock = item.inStock && item.stockQty > 0;
                  const fresh = isNew(item) && !item.discount;
                  return (
                    <article className="mpx-card" key={item.id}>
                      <div className="mpx-ph">
                        <Link href={`/marketplace/${item.id}`} aria-label={item.name}>
                          <Photo src={item.image} alt="" />
                        </Link>
                        {item.discount ? <span className="mpx-badge sale">-{item.discount}%</span> : fresh ? <span className="mpx-badge new">Yangi</span> : null}
                        <button type="button" className={saved ? "mpx-heart on" : "mpx-heart"} aria-label="Sevimlilarga" aria-pressed={saved} onClick={() => favorites.toggle(item.id)}>
                          <Heart className="i" fill={saved ? "currentColor" : "none"} />
                        </button>
                      </div>
                      <h3 className="mpx-name">
                        <Link href={`/marketplace/${item.id}`}>{item.name}</Link>
                      </h3>
                      {spec ? <p className="mpx-spec">{spec}</p> : null}
                      {item.brand && item.brand !== "Brend" ? <p className="mpx-brand">{item.brand}</p> : null}
                      {item.reviews > 0 ? (
                        <p className="mpx-rate">
                          <StarIcon /> <b>{item.rating.toFixed(1)}</b> ({item.reviews} ta sharh)
                        </p>
                      ) : null}
                      <p className={inStock ? "mpx-stock" : "mpx-stock out"}>
                        <i />
                        {inStock ? "Omborda bor" : stockKind(item) === "tez" ? "Tez orada" : stockKind(item) === "buyurtma" ? "Buyurtma asosida" : "Tugagan"}
                      </p>
                      <div className="mpx-buyrow">
                        <div className="mpx-price">
                          {item.oldPrice ? <s>{som(item.oldPrice)}</s> : null}
                          <strong className={item.discount ? "sale" : undefined}>{som(item.price)}</strong>
                        </div>
                        <button type="button" className="mpx-add" aria-label={`${item.name} savatga`} disabled={!inStock} onClick={() => addItem(item)} data-pulse={pulse === item.id ? "1" : undefined}>
                          <ShoppingCart className="i" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
          <MarketRail />
        </div>
      </div>
    </ShopShell>
  );
}

function ALIAS_SAFE(value: string) {
  return marketGroupId({ name: "", brand: "", category: value, subcategory: value });
}

function StarIcon() {
  return (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17.8 6.6 19.8l1-6.1L3.2 9.4l6.1-.9L12 3z" />
    </svg>
  );
}

function CheckRow({ label, count, on, onClick }: { label: string; count: number; on: boolean; onClick: () => void }) {
  if (count <= 0 && !on) return null;
  return (
    <button type="button" className={on ? "mpx-check on" : "mpx-check"} onClick={onClick}>
      <span className="mpx-box">{on ? <Check className="i" /> : null}</span>
      <span>{label}</span>
      <em>{count}</em>
    </button>
  );
}

function RadioRow({ label, count, on, onClick }: { label: string; count: number; on: boolean; onClick: () => void }) {
  if (count <= 0) return null;
  return (
    <button type="button" className={on ? "mpx-radio on" : "mpx-radio"} onClick={onClick}>
      <span className="mpx-dot">{on ? <span className="i" /> : null}</span>
      <span>{label}</span>
      <em>{count}</em>
    </button>
  );
}

function Drop({
  label,
  active,
  open,
  onToggle,
  children,
}: {
  label: string;
  active?: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={active ? "mpx-drop on" : "mpx-drop"}>
      <button type="button" aria-expanded={open} onClick={onToggle}>
        {label}
        <ChevronDown className="i" />
      </button>
      {open ? <div className="mpx-pop">{children}</div> : null}
    </div>
  );
}

function PriceRange({
  range,
  setMin,
  setMax,
}: {
  cap: number;
  range: [number, number];
  setMin: (value: number) => void;
  setMax: (value: number) => void;
}) {
  return (
    <div>
      <div className="mpx-prices">
        <input aria-label="Minimal narx" value={formatGroupedNumber(range[0])} onChange={(event) => setMin(Number(event.target.value.replace(/\D/g, "")) || 0)} />
        <span>–</span>
        <input aria-label="Maksimal narx" value={formatGroupedNumber(range[1])} onChange={(event) => setMax(Number(event.target.value.replace(/\D/g, "")) || 0)} />
      </div>
    </div>
  );
}
