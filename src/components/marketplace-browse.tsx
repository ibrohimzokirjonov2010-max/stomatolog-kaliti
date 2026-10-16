"use client";

import { AdBanner } from "@/components/ad-banner";
import { BonusNotice } from "@/components/bonus/bonus";
import { MarketplaceMobileHero } from "@/components/marketplace-mobile-hero";
import { JihozlarMobileHero, type JihozPreset } from "@/components/jihozlar-mobile-hero";
import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  ChevronDown,
  FlaskConical,
  Home,
  LayoutGrid,
  List,
  Monitor,
  Package,
  Scissors,
  Search,
  SlidersHorizontal,
  type LucideIcon, X as XIcon } from "lucide-react";
import { JihozlarDesktop } from "@/components/jihozlar-desktop";
import { MarketplaceDesktop } from "@/components/marketplace-desktop";
import { ProductCard } from "@/components/product-card";
import { useSellerWork } from "@/components/seller-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  BRANDS_PREVIEW,
  PRICE_MAX,
  PRICE_MIN,
  brandCatalogCounts,
  categoryCatalogCounts,
  categoryTabs,
  groupsForCatParam,
  marketplaceListingOrder,
  type ProductCategory,
} from "@/data/products";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MobileSectionHeader } from "@/components/mobile-section-header";
import { MarketMobileCatalog } from "@/components/market/mobile/MarketMobileCatalog";

type SortKey = "featured" | "cheap" | "expensive" | "new" | "rating";

/** Brand chip icons in public/icons/{id}-64.png (white via CSS filter on the active chip). */
const CHIP_ICONS = new Set<string>(["materiallar", "implantlar", "asboblar", "jihozlar", "laboratoriya"]);

const mobileCategoryIcons: Partial<Record<ProductCategory, LucideIcon>> = {
  materiallar: Package,
  implantlar: Package,
  asboblar: Scissors,
  jihozlar: Monitor,
  laboratoriya: FlaskConical,
};

