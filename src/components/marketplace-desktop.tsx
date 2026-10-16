"use client";

import Link from "next/link";

import { useMemo, useState } from "react";
import {
  Anchor,
  ChevronDown,
  Droplet,
  Drill,
  FlaskConical,
  LayoutGrid,
  List,
  Monitor,
  Pencil,
  Pipette,
  PiggyBank,
  Scissors,
  Search,
  Shirt,
  ShieldCheck,
  Truck,
  X,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { CheckRow, FilterGroup, PriceInput, ViewButton } from "@/components/ortiqcha-desktop";
import {
  conditionLabels,
  conditionOrder,
  marketGroups,
  marketplaceListingOrder,
  productCondition,
  productGroup,
  type MarketGroup,
  type Product,
  type ProductCondition,
} from "@/data/products";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type SortKey = "new" | "cheap" | "expensive" | "discount" | "rating";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "new", label: "Eng yangilari birinchi" },
  { key: "cheap", label: "Narx: arzonidan" },
  { key: "expensive", label: "Narx: qimmatidan" },
  { key: "discount", label: "Katta chegirma" },
  { key: "rating", label: "Yuqori reyting" },
];

const groupIcons: Record<MarketGroup, LucideIcon> = {
  kompozit: Pipette,
  bond: Droplet,
  sement: Layers,
  endodontiya: Pencil,
  implant: Anchor,
  anesteziya: Pipette,
  borlar: Drill,
  instrument: Scissors,
  jihozlar: Monitor,
  laboratoriya: FlaskConical,
  forma: Shirt,
};

const PRICE_MAX = 26_000_000;
const PRICE_STEP = 100_000;

type Filters = {
  groups: MarketGroup[];
  conditions: ProductCondition[];
  brands: string[];
  priceMin: number;
  priceMax: number;
  inStock: boolean;
};

