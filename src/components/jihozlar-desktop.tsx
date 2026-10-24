"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Check, ChevronDown, ChevronRight, Heart, Search, ShoppingCart, Star, Truck, X } from "lucide-react";
import { CheckRow, FilterGroup, PriceInput } from "@/components/ortiqcha-desktop";
import { SafeProductImage } from "@/components/safe-product-image";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { jihozBestseller, jihozType, jihozTypes, type JihozType } from "@/data/jihoz";
import {
  conditionLabels,
  conditionOrder,
  marketplaceListingOrder,
  productCondition,
  productHref,
  productOldPrice,
  type Product,
  type ProductCondition,
} from "@/data/products";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type SortKey = "popular" | "cheap" | "expensive" | "rating" | "discount";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "popular", label: "Mashhurlari" },
  { key: "cheap", label: "Arzonroq" },
  { key: "expensive", label: "Qimmatroq" },
  { key: "rating", label: "Yuqori reyting" },
  { key: "discount", label: "Katta chegirma" },
];

const PRICE_MAX = 26_000_000;
const PRICE_STEP = 100_000;

const conditionText: Record<ProductCondition, string> = {
  yangi: "Yangi",
  ishlatilgan: "Ishlatilgan",
  ochilgan: "Refurbished",
};

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function JihozCard({ product }: { product: Product }) {
  const { add } = useCart();
  const favorites = useFavorites();
  const saved = favorites.has(product.id);
  const href = productHref(product);
  const oldPrice = productOldPrice(product);
  const condition = productCondition(product);
  const badge = product.discount
    ? { text: `-${product.discount}%`, cls: "bg-[#ef4444] text-white" }
    : jihozBestseller(product)
      ? { text: "Bestseller", cls: "bg-[#0F766E] text-white" }
      : condition === "yangi"
        ? { text: "Yangi", cls: "bg-[#16a34a] text-white" }
        : { text: conditionText[condition], cls: "bg-[#f59e0b] text-white" };
  const stock = product.inStock
    ? typeof product.stockQty === "number" && product.stockQty > 0 && product.stockQty < 20
      ? `Omborda ${product.stockQty}`
      : "Omborda 20+"
    : "Buyurtma asosida";
  const delivery = product.delivery.includes("24") ? product.delivery : product.delivery || "Toshkent 24 soat";

  return (
    <article className="flex flex-col rounded-[14px] border border-[#eceff5] bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.09)]">
      <div className="relative overflow-hidden rounded-xl bg-[#f7f9fc]">
        <span className={cn("absolute top-2 left-2 z-10 rounded-md px-2 py-[3px] text-[10.5px] leading-none font-bold", badge.cls)}>
          {badge.text}
        </span>
        <button
          type="button"
          onClick={() => favorites.toggle(product.id)}
          aria-label="Sevimlilarga"
          aria-pressed={saved}
          className="absolute top-2 right-2 z-10 grid size-8 place-items-center rounded-full bg-white text-slate-400 shadow-sm hover:text-[#f43f5e]"
        >
          <Heart className={cn("size-4", saved && "fill-[#f43f5e] text-[#f43f5e]")} />
        </button>
        <Link href={href} className="relative block aspect-[1.1/1] w-full">
          <SafeProductImage
            src={product.image}
            alt={product.name}
            category={product.category}
            fill
            sizes="260px"
            className="object-contain p-3 mix-blend-multiply"
          />
        </Link>
      </div>
      <p className="mt-3 inline-flex items-center gap-1 text-[11px] font-extrabold tracking-wide text-[#0B1F4D] uppercase">
        {product.brand}
        <BadgeCheck className="size-3.5 fill-[#0F766E] text-white" />
      </p>
      <Link href={href} className="mt-0.5 block">
        <h3 className="line-clamp-2 min-h-[38px] text-[14px] leading-[19px] font-semibold text-[#1a1d26] hover:text-[#0F766E]">
          {product.name}
        </h3>
      </Link>
      {product.reviews > 0 ? (
        <p className="mt-1 flex items-center gap-1 text-[12px]">
          <Star className="size-3.5 fill-[#f5b942] text-[#f5b942]" />
          <span className="font-semibold text-[#1a1d26]">{product.rating.toFixed(1)}</span>
          <span className="text-[#8b93a7]">({product.reviews})</span>
        </p>
      ) : null}
      <div className="mt-2 space-y-0.5 text-[11.5px]">
        <p className={cn("flex items-center gap-1 font-medium", product.inStock ? "text-[#16a34a]" : "text-[#8b93a7]")}>
          <Check className="size-3.5" strokeWidth={2.6} />
          {stock}
        </p>
        <p className="flex items-center gap-1 text-[#0F766E]">
          <Truck className="size-3.5" />
          {delivery}
        </p>
      </div>
      <div className="mt-auto pt-3">
        <div className="flex flex-wrap items-baseline gap-1.5">
          <p className="text-[17px] font-extrabold text-[#0B1F4D]">{formatMoney(product.price, "UZS")}</p>
          {oldPrice ? <p className="text-[12px] text-[#9aa3b2] line-through">{formatMoney(oldPrice, "UZS")}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => add(product.id, product.listedBySeller ? product : undefined)}
          className="mt-2 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#0F766E] text-[13px] font-semibold text-white shadow-[0_3px_10px_rgba(15,118,110,0.25)] transition-colors hover:bg-[#115E59]"
        >
          <ShoppingCart className="size-3.5" />
          Savatga qo‘shish
        </button>
      </div>
    </article>
  );
}

