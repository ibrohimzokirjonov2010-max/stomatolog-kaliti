"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Plus,
  Search,
  Shirt,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";
import { EmbroiderySheet } from "@/components/forma-embroidery";
import { useSellerWork } from "@/components/seller-provider";
import { FormaDesktop } from "@/components/forma-desktop";
import { FormaProductCard } from "@/components/forma-product-card";
import { FormaMobileHero, type FormaHeroTarget } from "@/components/forma-mobile-hero";
import { MobileSectionHeader } from "@/components/mobile-section-header";
import type { ApparelKind } from "@/data/products";
import { buttonVariants } from "@/components/ui/button";
import {
  FORMA_PRICE_MAX,
  FORMA_PRICE_MIN,
  clothingSizes,
  formaColors,
  formaGenders,
  formaKinds,
  formaProducts,
  matchesClothingSize,
} from "@/data/forma";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type MobileCat = "" | ApparelKind | "qishki" | "aksessuar";

const winterRe = /qishki|kurtka|jaket|issiq/i;

function matchesMobileCat(product: { kind?: ApparelKind; name: string }, cat: MobileCat) {
  if (!cat) return true;
  if (cat === "aksessuar") return false;
  if (cat === "qishki") return winterRe.test(product.name);
  return product.kind === cat;
}

