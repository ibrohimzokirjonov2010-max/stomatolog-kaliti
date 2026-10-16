"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpDown, BadgePercent, ChevronDown, Heart, Search, ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { SafeProductImage } from "@/components/safe-product-image";
import { useSellerWork } from "@/components/seller-provider";
import { productGroup, productHref, productOldPrice, type MarketGroup, type Product } from "@/data/products";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CatalogLayout, CatalogSideNav, ChipRow, PageTitle } from "./side-nav";

type ChipId =
  | ""
  | "terapiya"
  | "implantologiya"
  | "endodontiya"
  | "ortodontiya"
  | "jarrohlik"
  | "uskunalar"
  | "asboblar"
  | "gigiyena"
  | "materiallar";

const CHIPS: { id: ChipId; label: string }[] = [
  { id: "", label: "Barchasi" },
  { id: "terapiya", label: "Terapiya" },
  { id: "implantologiya", label: "Implantologiya" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "ortodontiya", label: "Ortodontiya" },
  { id: "jarrohlik", label: "Jarrohlik" },
  { id: "uskunalar", label: "Uskunalar" },
  { id: "asboblar", label: "Asboblar" },
  { id: "gigiyena", label: "Gigiyena" },
  { id: "materiallar", label: "Materiallar" },
];

const GROUPS: Partial<Record<ChipId, MarketGroup[]>> = {
  terapiya: ["kompozit", "bond", "sement", "anesteziya"],
  implantologiya: ["implant"],
  endodontiya: ["endodontiya"],
  uskunalar: ["jihozlar"],
  asboblar: ["instrument", "borlar"],
};
const WORDS: Partial<Record<ChipId, RegExp>> = {
  ortodontiya: /ortodont|breket|bracket|aligner|alayner/i,
  jarrohlik: /jarroh|surg|skalpel|forceps|elevator/i,
  gigiyena: /gigiyen|hygien|cho.tka|pasta|profilakt/i,
};

function matchesChip(p: Product, chip: ChipId) {
  if (!chip) return true;
  if (chip === "materiallar") return p.category === "materiallar";
  const g = GROUPS[chip];
  if (g) return g.includes(productGroup(p));
  return WORDS[chip]?.test(`${p.name} ${p.description ?? ""}`) ?? false;
}

/** Discount percent from the real `discount` / `oldPrice` fields; 0 when the product has no promo. */
export function discountPercent(p: Product) {
  if (p.discount && p.discount > 0) return Math.round(p.discount);
  if (p.oldPrice && p.oldPrice > p.price) return Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
  return 0;
}

type SortKey = "popular" | "cheap" | "expensive" | "discount";
const SORTS: { id: SortKey; label: string }[] = [
  { id: "popular", label: "Mashhurlik bo‘yicha" },
  { id: "cheap", label: "Narx: arzonroq" },
  { id: "expensive", label: "Narx: qimmatroq" },
  { id: "discount", label: "Chegirma %" },
  // "Tugash vaqti" is omitted: products have no promo end-date field yet.
];