const emptyFilters: Filters = { groups: [], conditions: [], brands: [], priceMin: 0, priceMax: PRICE_MAX, inStock: false };

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function matches(item: Product, f: Filters, q: string, skip?: "group" | "condition" | "brand") {
  if (q) {
    const hay = `${item.name} ${item.brand} ${item.shopName ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (skip !== "group" && f.groups.length && !f.groups.includes(productGroup(item))) return false;
  if (skip !== "condition" && f.conditions.length && !f.conditions.includes(productCondition(item))) return false;
  if (skip !== "brand" && f.brands.length && !f.brands.includes(item.brand.trim().toLowerCase())) return false;
  if (f.inStock && !item.inStock) return false;
  if (item.price < f.priceMin || item.price > f.priceMax) return false;
  return true;
}

export function MarketplaceDesktop({
  catalog,
  q,
  title,
  subtitle,
  initialGroups,
  initialBrands = [],
}: {
  catalog: Product[];
  q: string;
  title: string;
  subtitle?: string;
  initialGroups: MarketGroup[];
  initialBrands?: string[];
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters, groups: initialGroups, brands: initialBrands });
  const [sort, setSort] = useState<SortKey>("new");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [brandQuery, setBrandQuery] = useState("");
  const [allBrands, setAllBrands] = useState(false);

  const visible = useMemo(() => {
    const rows = catalog.filter((item) => matches(item, filters, q));
    const rank = (id: string) => {
      const index = marketplaceListingOrder.findIndex((entry) => entry === id);
      return index === -1 ? 1000 : index;
    };
    return [...rows].sort((a, b) => {
      switch (sort) {
        case "cheap":
          return a.price - b.price;
        case "expensive":
          return b.price - a.price;
        case "discount":
          return (b.discount ?? 0) - (a.discount ?? 0);
        case "rating":
          return b.rating - a.rating;
        default: {
          const listed = Number(Boolean(b.listedBySeller)) - Number(Boolean(a.listedBySeller));
          if (listed !== 0) return listed;
          const order = rank(a.id) - rank(b.id);
          if (order !== 0) return order;
          return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
        }
      }
    });
  }, [catalog, filters, q, sort]);

  // Facet counts: every facet counts rows matching all OTHER active filters.
  const counts = useMemo(() => {
    const group: Partial<Record<MarketGroup, number>> = {};
    const condition: Partial<Record<ProductCondition, number>> = {};
    const brand = new Map<string, number>();
    for (const item of catalog) {
      if (matches(item, filters, q, "group")) {
        const id = productGroup(item);
        group[id] = (group[id] ?? 0) + 1;
      }
      if (matches(item, filters, q, "condition")) {
        const id = productCondition(item);
        condition[id] = (condition[id] ?? 0) + 1;
      }
      if (matches(item, filters, q, "brand")) {
        const key = item.brand.trim().toLowerCase();
        brand.set(key, (brand.get(key) ?? 0) + 1);
      }
    }
    return { group, condition, brand };
  }, [catalog, filters, q]);

  const brandRows = useMemo(() => {
    const totals = new Map<string, { label: string; total: number }>();
    for (const item of catalog) {
      const key = item.brand.trim().toLowerCase();
      if (!key) continue;
      const prev = totals.get(key);
      totals.set(key, { label: prev?.label ?? item.brand.trim(), total: (prev?.total ?? 0) + 1 });
    }
    const term = brandQuery.trim().toLowerCase();
    return [...totals.entries()]
      .map(([key, val]) => ({ key, label: val.label, total: val.total, n: counts.brand.get(key) ?? 0 }))
      .filter((row) => !term || row.key.includes(term))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  }, [brandQuery, catalog, counts.brand]);

  const shownBrands =
    allBrands || brandQuery
      ? brandRows
      : brandRows.filter((row, index) => index < 7 || filters.brands.includes(row.key));
  const hiddenBrands = brandRows.length - shownBrands.length;
  const brandLabel = (key: string) => brandRows.find((row) => row.key === key)?.label ?? key;

  const priceOn = filters.priceMin > 0 || filters.priceMax < PRICE_MAX;
  const filtersOn =
    filters.groups.length > 0 ||
    filters.conditions.length > 0 ||
    filters.brands.length > 0 ||
    filters.inStock ||
    priceOn ||
    Boolean(q);

  function clearAll() {
    setFilters(emptyFilters);
    setBrandQuery("");
    if (q) router.push("/marketplace");
  }
  function setMin(value: number) {
    setFilters((f) => ({ ...f, priceMin: Math.max(0, Math.min(value, f.priceMax)) }));
  }
  function setMax(value: number) {
    setFilters((f) => ({ ...f, priceMax: Math.min(PRICE_MAX, Math.max(value, f.priceMin)) }));
  }
  const minPct = (filters.priceMin / PRICE_MAX) * 100;
  const maxPct = (filters.priceMax / PRICE_MAX) * 100;

  const chips: { key: string; label: string; remove: () => void }[] = [
    ...(q
      ? [{ key: "q", label: `“${q}”`, remove: () => router.push("/marketplace") }]
      : []),
    ...filters.groups.map((id) => ({
      key: `g-${id}`,
      label: marketGroups.find((g) => g.id === id)?.label ?? id,
      remove: () => setFilters((f) => ({ ...f, groups: f.groups.filter((x) => x !== id) })),
    })),
    ...filters.conditions.map((id) => ({
      key: `c-${id}`,
      label: conditionLabels[id],
      remove: () => setFilters((f) => ({ ...f, conditions: f.conditions.filter((x) => x !== id) })),
    })),
    ...filters.brands.map((key) => ({
      key: `b-${key}`,
      label: brandLabel(key),
      remove: () => setFilters((f) => ({ ...f, brands: f.brands.filter((x) => x !== key) })),
    })),
    ...(priceOn
      ? [
          {
            key: "price",
            label: `${formatMoney(filters.priceMin, "UZS")} – ${formatMoney(filters.priceMax, "UZS")}`,
            remove: () => setFilters((f) => ({ ...f, priceMin: 0, priceMax: PRICE_MAX })),
          },
        ]
      : []),
    ...(filters.inStock
      ? [{ key: "stock", label: "Omborda mavjud", remove: () => setFilters((f) => ({ ...f, inStock: false })) }]
      : []),
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex items-center gap-6">
        <div className="min-w-0 shrink-0">
          <h1 className="text-[28px] leading-tight font-extrabold tracking-tight text-[#0B1F4D]">{title}</h1>
          {subtitle ? <p className="mt-1 text-[13.5px] text-[#8b93a7]">{subtitle}</p> : null}
          <nav className="mt-1.5 flex gap-3 text-[12.5px] font-semibold text-[#0066FF]">
            <Link href="/kategoriyalar" className="hover:underline">Kategoriyalar</Link>
            <Link href="/marketplace/brendlar" className="hover:underline">Brendlar</Link>
            <Link href="/marketplace/aksiyalar" className="hover:underline">Aksiyalar</Link>
          </nav>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <ValueBadge icon={ShieldCheck} title="Original mahsulotlar" text="Ishonchli sotuvchilar" />
          <ValueBadge icon={Truck} title="Tez yetkazish" text="Toshkent bo‘ylab 24 soat" />
          <ValueBadge icon={PiggyBank} title="Eng yaxshi narxlar" text="Doimiy chegirmalar" />
        </div>
      </header>

      {/* Category tiles */}
      <div className="flex gap-2">
        <CategoryTile
          label="Hammasi"
          icon={LayoutGrid}
          active={filters.groups.length === 0}
          onClick={() => setFilters((f) => ({ ...f, groups: [] }))}
        />
        {marketGroups.map((item) => (
          <CategoryTile
            key={item.id}
            label={item.label}
            icon={groupIcons[item.id]}
            active={filters.groups.includes(item.id)}
            onClick={() => setFilters((f) => ({ ...f, groups: [item.id] }))}
          />
        ))}
      </div>

      <div className="grid grid-cols-[236px_minmax(0,1fr)] items-start gap-4 min-[1400px]:grid-cols-[248px_minmax(0,1fr)]">
        {/* Filters */}
        <aside className="sticky top-0 max-h-[calc(100vh-104px)] overflow-y-auto rounded-xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)] [scrollbar-width:thin]">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#0B1F4D]">Filtrlar</h2>
            <button type="button" onClick={clearAll} className="text-[12px] font-semibold text-[#0066FF] hover:underline">
              Barchasini tozalash
            </button>
          </div>

          <FilterGroup title="Kategoriya">
            {marketGroups.map((item) => (
              <CheckRow
                key={item.id}
                label={item.label}
                count={counts.group[item.id] ?? 0}
                checked={filters.groups.includes(item.id)}
                onChange={() => setFilters((f) => ({ ...f, groups: toggle(f.groups, item.id) }))}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Holati">
            {conditionOrder.map((id) => (
              <CheckRow
                key={id}
                label={conditionLabels[id]}
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
                placeholder="Brendni qidirish..."
                className="h-9 w-full rounded-lg border border-[#e6eaf2] bg-white pr-2 pl-8 text-[12.5px] outline-none placeholder:text-[#9aa3b2] focus:border-[#0066FF]"
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
                className="pt-1 text-left text-[12px] font-semibold text-[#0066FF] hover:underline"
              >
                {allBrands ? "Kamroq ko‘rsatish" : `Yana ${hiddenBrands} ta brend`}
              </button>
            ) : null}
          </FilterGroup>

          <FilterGroup title="Narx oralig‘i">
            <div className="flex items-center gap-2">
              <PriceInput value={filters.priceMin} onCommit={setMin} placeholder="0" />
              <span className="text-[#9aa3b2]">–</span>
              <PriceInput value={filters.priceMax} onCommit={setMax} placeholder="26 000 000" />
            </div>
            <div className="relative mx-1 mt-3 mb-1 h-[18px]">
              <div className="absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 rounded-full bg-[#e6eaf2]" />
              <div
                className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#0066FF]"
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

          <FilterGroup title="Mavjudlik" last>
            <CheckRow
              label="Faqat omborda mavjud"
              count={catalog.filter((item) => item.inStock && matches(item, { ...filters, inStock: false }, q)).length}
              checked={filters.inStock}
              onChange={() => setFilters((f) => ({ ...f, inStock: !f.inStock }))}
            />
          </FilterGroup>
        </aside>

        {/* Results */}
        <div className="min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <p className="mr-1 text-[15px] font-bold whitespace-nowrap text-[#0B1F4D]">
                {visible.length} ta mahsulot
              </p>
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.remove}
                  aria-label={`${chip.label} filtrini olib tashlash`}
                  className="inline-flex h-7 items-center gap-1.5 rounded-md bg-[#eaf2ff] px-2.5 text-[12px] font-semibold text-[#0066FF] transition-colors hover:bg-[#dbe9ff]"
                >
                  {chip.label}
                  <X className="size-3" strokeWidth={2.5} />
                </button>
              ))}
              {filtersOn ? (
                <button type="button" onClick={clearAll} className="text-[12px] font-semibold text-[#0066FF] hover:underline">
                  Barchasini tozalash
                </button>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
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

          {visible.length === 0 ? (
            <div className="rounded-xl border border-[#eceff5] bg-white px-6 py-16 text-center shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
              <p className="font-semibold text-[#1a1d26]">Mos mahsulot topilmadi.</p>
              <p className="mt-1 text-sm text-[#8b93a7]">Filtrlarni o‘zgartiring yoki tozalang.</p>
              <button
                type="button"
                onClick={clearAll}
                className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#0066FF] px-5 text-sm font-semibold text-white"
              >
                Filtrlarni tozalash
              </button>
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-3",
                view === "grid" ? "grid-cols-[repeat(auto-fill,minmax(204px,1fr))]" : "grid-cols-1",
              )}
            >
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} variant={view === "grid" ? "market" : "market-list"} />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ValueBadge({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[#eceff5] bg-white px-3 py-2 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#eaf2ff] text-[#0066FF]">
        <Icon className="size-[18px]" strokeWidth={1.9} />
      </span>
      <span className="leading-tight">
        <span className="block text-[12.5px] font-bold whitespace-nowrap text-[#0B1F4D]">{title}</span>
        <span className="block text-[11px] whitespace-nowrap text-[#8b93a7]">{text}</span>
      </span>
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
          ? "border-[#0066FF] bg-[#f3f8ff] shadow-[0_2px_10px_rgba(0,102,255,0.12)]"
          : "border-[#eceff5] hover:border-[#0066FF]/40",
      )}
    >
      <span
        className={cn(
          "grid size-9 place-items-center rounded-[10px]",
          active ? "bg-[#0066FF] text-white" : "bg-[#eef4ff] text-[#0066FF]",
        )}
      >
        <Icon className="size-[18px]" strokeWidth={1.8} />
      </span>
      <span className={cn("max-w-full truncate text-[11.5px] font-semibold", active ? "text-[#0066FF]" : "text-[#1a1d26]")}>
        {label}
      </span>
    </button>
  );
}