export function MarketplaceBrowse({
  title = "Marketplace",
  forcedCategory,
}: {
  title?: string;
  forcedCategory?: ProductCategory;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const { catalog } = useSellerWork();
  const qParam = (params.get("q") ?? "").trim().toLowerCase();
  const brandParam = (params.get("brand") ?? "").trim().toLowerCase();
  const catParam = (forcedCategory ?? params.get("cat")) as ProductCategory | null;
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState<"brand" | "price" | "stock" | null>(null);
  const [mobileView, setMobileView] = useState<"grid" | "list">("grid");
  const q = (query.trim() || qParam).toLowerCase();

  const [tab, setTab] = useState<ProductCategory | "">(catParam || "materiallar");
  const [checkedCats, setCheckedCats] = useState<ProductCategory[]>(catParam ? [catParam] : []);
  const [brandQuery, setBrandQuery] = useState("");
  const [checkedBrands, setCheckedBrands] = useState<string[]>(() => {
    if (!brandParam) return [];
    const hit = catalog.find((p) => p.brand.trim().toLowerCase() === brandParam);
    return hit ? [hit.brand] : [];
  });
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [minPrice, setMinPrice] = useState(PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [priceDirty, setPriceDirty] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("featured");
  const [jihozPreset, setJihozPreset] = useState<JihozPreset>(null);

  const brandCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of catalog) {
      map.set(product.brand, (map.get(product.brand) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([name, count]) => ({
        name,
        count: brandCatalogCounts[name] ?? count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [catalog]);

  const visibleBrands = useMemo(() => {
    const filtered = brandCounts.filter((b) => b.name.toLowerCase().includes(brandQuery.toLowerCase()));
    return showAllBrands ? filtered : filtered.slice(0, BRANDS_PREVIEW);
  }, [brandCounts, brandQuery, showAllBrands]);

  const visible = useMemo(() => {
    const cats = checkedCats.length ? checkedCats : [];
    const list = catalog.filter((product) => {
      const matchesCat = cats.length === 0 || cats.includes(product.category);
      const matchesBrand = checkedBrands.length === 0 || checkedBrands.includes(product.brand);
      const matchesQ =
        !q || product.name.toLowerCase().includes(q) || product.brand.toLowerCase().includes(q);
      const matchesPrice = !priceDirty || (product.price >= minPrice && product.price <= maxPrice);
      const matchesStock = !inStockOnly || product.inStock;
      const matchesPreset = !jihozPreset || jihozPreset.re.test(`${product.name} ${product.brand}`);
      return matchesCat && matchesBrand && matchesQ && matchesPrice && matchesStock && matchesPreset;
    });

    const sorted = [...list];
    if (sort === "featured") {
      const rank = (id: string) => {
        const index = marketplaceListingOrder.findIndex((item) => item === id);
        return index === -1 ? 1000 : index;
      };
      sorted.sort((a, b) => {
        const listed = Number(Boolean(b.listedBySeller)) - Number(Boolean(a.listedBySeller));
        if (listed !== 0) return listed;
        const order = rank(a.id) - rank(b.id);
        if (order !== 0) return order;
        return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
      });
    }
    if (sort === "cheap") sorted.sort((a, b) => a.price - b.price);
    if (sort === "expensive") sorted.sort((a, b) => b.price - a.price);
    if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating);
    if (sort === "new") sorted.reverse();
    return sorted;
  }, [catalog, checkedBrands, checkedCats, inStockOnly, jihozPreset, maxPrice, minPrice, priceDirty, q, sort]);

  function pushCat(next: ProductCategory | "") {
    if (forcedCategory) return;
    const usp = new URLSearchParams(params.toString());
    if (!next) usp.delete("cat");
    else usp.set("cat", next);
    router.replace(`/marketplace${usp.toString() ? `?${usp}` : ""}`, { scroll: false });
  }

  function selectTab(id: ProductCategory | "") {
    setTab(id);
    setCheckedCats(id ? [id as ProductCategory] : []);
    pushCat(id);
  }

  function toggleCat(id: ProductCategory, on: boolean) {
    const next = on ? [...new Set([...checkedCats, id])] : checkedCats.filter((c) => c !== id);
    setCheckedCats(next);
    const exclusive = next.length === 1 ? next[0] : "";
    setTab(exclusive || tab);
    pushCat(exclusive);
  }

  function resetFilters() {
    setTab(forcedCategory ?? "materiallar");
    setCheckedCats(forcedCategory ? [forcedCategory] : []);
    setBrandQuery("");
    setCheckedBrands([]);
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
    setPriceDirty(false);
    setInStockOnly(false);
    setSort("featured");
    setQuery("");
    setJihozPreset(null);
    pushCat("");
  }

  const tabsLocked = Boolean(forcedCategory);
  const defaultView = !forcedCategory && checkedCats.length === 0 && !checkedBrands.length && !inStockOnly && !q && !priceDirty;
  const resultCount = defaultView ? 248 : visible.length;
  const mobileTabs = categoryTabs.filter((item) => item.id !== "forma");
  const mobileActive = forcedCategory ? forcedCategory : tab;
  const mobileList = useMemo(() => visible, [visible]);

  const filterBadge =
    (mobileActive ? 1 : 0) +
    checkedBrands.length +
    (priceDirty ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (jihozPreset ? 1 : 0);

  return (
    <div>
      <AdBanner placement="marketplace" className={forcedCategory ? undefined : "hidden lg:block"} />
      {forcedCategory ? null : (
        <div className="mb-4 hidden space-y-3 empty:hidden lg:block">
          <BonusNotice />
        </div>
      )}
      {forcedCategory ? null : <MarketMobileCatalog />}
      <div className="hidden lg:block">
        {/* Same promo slider as on phones (shared PromoSlider), shown on desktop too. */}
        {forcedCategory === "jihozlar" ? (
          <JihozlarMobileHero
            onPick={() => document.getElementById("mp-desktop-body")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          />
        ) : null}
        {tabsLocked ? null : (
          <MarketplaceMobileHero
            onPick={(cat) => {
              router.replace(`/marketplace?cat=${cat}`, { scroll: false });
              document.getElementById("mp-desktop-body")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        )}
        <div id="mp-desktop-body" className="scroll-mt-20" />
        {forcedCategory === "jihozlar" ? (
          <JihozlarDesktop catalog={catalog} q={qParam} />
        ) : (
          <MarketplaceDesktop
          key={`${forcedCategory ?? ""}|${params.get("cat") ?? ""}|${params.get("brand") ?? ""}`}
          catalog={catalog}
          q={qParam}
          title={title}
          initialGroups={groupsForCatParam(catParam)}
          initialBrands={brandParam ? [brandParam] : []}
        />
        )}
      </div>

      {forcedCategory ? <div className="lg:hidden">
        <MobileSectionHeader
          title={forcedCategory === "jihozlar" ? "Jihozlar" : "Marketplace"}
          subtitle={forcedCategory === "jihozlar" ? "Klinik jihoz va uskunalar — sotuvchilar e’lonlari ham shu yerda" : undefined}
        />

        <nav className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          {[
            ["/kategoriyalar", "Kategoriyalar"],
            ["/marketplace/brendlar", "Brendlar"],
            ["/marketplace/aksiyalar", "Aksiyalar"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="h-8 shrink-0 rounded-full border border-[#e6eaf2] bg-white px-3.5 text-[12.5px] leading-8 font-semibold text-[#0066FF]"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#8b93a7]" />
          <input
            data-section-search
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Stomatologga nima kerak?"
            className="h-11 w-full rounded-2xl border border-[#e8eef4] bg-[#f7f8fb] pr-3 pl-10 text-[14px] text-[#1a1d26] outline-none placeholder:text-[#8b93a7] focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15"
          />
        </div>

        {forcedCategory === "jihozlar" ? (
          <JihozlarMobileHero
            onPick={(preset) => {
              setJihozPreset(preset);
              document.getElementById("jihoz-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        ) : null}

        {tabsLocked ? null : (
          <MarketplaceMobileHero
            onPick={(cat) => {
              selectTab(cat);
              document.getElementById("mp-chips")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        )}

        {tabsLocked ? null : (
          <div id="mp-chips" data-testid="mp-chips" className="-mx-4 min-w-0 scroll-mt-20 touch-pan-x overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><div className="flex w-max min-w-full gap-2">
            {mobileTabs.map((item) => {
              const active = mobileActive === item.id;
              const iconSrc = CHIP_ICONS.has(item.id) ? `/icons/${item.id}-64.png` : null;
              const Icon = mobileCategoryIcons[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectTab(item.id)}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold",
                    active
                      ? "bg-[#0066FF] text-white"
                      : "border border-[#e6eaf2] bg-[#f4f6fa] text-[#4b5568]"
                  )}
                >
                  {iconSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={iconSrc}
                      alt=""
                      width={20}
                      height={20}
                      className="size-5 shrink-0 object-contain"
                      style={active ? { filter: "brightness(0) invert(1)" } : undefined}
                    />
                  ) : Icon ? (
                    <Icon className="size-3.5" strokeWidth={2} />
                  ) : null}
                  {item.label}
                </button>
              );
            })}
          </div>
          </div>
        )}

        <div id="jihoz-results" className="mt-3 flex scroll-mt-20 items-center gap-2">
          <button
            type="button"
            onClick={() => setSheet("brand")}
            className="relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#e6eaf2] bg-white px-2.5 text-[12px] font-semibold text-[#1a1d26]"
          >
            <SlidersHorizontal className="size-3.5 text-[#4b5568]" />
            Filtrlar
            {filterBadge > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 flex size-[18px] items-center justify-center rounded-full bg-[#0066FF] text-[10px] font-bold text-white">
                {filterBadge}
              </span>
            ) : null}
          </button>

          <p className="min-w-0 flex-1 truncate text-center text-[12px] font-medium text-[#8b93a7]">
            {resultCount} ta natija
          </p>

          <label className="relative inline-flex h-9 shrink-0 items-center gap-1 rounded-xl border border-[#e6eaf2] bg-white pr-2 pl-2 text-[12px] font-semibold text-[#1a1d26]">
            <ArrowUpDown className="size-3.5 text-[#4b5568]" />
            <span className="sr-only">Saralash</span>
            <select
              value={sort === "cheap" || sort === "expensive" ? sort : "cheap"}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="max-w-[78px] appearance-none bg-transparent py-1 pr-3 text-[12px] font-semibold outline-none"
              aria-label="Saralash"
            >
              <option value="cheap">Arzonroq</option>
              <option value="expensive">Qimmatroq</option>
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-1.5 size-3 -translate-y-1/2 text-[#8b93a7]" />
          </label>

          <div className="inline-flex h-9 shrink-0 items-center rounded-xl border border-[#e6eaf2] bg-white p-0.5">
            <button
              type="button"
              aria-label="Grid ko‘rinish"
              onClick={() => setMobileView("grid")}
              className={cn(
                "grid size-8 place-items-center rounded-lg",
                mobileView === "grid" ? "bg-[#0066FF] text-white" : "text-[#8b93a7]"
              )}
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Ro‘yxat ko‘rinish"
              onClick={() => setMobileView("list")}
              className={cn(
                "grid size-8 place-items-center rounded-lg",
                mobileView === "list" ? "bg-[#0066FF] text-white" : "text-[#8b93a7]"
              )}
            >
              <List className="size-3.5" />
            </button>
          </div>
        </div>
        {jihozPreset ? (
          <div className="mt-2.5 flex">
            <button
              type="button"
              onClick={() => setJihozPreset(null)}
              data-testid="jihoz-preset"
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#e8f1ff] pr-2 pl-3 text-[12px] font-semibold text-[#0066FF]"
              aria-label={`${jihozPreset.label} filtrini olib tashlash`}
            >
              {jihozPreset.label}
              <XIcon className="size-3.5" />
            </button>
          </div>
        ) : null}
      </div> : null}

      {forcedCategory ? <div className="lg:hidden">
        <div>
          {mobileList.length === 0 ? (
            <div className="mt-3 rounded-xl bg-white px-6 py-16 text-center">
              <p className="text-[#8b93a7]">Bu filtrlar bo‘yicha mahsulot yo‘q.</p>
            </div>
          ) : mobileView === "grid" ? (
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {mobileList.map((product) => (
                <ProductCard key={product.id} product={product} variant="mobile" />
              ))}
            </div>
          ) : (
            <div className="mt-3 space-y-2.5">
              {mobileList.map((product) => (
                <ProductCard key={product.id} product={product} variant="mobile-list" />
              ))}
            </div>
          )}
        </div>
      </div> : null}

      {forcedCategory && sheet ? (
        <FilterSheet title="Filtrlar" onClose={() => setSheet(null)}>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pb-2">
            <section>
              <p className="mb-2 text-sm font-semibold text-[#1a1d26]">Brend</p>
              <ul className="space-y-1">
                {brandCounts.map((brand) => {
                  const on = checkedBrands.includes(brand.name);
                  return (
                    <li key={brand.name}>
                      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-xl px-2 text-[14px]">
                        <span className="flex items-center gap-2">
                          <Checkbox
                            checked={on}
                            onCheckedChange={(value) => {
                              setCheckedBrands((current) =>
                                value === true
                                  ? [...current, brand.name]
                                  : current.filter((name) => name !== brand.name)
                              );
                            }}
                            className="size-4"
                          />
                          {brand.name}
                        </span>
                        <span className="text-[#8b93a7]">{brand.count}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
            <section>
              <p className="mb-2 text-sm font-semibold text-[#1a1d26]">Narx</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={cn(
                    "h-11 rounded-xl text-sm font-semibold",
                    sort === "cheap" ? "bg-[#0066FF] text-white" : "bg-[#f4f6fa] text-[#4b5568]"
                  )}
                  onClick={() => setSort("cheap")}
                >
                  Arzonroq
                </button>
                <button
                  type="button"
                  className={cn(
                    "h-11 rounded-xl text-sm font-semibold",
                    sort === "expensive" ? "bg-[#0066FF] text-white" : "bg-[#f4f6fa] text-[#4b5568]"
                  )}
                  onClick={() => setSort("expensive")}
                >
                  Qimmatroq
                </button>
              </div>
              <input
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={10000}
                value={maxPrice}
                onChange={(event) => {
                  setPriceDirty(true);
                  setMaxPrice(Math.max(Number(event.target.value), minPrice));
                }}
                className="mt-3 w-full accent-primary"
              />
              <p className="mt-1 text-sm font-semibold text-[#1a1d26]">{formatMoney(maxPrice, "UZS")}</p>
            </section>
            <section>
              <p className="mb-2 text-sm font-semibold text-[#1a1d26]">Omborda</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={cn(
                    "h-12 rounded-xl text-sm font-semibold",
                    !inStockOnly ? "bg-[#0066FF] text-white" : "bg-[#f4f6fa] text-[#4b5568]"
                  )}
                  onClick={() => setInStockOnly(false)}
                >
                  Barchasi
                </button>
                <button
                  type="button"
                  className={cn(
                    "h-12 rounded-xl text-sm font-semibold",
                    inStockOnly ? "bg-[#0066FF] text-white" : "bg-[#f4f6fa] text-[#4b5568]"
                  )}
                  onClick={() => setInStockOnly(true)}
                >
                  Faqat omborda
                </button>
              </div>
            </section>
          </div>
        </FilterSheet>
      ) : null}
    </div>
  );
}

function FilterSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Yopish" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-4 pt-3 shadow-2xl"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e6eaf2]" />
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[16px] font-bold text-[#1a1d26]">{title}</p>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-[#0066FF]">
            Tayyor
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
