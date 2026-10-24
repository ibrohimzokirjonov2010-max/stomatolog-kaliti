"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Anchor,
  ChevronDown,
  Droplet,
  Drill,
  FileText,
  Heart,
  Layers,
  LayoutGrid,
  List,
  MapPin,
  MessageCircle,
  Package,
  Pencil,
  Pipette,
  Scissors,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smile,
  Star,
  Syringe,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { sellerLine } from "@/components/surplus-forms";
import {
  conditionLabel,
  listingCondition,
  listingDiscount,
  listingExpiry,
  listingRating,
  listingSellerDeals,
  listingToProduct,
  normalizeCategory,
  surplusCategories,
  surplusCities,
  surplusPopularBrands,
  surplusSellerAvatar,
  type SurplusCategory,
  type SurplusCondition,
  type SurplusListing,
} from "@/data/surplus";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type SortKey = "new" | "cheap" | "expensive" | "discount" | "rating";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "new", label: "Eng yangilari birinchi" },
  { key: "cheap", label: "Narx: arzonidan" },
  { key: "expensive", label: "Narx: qimmatidan" },
  { key: "discount", label: "Katta chegirma" },
];

const categoryIcons: Record<string, LucideIcon> = {
  kompozit: Syringe,
  bonding: Droplet,
  sement: Layers,
  endodontiya: Pencil,
  implantlar: Anchor,
  anesteziya: Pipette,
  borlar: Drill,
  instrument: Scissors,
  ortodontiya: Smile,
};

const conditionOrder: SurplusCondition[] = ["yangi", "ishlatilgan", "ochilgan"];
const PRICE_MAX = 10_000_000;
const PRICE_STEP = 50_000;

type Filters = {
  categories: SurplusCategory[];
  conditions: SurplusCondition[];
  brands: string[];
  priceMin: number;
  priceMax: number;
  city: string;
};