export function JihozlarDesktop({ catalog, q }: { catalog: Product[]; q: string }) {
  const all = useMemo(() => catalog.filter((p) => p.category === "jihozlar" && p.active !== false), [catalog]);
  const [types, setTypes] = useState<JihozType[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [conditions, setConditions] = useState<ProductCondition[]>([]);
  const [warranty, setWarranty] = useState(false);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(PRICE_MAX);
  const [brandQuery, setBrandQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("popular");

  function matches(item: Product, skip?: "type" | "brand" | "condition") {
    if (q && !`${item.name} ${item.brand}`.toLowerCase().includes(q)) return false;
    if (skip !== "type" && types.length && !types.includes(jihozType(item))) return false;
    if (skip !== "brand" && brands.length && !brands.includes(item.brand)) return false;
    if (skip !== "condition" && conditions.length && !conditions.includes(productCondition(item))) return false;
    if (warranty && productCondition(item) === "ishlatilgan") return false;
    return item.price >= priceMin && item.price <= priceMax;
  }

  const visible = useMemo(() => {
    const rank = (id: string) => {
      const i = marketplaceListingOrder.findIndex((x) => x === id);
      return i === -1 ? 1000 : i;
    };
    const rows = all.filter((item) => matches(item));
    return rows.sort((a, b) => {
      switch (sort) {
        case "cheap":
          return a.price - b.price;
        case "expensive":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "discount":
          return (b.discount ?? 0) - (a.discount ?? 0);
        default: {
          const listed = Number(Boolean(b.listedBySeller)) - Number(Boolean(a.listedBySeller));
          if (listed) return listed;
          return rank(a.id) - rank(b.id) || b.reviews - a.reviews;
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, q, types, brands, conditions, warranty, priceMin, priceMax, sort]);

  const typeCounts = useMemo(() => {
    const map: Partial<Record<JihozType, number>> = {};
    for (const item of all) {
      if (!matches(item, "type")) continue;
      const t = jihozType(item);
      map[t] = (map[t] ?? 0) + 1;
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, q, brands, conditions, warranty, priceMin, priceMax]);

  const brandRows = useMemo(() => {
    const map = new Map<string, { total: number; n: number }>();
    for (const item of all) {
      const prev = map.get(item.brand) ?? { total: 0, n: 0 };
      map.set(item.brand, { total: prev.total + 1, n: prev.n + (matches(item, "brand") ? 1 : 0) });
    }
    const term = brandQuery.trim().toLowerCase();
    return [...map.entries()]
      .map(([label, v]) => ({ label, ...v }))
      .filter((r) => !term || r.label.toLowerCase().includes(term))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, q, types, conditions, warranty, priceMin, priceMax, brandQuery]);

  const conditionCounts = useMemo(() => {
    const map: Partial<Record<ProductCondition, number>> = {};
    for (const item of all) {
      if (!matches(item, "condition")) continue;
      const c = productCondition(item);
      map[c] = (map[c] ?? 0) + 1;
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, q, types, brands, warranty, priceMin, priceMax]);

  const priceOn = priceMin > 0 || priceMax < PRICE_MAX;
  const filtersOn = types.length > 0 || brands.length > 0 || conditions.length > 0 || warranty || priceOn;
  function clearAll() {
    setTypes([]);
    setBrands([]);
    setConditions([]);
    setWarranty(false);
    setPriceMin(0);
    setPriceMax(PRICE_MAX);
    setBrandQuery("");
  }
  const minPct = (priceMin / PRICE_MAX) * 100;
  const maxPct = (priceMax / PRICE_MAX) * 100;

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1 text-[12.5px] text-[#8b93a7]">
        <Link href="/" className="hover:text-[#0F766E]">Bosh sahifa</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/marketplace" className="hover:text-[#0F766E]">Marketplace</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-[#4b5568]">Jihozlar</span>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[20px] bg-linear-to-r from-[#F0FDFA] via-[#F0FDFA] to-[#F0FDFA] p-6">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div>
            <h1 className="text-[36px] leading-none font-extrabold tracking-tight text-[#0B1F4D]">Jihozlar</h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#4b5a78]">
              Stomatologik klinika uchun zamonaviy jihoz va uskunalar: endomotor, apeks-lokator, rentgen, avtoklav va boshqalar.
            </p>
          </div>
          <div className="relative h-[170px] overflow-hidden rounded-2xl">
            <Image
              src="/images/product-unit.png"
              alt="Stomatologik kreslo va jihozlar"
              fill
              sizes="620px"
              className="object-cover object-[center_55%]"
            />
            <div className="absolute inset-0 bg-linear-to-r from-[#0B1F4D]/75 via-[#0B1F4D]/25 to-transparent" />
            <p className="absolute top-1/2 left-6 max-w-[240px] -translate-y-1/2 text-[22px] leading-tight font-extrabold text-white">
              Zamonaviy jihozlar —<br />samarali klinika
            </p>
          </div>
        </div>
      </section>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTypes([])}
          className={cn(
            "h-9 rounded-full border px-4 text-[13.5px] font-semibold transition-colors",
            types.length === 0 ? "border-[#0F766E] bg-[#0F766E] text-white" : "border-[#e6eaf2] bg-white text-[#2b3447] hover:border-[#0F766E]/50",
          )}
        >
          Hammasi
        </button>
        {jihozTypes.map((t) => {
          const on = types.length === 1 && types[0] === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypes(on ? [] : [t.id])}
              className={cn(
                "h-9 rounded-full border px-4 text-[13.5px] font-semibold transition-colors",
                on ? "border-[#0F766E] bg-[#0F766E] text-white" : "border-[#e6eaf2] bg-white text-[#2b3447] hover:border-[#0F766E]/50",
              )}
            >
              {t.chip}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[250px_minmax(0,1fr)] items-start gap-4">
        <aside className="sticky top-0 rounded-xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#0B1F4D]">Filtrlar</h2>
            {filtersOn ? (
              <button type="button" onClick={clearAll} className="text-[12px] font-semibold text-[#0F766E] hover:underline">
                Tozalash
              </button>
            ) : null}
          </div>
          <FilterGroup title="Jihoz turi">
            {jihozTypes.map((t) => (
              <CheckRow
                key={t.id}
                label={t.label}
                count={typeCounts[t.id] ?? 0}
                checked={types.includes(t.id)}
                onChange={() => setTypes((l) => toggle(l, t.id))}
              />
            ))}
          </FilterGroup>
          <FilterGroup title="Brend">
            <div className="relative mb-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#8b93a7]" />
              <input
                value={brandQuery}
                onChange={(e) => setBrandQuery(e.target.value)}
                placeholder="Brendni qidirish..."
                className="h-9 w-full rounded-lg border border-[#e6eaf2] bg-white pr-2 pl-8 text-[12.5px] outline-none placeholder:text-[#9aa3b2] focus:border-[#0F766E]"
              />
            </div>
            {brandRows.map((r) => (
              <CheckRow key={r.label} label={r.label} count={r.n} checked={brands.includes(r.label)} onChange={() => setBrands((l) => toggle(l, r.label))} />
            ))}
            {brandRows.length === 0 ? <p className="py-1 text-[12px] text-[#8b93a7]">Brend topilmadi</p> : null}
          </FilterGroup>
          <FilterGroup title="Holati">
            {conditionOrder.map((id) => (
              <CheckRow
                key={id}
                label={conditionText[id] ?? conditionLabels[id]}
                count={conditionCounts[id] ?? 0}
                checked={conditions.includes(id)}
                onChange={() => setConditions((l) => toggle(l, id))}
              />
            ))}
          </FilterGroup>
          <FilterGroup title="Narx (so‘m)">
            <div className="flex items-center gap-2">
              <PriceInput value={priceMin} onCommit={(v) => setPriceMin(Math.max(0, Math.min(v, priceMax)))} placeholder="0" />
              <span className="text-[#9aa3b2]">–</span>
              <PriceInput value={priceMax} onCommit={(v) => setPriceMax(Math.min(PRICE_MAX, Math.max(v, priceMin)))} placeholder="26 000 000" />
            </div>
            <div className="relative mx-1 mt-3 mb-1 h-[18px]">
              <div className="absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 rounded-full bg-[#e6eaf2]" />
              <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#0F766E]" style={{ left: `${minPct}%`, width: `${Math.max(0, maxPct - minPct)}%` }} />
              <input
                type="range"
                aria-label="Minimal narx"
                min={0}
                max={PRICE_MAX}
                step={PRICE_STEP}
                value={priceMin}
                onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax))}
                className="sk-range"
                style={{ zIndex: priceMin > PRICE_MAX - PRICE_STEP * 4 ? 3 : 2 }}
              />
              <input
                type="range"
                aria-label="Maksimal narx"
                min={0}
                max={PRICE_MAX}
                step={PRICE_STEP}
                value={priceMax}
                onChange={(e) => setPriceMax(Math.max(Number(e.target.value), priceMin))}
                className="sk-range"
                style={{ zIndex: 2 }}
              />
            </div>
          </FilterGroup>
          <FilterGroup title="Kafolat" last>
            <CheckRow
              label="Sotuvchi kafolati"
              count={all.filter((i) => productCondition(i) !== "ishlatilgan").length}
              checked={warranty}
              onChange={() => setWarranty((v) => !v)}
            />
            <p className="text-[11px] leading-snug text-[#8b93a7]">Kafolat muddati sotuvchi bilan kelishiladi.</p>
          </FilterGroup>
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[15px] font-bold text-[#0B1F4D]">{visible.length} ta mahsulot topildi</p>
            <label className="relative inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e6eaf2] bg-white pr-8 pl-3 text-[13px] text-[#8b93a7]">
              Saralash:
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="cursor-pointer appearance-none bg-transparent font-semibold text-[#1a1d26] outline-none"
              >
                {sortOptions.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 size-4 text-[#8b93a7]" />
            </label>
          </div>
          {filtersOn ? (
            <div className="flex flex-wrap gap-2">
              {types.map((t) => (
                <button key={t} type="button" onClick={() => setTypes((l) => l.filter((x) => x !== t))} className="inline-flex h-7 items-center gap-1.5 rounded-md bg-[#F0FDFA] px-2.5 text-[12px] font-semibold text-[#0F766E]">
                  {jihozTypes.find((x) => x.id === t)?.label}
                  <X className="size-3" />
                </button>
              ))}
              {brands.map((b) => (
                <button key={b} type="button" onClick={() => setBrands((l) => l.filter((x) => x !== b))} className="inline-flex h-7 items-center gap-1.5 rounded-md bg-[#F0FDFA] px-2.5 text-[12px] font-semibold text-[#0F766E]">
                  {b}
                  <X className="size-3" />
                </button>
              ))}
              {conditions.map((c) => (
                <button key={c} type="button" onClick={() => setConditions((l) => l.filter((x) => x !== c))} className="inline-flex h-7 items-center gap-1.5 rounded-md bg-[#F0FDFA] px-2.5 text-[12px] font-semibold text-[#0F766E]">
                  {conditionText[c]}
                  <X className="size-3" />
                </button>
              ))}
            </div>
          ) : null}

          {visible.length === 0 ? (
            <div className="rounded-xl border border-[#eceff5] bg-white px-6 py-16 text-center">
              <p className="font-semibold text-[#1a1d26]">Mos mahsulot topilmadi.</p>
              <p className="mt-1 text-sm text-[#8b93a7]">Filtrlarni o‘zgartiring yoki tozalang.</p>
              <button type="button" onClick={clearAll} className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#0F766E] px-5 text-sm font-semibold text-white">
                Filtrlarni tozalash
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 xl:grid-cols-4">
              {visible.map((product) => (
                <JihozCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