export function AksiyalarPage() {
  const { catalog } = useSellerWork();
  const [q, setQ] = useState("");
  const [chip, setChip] = useState<ChipId>("");
  const [sort, setSort] = useState<SortKey>("popular");

  const promos = useMemo(() => catalog.filter((p) => p.active !== false && discountPercent(p) > 0), [catalog]);
  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = promos.filter(
      (p) => matchesChip(p, chip) && (!term || `${p.name} ${p.brand}`.toLowerCase().includes(term)),
    );
    const sorted = [...list];
    if (sort === "popular") sorted.sort((a, b) => b.reviews - a.reviews || b.rating - a.rating);
    if (sort === "cheap") sorted.sort((a, b) => a.price - b.price);
    if (sort === "expensive") sorted.sort((a, b) => b.price - a.price);
    if (sort === "discount") sorted.sort((a, b) => discountPercent(b) - discountPercent(a));
    return sorted;
  }, [chip, promos, q, sort]);

  return (
    <CatalogLayout
      side={
        <CatalogSideNav
          active="aksiyalar"
          promo={{
            title: "Maxsus aksiyalar va chegirmalar",
            text: "Stomatologiya mahsulotlarini arzon narxlarda xarid qiling!",
            cta: "Barcha aksiyalar",
            href: "/aksiyalar",
            image: "/catalog-pages/promo-aksiyalar.png",
            icon: BadgePercent,
          }}
        />
      }
    >
      <PageTitle
        title="Aksiyalar"
        subtitle="Maxsus takliflar va chegirmalar"
        right={
          <div className="hidden gap-2.5 lg:flex">
            <label className="relative w-[200px] xl:w-[230px]">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#0066FF]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Aksiyalarda qidirish..."
                className="h-11 w-full rounded-xl border border-[#e6eaf2] bg-white pr-3 pl-10 text-[13px] outline-none placeholder:text-[#9aa3b2] focus:border-[#0066FF]"
              />
            </label>
            <SortSelect value={sort} onChange={setSort} />
          </div>
        }
      />
      <div className="mb-3 flex gap-2 lg:hidden">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#0066FF]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Aksiyalarda qidirish..."
            className="h-11 w-full rounded-xl border border-[#e6eaf2] bg-white pr-3 pl-10 text-[13px] outline-none placeholder:text-[#9aa3b2] focus:border-[#0066FF]"
          />
        </label>
        <SortSelect value={sort} onChange={setSort} compact />
      </div>
      <ChipRow items={CHIPS} value={chip} onChange={setChip} className="mb-4" />
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d9e0ec] bg-white px-6 py-14 text-center">
          <BadgePercent className="mx-auto size-10 text-[#0066FF]" strokeWidth={1.5} />
          <p className="mt-3 text-[15px] font-semibold text-[#0B1F4D]">Hozircha aksiyalar yo‘q</p>
          <p className="mt-1 text-[13px] text-[#8b93a7]">Chegirmali mahsulotlar paydo bo‘lishi bilan shu yerda ko‘rinadi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {visible.map((p) => (
            <PromoCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </CatalogLayout>
  );
}

function SortSelect({ value, onChange, compact }: { value: SortKey; onChange: (v: SortKey) => void; compact?: boolean }) {
  return (
    <label className={cn("relative", compact ? "w-11" : "w-[165px] xl:w-[190px]")}>
      <ArrowUpDown className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#1f2a44]" />
      <select
        aria-label="Saralash"
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className={cn(
          "h-11 w-full appearance-none rounded-xl border border-[#e6eaf2] bg-white text-[12.5px] font-medium text-[#1f2a44] outline-none focus:border-[#0066FF]",
          compact ? "text-transparent" : "pr-8 pl-10",
        )}
      >
        {SORTS.map((s) => (
          <option key={s.id} value={s.id} className="text-[#1f2a44]">
            {s.label}
          </option>
        ))}
      </select>
      {compact ? null : (
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#1f2a44]" />
      )}
    </label>
  );
}

function PromoCard({ product }: { product: Product }) {
  const { add } = useCart();
  const favorites = useFavorites();
  const saved = favorites.has(product.id);
  const pct = discountPercent(product);
  const old = productOldPrice(product);
  const href = productHref(product);
  return (
    <article className="relative flex flex-col rounded-2xl border border-[#eceff5] bg-white p-2.5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] lg:p-3">
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-[#f6f8fb]">
        <SafeProductImage src={product.image} alt={product.name} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-contain p-2" />
      </Link>
      <span className="absolute top-4 left-4 rounded-md bg-[#FF3B3B] px-2 py-0.5 text-[12px] font-bold text-white lg:top-5 lg:left-5 lg:text-[13px]">
        -{pct}%
      </span>
      <button
        type="button"
        aria-label={saved ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"}
        onClick={() => favorites.toggle(product.id)}
        className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-white shadow-sm lg:top-5 lg:right-5"
      >
        <Heart className={cn("size-4", saved ? "fill-[#FF3B3B] text-[#FF3B3B]" : "text-[#1f2a44]")} />
      </button>
      <div className="mt-2.5 flex flex-1 flex-col px-0.5">
        <Link href={href} className="line-clamp-2 text-[13px] leading-snug font-bold text-[#0B1F4D] hover:text-[#0066FF] lg:text-[14px]">
          {product.name}
        </Link>
        <p className="mt-0.5 text-[12px] text-[#8b93a7]">{product.brand}</p>
        {product.reviews > 0 ? (
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[#4a5470]">
            <Star className="size-3.5 fill-[#FFB800] text-[#FFB800]" />
            <span className="font-semibold">{product.rating.toFixed(1)}</span>
            <span className="text-[#8b93a7]">({product.reviews})</span>
          </p>
        ) : null}
        <div className="mt-auto flex items-end gap-2 pt-2">
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-extrabold whitespace-nowrap text-[#0066FF] lg:text-[16px]">
              {formatMoney(product.price, "UZS")}
            </div>
            {old ? (
              <div className="text-[11.5px] whitespace-nowrap text-[#9aa3b2] line-through">{formatMoney(old, "UZS")}</div>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Savatga qo‘shish"
            onClick={() => add(product.id, product.listedBySeller ? product : undefined)}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#0066FF] text-white hover:bg-[#0057d9] lg:size-10"
          >
            <ShoppingCart className="size-[18px]" />
          </button>
        </div>
      </div>
    </article>
  );
}