const emptyFilters: Filters = { categories: [], conditions: [], brands: [], priceMin: 0, priceMax: PRICE_MAX, city: "" };

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function matches(item: SurplusListing, f: Filters, q: string, skip?: "category" | "condition" | "brand") {
  if (q) {
    const hay = `${item.name} ${item.brand} ${item.seller} ${item.city} ${item.mine ? "siz" : ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (skip !== "category" && f.categories.length && !f.categories.includes(normalizeCategory(item.category))) return false;
  if (skip !== "condition" && f.conditions.length && !f.conditions.includes(listingCondition(item))) return false;
  if (skip !== "brand" && f.brands.length && !f.brands.includes(item.brand.trim().toLowerCase())) return false;
  if (f.city && item.city !== f.city) return false;
  if (item.price < f.priceMin || item.price > f.priceMax) return false;
  return true;
}

export function OrtiqchaDesktop({
  feed,
  q,
  added,
  onPost,
  onContact,
  onEdit,
  onAdded,
}: {
  feed: SurplusListing[];
  q: string;
  added: string | null;
  onPost: () => void;
  onContact: (listing: SurplusListing) => void;
  onEdit: (listing: SurplusListing) => void;
  onAdded: (id: string) => void;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState<SortKey>("new");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [brandQuery, setBrandQuery] = useState("");
  const [allBrands, setAllBrands] = useState(false);

  const visible = useMemo(() => {
    const rows = feed.filter((item) => matches(item, filters, q));
    const time = (item: SurplusListing) => (item.createdAt ? Date.parse(item.createdAt) || 0 : 0);
    return [...rows].sort((a, b) => {
      switch (sort) {
        case "cheap":
          return a.price - b.price;
        case "expensive":
          return b.price - a.price;
        case "discount":
          return listingDiscount(b) - listingDiscount(a);
        case "rating":
          return listingRating(b).rating - listingRating(a).rating;
        default:
          return time(b) - time(a);
      }
    });
  }, [feed, filters, q, sort]);

  // Facet counts: each facet counts rows that match every OTHER active filter.
  const counts = useMemo(() => {
    const category: Record<string, number> = {};
    const condition: Record<string, number> = {};
    const brand = new Map<string, { label: string; n: number }>();
    for (const item of feed) {
      if (matches(item, filters, q, "category")) {
        const id = normalizeCategory(item.category);
        category[id] = (category[id] ?? 0) + 1;
      }
      if (matches(item, filters, q, "condition")) {
        const c = listingCondition(item);
        condition[c] = (condition[c] ?? 0) + 1;
      }
      if (matches(item, filters, q, "brand")) {
        const key = item.brand.trim().toLowerCase();
        const prev = brand.get(key);
        brand.set(key, { label: prev?.label ?? item.brand.trim(), n: (prev?.n ?? 0) + 1 });
      }
    }
    return { category, condition, brand };
  }, [feed, filters, q]);

  // Brand order is stable (by total listings); counts follow the active filters.
  const brandRows = useMemo(() => {
    const totals = new Map<string, { label: string; total: number }>();
    for (const item of feed) {
      const key = item.brand.trim().toLowerCase();
      if (!key) continue;
      const prev = totals.get(key);
      totals.set(key, { label: prev?.label ?? item.brand.trim(), total: (prev?.total ?? 0) + 1 });
    }
    const term = brandQuery.trim().toLowerCase();
    return [...totals.entries()]
      .map(([key, val]) => ({ key, label: val.label, total: val.total, n: counts.brand.get(key)?.n ?? 0 }))
      .filter((row) => !term || row.key.includes(term))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  }, [brandQuery, counts.brand, feed]);

  const shownBrands =
    allBrands || brandQuery
      ? brandRows
      : brandRows.filter((row, index) => index < 7 || filters.brands.includes(row.key));
  const hiddenBrands = brandRows.length - shownBrands.length;

  const filtersOn =
    filters.categories.length > 0 ||
    filters.conditions.length > 0 ||
    filters.brands.length > 0 ||
    filters.city !== "" ||
    filters.priceMin > 0 ||
    filters.priceMax < PRICE_MAX ||
    Boolean(q);

  function clearAll() {
    setFilters(emptyFilters);
    setBrandQuery("");
    if (q) router.push("/ortiqcha-material");
  }

  function setMin(value: number) {
    setFilters((f) => ({ ...f, priceMin: Math.max(0, Math.min(value, f.priceMax)) }));
  }
  function setMax(value: number) {
    setFilters((f) => ({ ...f, priceMax: Math.min(PRICE_MAX, Math.max(value, f.priceMin)) }));
  }

  const minPct = (filters.priceMin / PRICE_MAX) * 100;
  const maxPct = (filters.priceMax / PRICE_MAX) * 100;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_264px] items-start gap-4 min-[1400px]:grid-cols-[minmax(0,1fr)_280px]">
      {/* ───────── Center column ───────── */}
      <div className="min-w-0 space-y-4">
        {/* Popular brands */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[12px] font-medium text-[#8b93a7]">Mashhur:</span>
          {surplusPopularBrands.map((brand) => {
            const on = filters.brands.includes(brand.toLowerCase());
            return (
              <button
                key={brand}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, brands: toggle(f.brands, brand.toLowerCase()) }))}
                className={cn(
                  "h-7 rounded-full border px-3 text-[12px] font-medium transition-colors",
                  on
                    ? "border-[#0F766E] bg-[#0F766E] text-white"
                    : "border-[#e6eaf2] bg-white text-[#4b5568] hover:border-[#0F766E]/40 hover:text-[#0F766E]",
                )}
              >
                {brand}
              </button>
            );
          })}
        </div>

        {/* Hero */}
        <section className="relative flex min-h-[188px] items-stretch overflow-hidden rounded-2xl bg-gradient-to-r from-[#F0FDFA] via-[#F0FDFA] to-[#F0FDFA] p-6">
          <div className="pointer-events-none absolute -top-16 right-40 size-64 rounded-full bg-white/40 blur-2xl" />
          <div className="relative z-10 flex w-[44%] min-w-[260px] flex-col justify-center">
            <h1 className="text-[26px] leading-[1.15] font-extrabold tracking-tight text-[#111827]">
              Stomatologlar uchun
              <br />
              <span className="text-[#0F766E]">Ortiqcha materiallar marketi</span>
            </h1>
            <p className="mt-2 max-w-[340px] text-[13px] leading-snug text-[#4b5568]">
              Ishlatilmagan va ortiqcha qolgan materiallarni qulay narxda soting yoki xarid qiling.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] font-medium text-[#3b4a66]">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-[#0F766E]" /> Muddat majburiy
              </span>
              <span className="inline-flex items-center gap-1">
                <Package className="size-3.5 text-[#0F766E]" /> Yopiq / Ochilgan
              </span>
              <span className="inline-flex items-center gap-1">
                <BadgeCheck className="size-3.5 text-[#0F766E]" /> Original
              </span>
            </div>
          </div>

          <div className="relative z-0 hidden min-w-0 flex-1 xl:block">
            <Image
              src="/images/dentrade/dentium-nrline.png"
              alt=""
              width={190}
              height={190}
              className="absolute top-1/2 left-0 size-[170px] -translate-y-1/2 object-contain mix-blend-multiply"
            />
            <Image
              src="/images/dentrade/denfil-nano.png"
              alt=""
              width={190}
              height={190}
              className="absolute top-1/2 left-[120px] size-[160px] -translate-y-[44%] object-contain mix-blend-multiply"
            />
            <Image
              src="/images/dentrade/osteon-bone.png"
              alt=""
              width={190}
              height={190}
              className="absolute top-1/2 left-[250px] size-[130px] -translate-y-[40%] object-contain mix-blend-multiply"
            />
          </div>

          <div className="relative z-10 ml-auto flex w-[232px] shrink-0 flex-col justify-center rounded-2xl bg-white p-4 shadow-[0_8px_28px_rgba(17, 94, 89, 0.14)]">
            <p className="text-[15px] leading-tight font-bold text-[#111827]">O‘zingizda ortiqcha material bormi?</p>
            <p className="mt-1 text-[12px] leading-snug text-[#8b93a7]">E’lon joylang va tez sotib yuboring.</p>
            <button
              type="button"
              onClick={onPost}
              className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#0F766E] text-[14px] font-semibold text-white shadow-[0_4px_12px_rgba(15, 118, 110, 0.28)] transition-colors hover:bg-[#115E59]"
            >
              E’lon joylash
            </button>
            <Link
              href="/ortiqcha-material/elonlarim"
              className="mt-2 inline-flex items-center justify-center gap-1.5 text-[12px] font-semibold text-[#0F766E] hover:underline"
            >
              <FileText className="size-3.5" />
              Mening e’lonlarim
            </Link>
          </div>
        </section>

        {/* Category row */}
        <div className="flex gap-2">
          <CategoryTile
            label="Hammasi"
            icon={LayoutGrid}
            active={filters.categories.length === 0}
            onClick={() => setFilters((f) => ({ ...f, categories: [] }))}
          />
          {surplusCategories.map((item) => (
            <CategoryTile
              key={item.id}
              label={item.label}
              icon={categoryIcons[item.id] ?? Package}
              active={filters.categories.includes(item.id)}
              onClick={() => setFilters((f) => ({ ...f, categories: [item.id] }))}
            />
          ))}
        </div>

        {/* List header */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-[15px] font-bold text-[#111827]">
            {visible.length} ta material
            {filtersOn ? (
              <button type="button" onClick={clearAll} className="ml-3 text-[12px] font-semibold text-[#0F766E] hover:underline">
                Tozalash
              </button>
            ) : null}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex rounded-[10px] border border-[#e6eaf2] bg-white p-0.5">
              <ViewButton active={view === "grid"} onClick={() => setView("grid")} label="Setka">
                <LayoutGrid className="size-4" />
              </ViewButton>
              <ViewButton active={view === "list"} onClick={() => setView("list")} label="Ro‘yxat">
                <List className="size-4" />
              </ViewButton>
            </div>
            <label className="relative inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e6eaf2] bg-white pr-8 pl-3 text-[13px] text-[#8b93a7]">
              Saralash:
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className="cursor-pointer appearance-none bg-transparent font-semibold text-[#1a1d26] outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 size-4 text-[#8b93a7]" />
            </label>
          </div>
        </div>

        {/* Results */}
        {visible.length === 0 ? (
          <div className="rounded-xl border border-[#eceff5] bg-white px-6 py-16 text-center shadow-[0_2px_10px_rgba(17, 24, 39, 0.04)]">
            <p className="font-semibold text-[#1a1d26]">{feed.length === 0 ? "Hali e’lon yo‘q" : "Mos e’lon topilmadi."}</p>
            <p className="mt-1 text-sm text-[#8b93a7]">
              {filtersOn ? "Filtrlarni o‘zgartiring yoki tozalang." : "Birinchi bo‘lib klinika ortiqchasini joylang. E’lonlar admin tasdiqlagach ko‘rinadi."}
            </p>
            <button
              type="button"
              onClick={filtersOn ? clearAll : onPost}
              className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#0F766E] px-5 text-sm font-semibold text-white"
            >
              {filtersOn ? "Filtrlarni tozalash" : "E’lon joylash"}
            </button>
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-3",
              view === "grid"
                ? "grid-cols-[repeat(auto-fill,minmax(204px,1fr))]"
                : "grid-cols-1",
            )}
          >
            {visible.map((listing) => (
              <DesktopCard
                key={listing.id}
                listing={listing}
                view={view}
                added={added === listing.id}
                onContact={() => onContact(listing)}
                onEdit={() => onEdit(listing)}
                onAdded={() => onAdded(listing.id)}
              />
            ))}
          </div>
        )}

        <p className="flex items-center gap-2.5 rounded-xl bg-[#f5f8ff] px-4 py-3 text-[13px] text-[#4b5568]">
          <ShieldCheck className="size-4 shrink-0 text-[#0F766E]" />
          <span>
            Faqat shaxsiy ortiqcha — stomatologlar o‘z ortiqchasini joylaydi, dilerlik e’lonlari qabul qilinmaydi.
          </span>
        </p>
      </div>

      {/* ───────── Right filter panel ───────── */}
      <aside className="sticky top-0 max-h-[calc(100vh-104px)] overflow-y-auto rounded-xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_12px_rgba(17, 24, 39, 0.05)] [scrollbar-width:thin]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#111827]">Filtrlar</h2>
          <button type="button" onClick={clearAll} className="text-[12px] font-semibold text-[#0F766E] hover:underline">
            Barchasini tozalash
          </button>
        </div>

        <FilterGroup title="Kategoriya">
          {surplusCategories.map((item) => (
            <CheckRow
              key={item.id}
              label={item.label}
              count={counts.category[item.id] ?? 0}
              checked={filters.categories.includes(item.id)}
              onChange={() => setFilters((f) => ({ ...f, categories: toggle(f.categories, item.id) }))}
            />
          ))}
        </FilterGroup>

        <FilterGroup title="Holati">
          {conditionOrder.map((id) => (
            <CheckRow
              key={id}
              label={conditionLabel[id]}
              count={counts.condition[id] ?? 0}
              checked={filters.conditions.includes(id)}
              onChange={() => setFilters((f) => ({ ...f, conditions: toggle(f.conditions, id) }))}
            />
          ))}
        </FilterGroup>

        <FilterGroup title="Brend">
          <div className="relative mb-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#8b93a7]" />
            <input
              value={brandQuery}
              onChange={(event) => setBrandQuery(event.target.value)}
              placeholder="Brend qidirish"
              className="h-9 w-full rounded-lg border border-[#e6eaf2] bg-white pr-2 pl-8 text-[12.5px] outline-none placeholder:text-[#9aa3b2] focus:border-[#0F766E]"
            />
          </div>
          {shownBrands.map((row) => (
            <CheckRow
              key={row.key}
              label={row.label}
              count={row.n}
              checked={filters.brands.includes(row.key)}
              onChange={() => setFilters((f) => ({ ...f, brands: toggle(f.brands, row.key) }))}
            />
          ))}
          {shownBrands.length === 0 ? <p className="py-1 text-[12px] text-[#8b93a7]">Brend topilmadi</p> : null}
          {!brandQuery && (allBrands || hiddenBrands > 0) ? (
            <button
              type="button"
              onClick={() => setAllBrands((v) => !v)}
              className="pt-1 text-left text-[12px] font-semibold text-[#0F766E] hover:underline"
            >
              {allBrands ? "Kamroq ko‘rsatish" : `Yana ${hiddenBrands} ta brend`}
            </button>
          ) : null}
        </FilterGroup>

        <FilterGroup title="Narx oralig‘i">
          <div className="flex items-center gap-2">
            <PriceInput value={filters.priceMin} onCommit={setMin} placeholder="0" />
            <span className="text-[#9aa3b2]">–</span>
            <PriceInput value={filters.priceMax} onCommit={setMax} placeholder="10 000 000" />
          </div>
          <div className="relative mx-1 mt-3 mb-1 h-[18px]">
            <div className="absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 rounded-full bg-[#e6eaf2]" />
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#0F766E]"
              style={{ left: `${minPct}%`, width: `${Math.max(0, maxPct - minPct)}%` }}
            />
            <input
              type="range"
              aria-label="Minimal narx"
              min={0}
              max={PRICE_MAX}
              step={PRICE_STEP}
              value={filters.priceMin}
              onChange={(event) => setMin(Number(event.target.value))}
              className="sk-range"
              style={{ zIndex: filters.priceMin > PRICE_MAX - PRICE_STEP * 4 ? 3 : 2 }}
            />
            <input
              type="range"
              aria-label="Maksimal narx"
              min={0}
              max={PRICE_MAX}
              step={PRICE_STEP}
              value={filters.priceMax}
              onChange={(event) => setMax(Number(event.target.value))}
              className="sk-range"
              style={{ zIndex: 2 }}
            />
          </div>
        </FilterGroup>

        <FilterGroup title="Joylashuv" last>
          <label className="relative block">
            <MapPin className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#0F766E]" />
            <select
              value={filters.city}
              onChange={(event) => setFilters((f) => ({ ...f, city: event.target.value }))}
              className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-[#e6eaf2] bg-white pr-8 pl-8 text-[13px] font-medium text-[#1a1d26] outline-none focus:border-[#0F766E]"
            >
              <option value="">Barcha hududlar</option>
              {surplusCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-[#8b93a7]" />
          </label>
        </FilterGroup>
      </aside>
    </div>
  );
}

function CategoryTile({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl border bg-white px-1 py-2.5 transition-colors",
        active
          ? "border-[#0F766E] bg-[#f3f8ff] shadow-[0_2px_10px_rgba(15, 118, 110, 0.12)]"
          : "border-[#eceff5] hover:border-[#0F766E]/40",
      )}
    >
      <span
        className={cn(
          "grid size-9 place-items-center rounded-[10px]",
          active ? "bg-[#0F766E] text-white" : "bg-[#eef4ff] text-[#0F766E]",
        )}
      >
        <Icon className="size-[18px]" strokeWidth={1.8} />
      </span>
      <span className={cn("max-w-full truncate text-[11.5px] font-semibold", active ? "text-[#0F766E]" : "text-[#1a1d26]")}>
        {label}
      </span>
    </button>
  );
}

export function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid size-8 place-items-center rounded-lg transition-colors",
        active ? "bg-[#0F766E] text-white" : "text-[#8b93a7] hover:text-[#1a1d26]",
      )}
    >
      {children}
    </button>
  );
}

export function FilterGroup({ title, children, last }: { title: string; children: ReactNode; last?: boolean }) {
  return (
    <section className={cn("py-3", !last && "border-b border-[#f0f3f8]")}>
      <h3 className="mb-2 text-[13px] font-bold text-[#111827]">{title}</h3>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

export function CheckRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#1a1d26]">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#0F766E]/30",
          checked ? "border-[#0F766E] bg-[#0F766E]" : "border-[#cfd6e4] bg-white",
        )}
      >
        {checked ? (
          <svg viewBox="0 0 12 12" className="size-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="m2.5 6.2 2.3 2.3 4.7-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-[12px] text-[#8b93a7] tabular-nums">{count}</span>
    </label>
  );
}

export function PriceInput({
  value,
  onCommit,
  placeholder,
}: {
  value: number;
  onCommit: (value: number) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === 0 && placeholder === "0" ? "0" : new Intl.NumberFormat("ru-RU").format(value));
  function commit() {
    if (draft !== null) {
      const num = Number(draft.replace(/\D/g, ""));
      onCommit(Number.isFinite(num) ? num : 0);
    }
    setDraft(null);
  }
  return (
    <input
      inputMode="numeric"
      value={shown}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      aria-label={placeholder === "0" ? "Minimal narx" : "Maksimal narx"}
      className="h-9 w-full min-w-0 rounded-lg border border-[#e6eaf2] bg-white px-2.5 text-[12.5px] font-medium text-[#1a1d26] tabular-nums outline-none focus:border-[#0F766E]"
    />
  );
}

function DesktopCard({
  listing,
  view,
  added,
  onContact,
  onEdit,
  onAdded,
}: {
  listing: SurplusListing;
  view: "grid" | "list";
  added: boolean;
  onContact: () => void;
  onEdit: () => void;
  onAdded: () => void;
}) {
  const favorites = useFavorites();
  const saved = favorites.has(listing.id);
  const { rating, reviews } = listingRating(listing);
  const discount = listingDiscount(listing);
  const condition = listingCondition(listing);
  const deals = listingSellerDeals(listing);
  const seller = sellerLine(listing);
  const avatar = surplusSellerAvatar(listing.seller, listing.mine);
  const opened = listing.status === "ochilgan";
  const isList = view === "list";

  return (
    <article
      className={cn(
        "relative flex rounded-xl border border-[#eceff5] bg-white p-3 shadow-[0_2px_10px_rgba(17, 24, 39, 0.05)] transition-shadow hover:shadow-[0_8px_24px_rgba(17, 24, 39, 0.10)]",
        isList ? "flex-row gap-4" : "flex-col",
      )}
    >
      <div className={cn("relative", isList && "w-[168px] shrink-0")}>
        <Link href={`/ortiqcha-material/${listing.id}`} className="relative block aspect-square w-full overflow-hidden rounded-lg bg-[#f7f8fb]" data-testid="surplus-card-link">
          <Image
            src={listing.image}
            alt={listing.name}
            fill
            sizes="240px"
            unoptimized={listing.image.startsWith("data:") || listing.image.startsWith("http")}
            className="object-cover object-center"
          />
        </Link>
        <span
          className={cn(
            "absolute top-2 left-2 max-w-[calc(100%-52px)] truncate rounded-md px-2 py-[3px] text-[10.5px] leading-none font-semibold",
            opened ? "bg-[#fff3e0] text-[#e8890c]" : "bg-[#e6f7ee] text-[#16a34a]",
          )}
        >
          {opened ? `Ochilgan${listing.openedAgo ? ` · ${listing.openedAgo}` : ""}` : "Yopiq"}
        </span>
        <button
          type="button"
          onClick={() => favorites.toggle(listing.id)}
          aria-label="Sevimlilarga"
          className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-white/95 text-[#8b93a7] shadow-sm hover:text-[#f43f5e]"
        >
          <Heart className={cn("size-3.5", saved && "fill-[#f43f5e] text-[#f43f5e]")} />
        </button>
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col", isList ? "justify-between" : "mt-2.5")}>
        <div>
          <p className="text-[11.5px] text-[#8b93a7]">{listing.brand}</p>
          <h3 className="mt-0.5 line-clamp-2 min-h-[34px] text-[13px] leading-[17px] font-bold text-[#1a1d26]">
            <Link href={`/ortiqcha-material/${listing.id}`} className="hover:text-[#0F766E]">
              {listing.name}
            </Link>
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-1">
            <span className="rounded-md bg-[#e6f7ee] px-1.5 py-[3px] text-[10.5px] leading-none font-semibold text-[#16a34a]">
              {conditionLabel[condition]}
            </span>
            <span className="rounded-md bg-[#f1f4f9] px-1.5 py-[3px] text-[10.5px] leading-none font-medium text-[#4b5568]">
              Yaroqlilik: {listingExpiry(listing)}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 text-[11.5px] text-[#8b93a7]">
            {reviews > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-[#f5b942] text-[#f5b942]" />
                <span className="font-semibold text-[#1a1d26]">{rating.toFixed(1)}</span>
                <span>({reviews})</span>
              </span>
            ) : (
              <span>Yangi e’lon</span>
            )}
            <span className="inline-flex min-w-0 items-center gap-0.5">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{listing.city}</span>
            </span>
          </div>
        </div>

        <div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-[15.5px] leading-tight font-extrabold text-[#0F766E]">
              {formatMoney(listing.price, "UZS")}
            </span>
          </div>
          {listing.newPrice > listing.price ? (
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="text-[11.5px] text-[#9aa3b2] line-through">{formatMoney(listing.newPrice, "UZS")}</span>
              {discount > 0 ? (
                <span className="rounded-md bg-[#ffe9e9] px-1.5 py-[2px] text-[10.5px] leading-none font-bold text-[#e5484d]">
                  -{discount}%
                </span>
              ) : null}
            </div>
          ) : (
            <div className="h-[18px]" />
          )}

          <div className="mt-2 flex items-center gap-1.5 border-t border-[#f0f3f8] pt-2">
            {avatar ? (
              <Image src={avatar} alt="" width={22} height={22} className="size-[22px] shrink-0 rounded-full object-cover" />
            ) : (
              <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[9px] font-bold text-[#0F766E]">
                {seller.replace(/^Siz · /, "").replace(/^Dr\.\s*/, "").slice(0, 1)}
              </span>
            )}
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[11.5px] font-semibold text-[#1a1d26]">{seller}</span>
              {deals > 0 ? <span className="block truncate text-[10.5px] text-[#8b93a7]">{deals} ta savdo</span> : null}
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5">
            {listing.mine ? (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-[#0F766E] text-[13px] font-semibold text-white hover:bg-[#115E59]"
              >
                <Pencil className="size-3.5" />
                Tahrirlash
              </button>
            ) : (
              <button
                type="button"
                onClick={onContact}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-[#0F766E] text-[13px] font-semibold text-white shadow-[0_3px_10px_rgba(15, 118, 110, 0.25)] transition-colors hover:bg-[#115E59]"
              >
                <MessageCircle className="size-3.5" />
                Bog‘lanish
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