export function FormaBrowse() {
  const params = useSearchParams();
  const { catalog } = useSellerWork();
  const qParam = (params.get("q") ?? "").trim().toLowerCase();
  const [mobileQuery, setMobileQuery] = useState("");
  const q = (mobileQuery.trim() || qParam).toLowerCase();
  const [mobileCat, setMobileCat] = useState<MobileCat>("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [sort, setSort] = useState<"" | "asc" | "desc">("");
  const [showAllMobile, setShowAllMobile] = useState(false);
  const [kind, setKind] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [gender, setGender] = useState("");
  const [brand, setBrand] = useState("");
  const [minPrice, setMinPrice] = useState(FORMA_PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState(FORMA_PRICE_MAX);
  const [priceDirty, setPriceDirty] = useState(false);
  const [showExtraColors, setShowExtraColors] = useState(false);
  const [embroidery, setEmbroidery] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const allForma = useMemo(() => {
    const seller = catalog.filter(
      (product) => product.category === "forma" && product.active !== false && product.listedBySeller,
    );
    const ids = new Set(seller.map((product) => product.id));
    return [...seller, ...formaProducts.filter((product) => !ids.has(product.id))];
  }, [catalog]);

  const brandOptions = useMemo(
    () => [...new Set(allForma.map((product) => product.brand))].sort((a, b) => a.localeCompare(b, "uz")),
    [allForma],
  );

  const filtersTouched =
    Boolean(kind || mobileCat || gender || brand || color || size || q) || priceDirty;

  const filterBadge =
    (kind || mobileCat ? 1 : 0) +
    (size ? 1 : 0) +
    (color ? 1 : 0) +
    (gender ? 1 : 0) +
    (brand ? 1 : 0) +
    (priceDirty ? 1 : 0);

  const matching = useMemo(() => {
    return allForma.filter((product) => {
      const matchesDesktopKind = !kind || product.kind === kind;
      const matchesMobileCatOk = matchesMobileCat(product, mobileCat);
      const matchesKind = matchesDesktopKind && matchesMobileCatOk;
      const matchesGender = !gender || product.gender === gender || product.gender === "unisex";
      const matchesBrand = !brand || product.brand === brand;
      const matchesColor = !color || (product.colors ?? []).includes(color);
      const matchesSize = matchesClothingSize(product, size);
      const matchesPrice = !priceDirty || (product.price >= minPrice && product.price <= maxPrice);
      const matchesQ =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.brand.toLowerCase().includes(q) ||
        (product.kind ?? "").toLowerCase().includes(q);
      return matchesKind && matchesGender && matchesBrand && matchesColor && matchesSize && matchesPrice && matchesQ;
    });
  }, [allForma, brand, color, gender, kind, maxPrice, minPrice, mobileCat, priceDirty, q, size]);

  const visible = useMemo(() => {
    if (!sort) return matching;
    return [...matching].sort((a, b) => (sort === "asc" ? a.price - b.price : b.price - a.price));
  }, [matching, sort]);

  const kindCounts = useMemo(() => {
    const m = new Map<ApparelKind, { count: number; image: string }>();
    for (const product of allForma) {
      if (!product.kind) continue;
      const cur = m.get(product.kind);
      if (cur) cur.count += 1;
      else m.set(product.kind, { count: 1, image: product.image });
    }
    return m;
  }, [allForma]);
  const popular = useMemo(() => {
    const men = allForma.filter((p) => p.gender === "erkak" || p.gender === "unisex");
    const women = allForma.filter((p) => p.gender === "ayol" || p.gender === "unisex");
    const coats = allForma.filter((p) => p.kind === "xalat");
    return [
      { id: "erkak", label: "Erkaklar formasi", count: men.length, image: "/images/forma/erkaklar-formasi.webp", alt: "To‘q ko‘k tibbiy formadagi erkak stomatolog" },
      { id: "ayol", label: "Ayollar formasi", count: women.length, image: "/images/forma/ayollar-formasi.webp", alt: "Tibbiy formadagi ayol stomatolog" },
      { id: "xalat", label: "Xalatlar", count: coats.length, image: "/images/forma/xalatlar.webp", alt: "Oq tibbiy xalat kiygan shifokor" },
    ];
  }, [allForma]);
  const visibleColors = formaColors.filter((item) => showExtraColors || !item.extra);

  function reset() {
    setKind("");
    setMobileCat("");
    setShowAllMobile(false);
    setSize("");
    setColor("");
    setGender("");
    setBrand("");
    setMinPrice(FORMA_PRICE_MIN);
    setMaxPrice(FORMA_PRICE_MAX);
    setPriceDirty(false);
    setMobileQuery("");
    setSort("");
  }

  function showCatalog() {
    document.getElementById("katalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** Hero slide buttons open existing catalog filters: all / coats (klassik) / scrubs (rangli). */
  function openHeroTarget(target: FormaHeroTarget) {
    setMobileCat(target);
    setGender("");
    setShowAllMobile(true);
    showCatalog();
  }

  return (
    <div>
      {/* ════════════════════════════════════════════════
          MOBILE LAYOUT (≤768px phone / lg shell)
          ════════════════════════════════════════════════ */}
      <div className="lg:hidden">
        <MobileSectionHeader
          title="Forma"
          subtitle="Stomatologlar uchun professional kiyimlar"
          searchOpen={mobileSearchOpen}
          onSearch={() => setMobileSearchOpen((v) => !v)}
        />

        {mobileSearchOpen ? (
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-[#8b93a7]" />
            <input
              autoFocus
              value={mobileQuery}
              onChange={(event) => setMobileQuery(event.target.value)}
              placeholder="Mahsulot, brend yoki turi..."
              className="h-12 w-full rounded-2xl border border-[#e8eef4] bg-[#f4f6fa] pr-3 pl-10 text-[14px] text-[#1a1d26] outline-none placeholder:text-[#8b93a7] focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15"
            />
          </div>
        ) : null}

        <FormaMobileHero onPick={openHeroTarget} />

        <div data-testid="forma-categories" className="-mx-4 mb-4 min-w-0 touch-pan-x overflow-x-auto overscroll-x-contain px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><div className="flex w-max min-w-full gap-2.5">
          {(
            [
              { id: "" as const, label: "Barchasi", img: "barchasi" },
              { id: "scrub" as const, label: "Kostyumlar", img: "kostyumlar" },
              { id: "xalat" as const, label: "Xalatlar", img: "xalatlar" },
              { id: "qishki" as const, label: "Qishki forma", img: "qishki-forma" },
              { id: "qalpoq" as const, label: "Bosh kiyimlar", img: "bosh-kiyimlar" },
              { id: "aksessuar" as const, label: "Aksessuarlar", icon: "bag" as const },
              ...(kindCounts.has("poyabzal") ? [{ id: "poyabzal" as const, label: "Poyabzal", img: "poyabzal" }] : []),
            ] as { id: MobileCat; label: string; img?: string; icon?: "shirt" | "shoe" | "cap" | "bag" | "coat" | "winter" }[]
          ).map((chip) => {
            const on = mobileCat === chip.id;
            return (
              <button
                key={chip.id || "all"}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setMobileCat(chip.id);
                  setGender("");
                  setShowAllMobile(false);
                }}
                className="flex w-[72px] shrink-0 flex-col items-center gap-1.5"
              >
                <span className={cn("grid size-[54px] place-items-center rounded-2xl border", on ? "border-[#0066FF] bg-[#0066FF] text-white shadow-[0_6px_14px_rgba(0,102,255,0.28)]" : "border-[#e1e9f8] bg-white text-[#0066FF]")}>
                  {chip.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/icons/forma/${chip.img}-128.png`}
                      alt={chip.label}
                      width={30}
                      height={30}
                      className="size-[30px] object-contain"
                      style={on ? { filter: "brightness(0) invert(1)" } : undefined}
                    />
                  ) : (
                    <MobileCatIcon name={chip.icon ?? "bag"} />
                  )}
                </span>
                <span className={cn("text-center text-[11.5px] leading-tight", on ? "font-semibold text-[#0B1F4D]" : "font-medium text-[#6b7280]")}>{chip.label}</span>
              </button>
            );
          })}
        </div>
        </div>

        <section className="mb-5">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-[16px] font-bold tracking-tight text-[#0B1F4D]">Mashhur kategoriyalar</h2>
            <button
              type="button"
              onClick={() => {
                setMobileCat("");
                setGender("");
                setShowAllMobile(true);
                showCatalog();
              }}
              className="inline-flex items-center text-[12.5px] font-semibold text-[#0066FF]"
            >
              Barchasini ko‘rish <ArrowRight className="ml-1 size-3.5" />
            </button>
          </div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {popular.map((c) => (
              <button
                key={c.id}
                type="button"
                data-testid="forma-popular"
                onClick={() => {
                  if (c.id === "xalat") {
                    setMobileCat("xalat");
                    setGender("");
                  } else {
                    setMobileCat("");
                    setGender(c.id);
                  }
                  setShowAllMobile(true);
                  showCatalog();
                }}
                className="relative h-[116px] w-[150px] shrink-0 overflow-hidden rounded-2xl bg-[#eef2f8] text-left"
              >
                <Image src={c.image} alt={c.alt} fill sizes="150px" loading="lazy" className="object-cover object-[center_20%]" />
                <span className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,18,32,.75), transparent 60%)" }} />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 p-2.5 text-white">
                  <span className="min-w-0">
                    <span className="block text-[13px] leading-tight font-bold">{c.label}</span>
                    {c.count > 0 ? <span className="block text-[11px] text-white/80">{c.count} ta mahsulot</span> : null}
                  </span>
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-[#0066FF]">
                    <ArrowRight className="size-3.5" />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <div className="mb-4 flex min-w-0 touch-pan-x gap-[3px] overflow-x-auto overscroll-x-contain pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="relative inline-flex h-10 shrink-0 items-center gap-1 rounded-xl border border-[#e6eaf2] bg-white px-2 text-[11px] font-semibold text-[#1a1d26]"
            aria-label="Filtrlar"
          >
            <SlidersHorizontal className="size-3.5 text-[#0066FF]" />
            Filtrlar
            {filterBadge > 0 ? <span className="grid size-[18px] place-items-center rounded-full bg-[#0066FF] text-[10px] font-bold text-white">{filterBadge}</span> : null}
          </button>
          <MobileFilterSelect label="Brend" value={brand} onChange={setBrand} options={brandOptions.map((item) => ({ value: item, label: item }))} />
          <MobileFilterSelect label="Rang" value={color} onChange={setColor} options={formaColors.map((item) => ({ value: item.id, label: item.label }))} />
          <MobileFilterSelect label="O‘lcham" value={size} onChange={setSize} options={["XS", ...clothingSizes].map((item) => ({ value: item, label: item }))} />
          <MobileFilterSelect
            sortIcon
            label="Saralash"
            value={sort}
            onChange={(v) => setSort(v as "" | "asc" | "desc")}
            options={[
              { value: "asc", label: "Narx: arzonroq" },
              { value: "desc", label: "Narx: qimmatroq" },
            ]}
          />
        </div>

        <section id="katalog" className="mb-4 scroll-mt-16">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[16px] font-bold tracking-tight text-[#0B1F4D]">
              {filtersTouched ? "Natijalar" : "Tavsiya etilgan mahsulotlar"} <span className="text-[13px] font-semibold text-[#8b93a7]">({visible.length})</span>
            </h2>
            {!showAllMobile && visible.length > 4 ? (
              <button type="button" onClick={() => setShowAllMobile(true)} className="inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-[#0066FF]">
                Barchasini ko‘rish
                <ChevronRight className="size-3.5" />
              </button>
            ) : null}
          </div>

          {visible.length === 0 ? (
            <div className="rounded-2xl border border-[#eceff5] bg-white px-4 py-12 text-center">
              <p className="text-[14px] font-semibold text-[#1a1d26]">Hozircha mahsulot yo‘q</p>
              <p className="mt-1 text-[13px] text-[#8b93a7]">Bu bo‘limga tez orada yangi mahsulotlar qo‘shiladi.</p>
              <button type="button" onClick={reset} className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-[#0066FF] px-5 text-[14px] font-semibold text-white">
                Barcha mahsulotlar
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(showAllMobile ? visible : visible.slice(0, 6)).map((product) => (
                <FormaProductCard key={product.id} product={product} presetSize={size || undefined} presetColor={color || undefined} variant="mobile" />
              ))}
            </div>
          )}
          {!showAllMobile && visible.length > 6 ? (
            <button type="button" onClick={() => setShowAllMobile(true)} className="mt-3 h-11 w-full rounded-2xl border border-[#e6eaf2] bg-white text-[14px] font-semibold text-[#0066FF]">
              Yana ko‘rsatish ({visible.length - 6})
            </button>
          ) : null}
        </section>

        <button
          type="button"
          onClick={() => setEmbroidery(true)}
          className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-[#dbe7ff] bg-[#f5f8ff] px-3.5 py-3 text-left"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#0066FF] shadow-sm">
            <EmbroideryIcon />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[13px] font-bold text-[#1a1d26]">Kasbiy kashta / logo</span>
            <span className="mt-0.5 block text-[11px] text-[#8b93a7]">Ism va klinika logotipi — 1–2 kun</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-[#8b93a7]" />
        </button>

        <Link
          href="/forma/buyurtmalarim"
          className="mb-3 flex min-h-[52px] items-center gap-3 rounded-2xl border border-[#eceff5] bg-white px-3.5 py-3"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0066FF] text-white">
            <ClipboardList className="size-[18px]" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[13px] font-bold text-[#1a1d26]">Mening forma buyurtmalarim</span>
            <span className="mt-0.5 block text-[11px] text-[#8b93a7]">Savat va embroidery so‘rovlar</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-[#8b93a7]" />
        </Link>
      </div>

      {/* ════════════════════════════════════════════════
          DESKTOP LAYOUT
          ════════════════════════════════════════════════ */}
      <FormaDesktop products={allForma} q={q} onEmbroidery={() => setEmbroidery(true)} />

      {filtersOpen ? (
        <FilterSheet title="Filtrlar" onClose={() => setFiltersOpen(false)}>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pb-2">
            <section>
              <p className="mb-2 text-sm font-semibold text-[#1a1d26]">O‘lcham</p>
              <div className="flex flex-wrap gap-2">
                {["XS", ...clothingSizes].map((item) => {
                  const on = size === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSize(on ? "" : item)}
                      className={cn(
                        "flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-[14px] font-semibold",
                        on ? "bg-[#0066FF] text-white" : "bg-[#f4f6fa] text-[#4b5568]",
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <p className="mb-2 text-sm font-semibold text-[#1a1d26]">Rang</p>
              <div className="flex flex-wrap gap-2">
                {formaColors.map((item) => {
                  const on = color === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setColor(on ? "" : item.id)}
                      className={cn(
                        "inline-flex h-11 items-center gap-2 rounded-xl px-3 text-[13px] font-semibold",
                        on ? "bg-[#e8f1ff] text-[#0066FF] ring-1 ring-[#0066FF]" : "bg-[#f4f6fa] text-[#4b5568]",
                      )}
                    >
                      <span
                        className={cn(
                          "size-5 rounded-full border",
                          item.id === "white" ? "border-slate-300" : "border-transparent",
                        )}
                        style={{ backgroundColor: item.hex }}
                      />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <p className="mb-2 text-sm font-semibold text-[#1a1d26]">Jins</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setGender("")}
                  className={cn(
                    "h-11 rounded-xl text-sm font-semibold",
                    !gender ? "bg-[#0066FF] text-white" : "bg-[#f4f6fa] text-[#4b5568]",
                  )}
                >
                  Barchasi
                </button>
                {formaGenders.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGender(item.id)}
                    className={cn(
                      "h-11 rounded-xl text-sm font-semibold",
                      gender === item.id ? "bg-[#0066FF] text-white" : "bg-[#f4f6fa] text-[#4b5568]",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-2 text-sm font-semibold text-[#1a1d26]">Brend</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBrand("")}
                  className={cn(
                    "h-11 rounded-xl text-sm font-semibold",
                    !brand ? "bg-[#0066FF] text-white" : "bg-[#f4f6fa] text-[#4b5568]",
                  )}
                >
                  Barchasi
                </button>
                {brandOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setBrand(item)}
                    className={cn(
                      "h-11 rounded-xl text-sm font-semibold",
                      brand === item ? "bg-[#0066FF] text-white" : "bg-[#f4f6fa] text-[#4b5568]",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-2 text-sm font-semibold text-[#1a1d26]">Narx</p>
              <input
                type="range"
                min={FORMA_PRICE_MIN}
                max={FORMA_PRICE_MAX}
                step={10000}
                value={maxPrice}
                onChange={(event) => {
                  setPriceDirty(true);
                  setMaxPrice(Math.max(Number(event.target.value), minPrice));
                }}
                className="w-full accent-[#0066FF]"
              />
              <p className="mt-1 text-sm font-semibold text-[#1a1d26]">{formatMoney(maxPrice, "UZS")}</p>
            </section>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={reset}
                className="h-12 rounded-2xl bg-[#f4f6fa] text-sm font-semibold text-[#4b5568]"
              >
                Tozalash
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="h-12 rounded-2xl bg-[#0066FF] text-sm font-semibold text-white"
              >
                Ko‘rsatish ({visible.length})
              </button>
            </div>
          </div>
        </FilterSheet>
      ) : null}

      {embroidery ? <EmbroiderySheet onClose={() => setEmbroidery(false)} /> : null}
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


function MobileCatIcon({ name }: { name: "shirt" | "shoe" | "cap" | "bag" | "coat" | "winter" }) {
  const cls = "size-[27px]";
  if (name === "coat") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3l3 3 3-3 4 3-1.5 4H17v11H7V10H6.5L5 6z" />
        <path d="M12 6v15" />
      </svg>
    );
  }
  if (name === "winter") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9" />
      </svg>
    );
  }
  if (name === "shoe") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15.5h11.5c1.8 0 3.2.7 4 2.1l.5.9H4.8c-.8 0-1.3-.9-.9-1.6L5.5 14" />
        <path d="M5.5 14l1.2-4.2c.3-1 1.2-1.8 2.3-1.8h2.2c.7 0 1.4.3 1.8.9L15 12" />
        <path d="M8 8.2V6.5" />
      </svg>
    );
  }
  if (name === "cap") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14c0-4 3.4-7 8-7s8 3 8 7" />
        <path d="M3.5 14.5h17" />
        <path d="M12 7v2.5" />
      </svg>
    );
  }
  if (name === "bag") {
    return <ShoppingBag className={cls} strokeWidth={1.7} />;
  }
  return <Shirt className={cls} strokeWidth={1.7} />;
}

function MobileFilterSelect({
  label,
  value,
  onChange,
  options,
  sortIcon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  sortIcon?: boolean;
}) {
  const active = Boolean(value);
  return (
    <label
      className={cn(
        "relative inline-flex h-10 shrink-0 items-center gap-1 rounded-xl border pl-2 text-[11px] font-semibold",
        sortIcon ? "pr-6" : "pr-5",
        active ? "border-[#0066FF]/40 bg-[#e8f1ff] text-[#0066FF]" : "border-[#e6eaf2] bg-white text-[#1a1d26]",
      )}
    >
      <span className="pointer-events-none">{active ? options.find((o) => o.value === value)?.label ?? label : label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={label}
      >
        <option value="">{label}</option>
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      {sortIcon ? <ArrowUpDown className="pointer-events-none absolute right-1.5 size-3.5 text-[#0066FF]" /> : <ChevronDown className="pointer-events-none absolute right-1 size-3.5 text-[#8b93a7]" />}
    </label>
  );
}

function EmbroideryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M7 20h10" />
      <path d="M8 20V9.5c0-1 .6-2 2.2-2.6L12 6l1.8.9C15.4 7.5 16 8.5 16 9.5V20" />
      <path d="M9.5 11h5" />
      <circle cx="12" cy="4.2" r="1.4" />
      <path d="M6 16h12" />
    </svg>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="relative min-w-[140px] flex-1 rounded-[14px] border border-[#e6eaf2] bg-white px-3 py-2">
      <span className="block text-[11px] text-[#8b93a7]">{label}</span>
      {children}
      <ChevronDown className="pointer-events-none absolute right-3 bottom-2.5 size-4 text-slate-400" />
    </label>
  );
}

function NativeSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-0.5 w-full appearance-none bg-transparent pr-5 text-sm font-semibold text-[#1a1d26] outline-none"
    >
      {children}
    </select>
  );
}

function formatPlain(amount: number) {
  return formatMoney(amount, "UZS").replace(" so‘m", "");
}

function parseDigits(value: string, fallback: number) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return fallback;
  return Number(digits);
}
