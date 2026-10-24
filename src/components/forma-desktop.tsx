"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgePercent,
  Check,
  ChevronDown,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  X,
} from "lucide-react";
import { FormaProductCard } from "@/components/forma-product-card";
import { FormaMobileHero } from "@/components/forma-mobile-hero";
import { buttonVariants } from "@/components/ui/button";
import {
  clothingSizes,
  formaCats,
  formaColors,
  formaGenders,
  formaMaterial,
  formaMaterials,
  formaPriceBands,
  isNewForma,
  matchesClothingSize,
  matchesFormaCat,
  type FormaCat,
} from "@/data/forma";
import type { Product } from "@/data/products";
import { cn } from "@/lib/utils";

type SortId = "popular" | "asc" | "desc" | "new" | "rating";

const sorts: { id: SortId; label: string }[] = [
  { id: "popular", label: "Eng mashhur" },
  { id: "asc", label: "Narxi: arzon → qimmat" },
  { id: "desc", label: "Narxi: qimmat → arzon" },
  { id: "new", label: "Yangi mahsulotlar" },
  { id: "rating", label: "Reyting" },
];

const trust = [
  { icon: ShieldCheck, title: "Sertifikatlangan", sub: "mahsulotlar" },
  { icon: BadgePercent, title: "Klinikaga maxsus", sub: "takliflar" },
  { icon: Truck, title: "Tez yetkazib", sub: "berish" },
  { icon: Award, title: "Ishonchli", sub: "brendlar" },
];

function Dropdown({
  label,
  value,
  active,
  children,
  width = "w-56",
}: {
  label: string;
  value: ReactNode;
  active?: boolean;
  children: (close: () => void) => ReactNode;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex h-[54px] w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 text-left transition-colors",
          active || open ? "border-[#0F766E]" : "border-[#e6eaf2] hover:border-[#CCFBF1]",
        )}
      >
        <span className="min-w-0">
          <span className="block text-[11px] leading-none text-[#8b93a7]">{label}</span>
          <span className="mt-1.5 block truncate text-[13px] leading-none font-semibold text-[#1a1d26]">{value}</span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-[#8b93a7] transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div
          className={cn(
            "absolute top-[calc(100%+6px)] left-0 z-30 rounded-xl border border-[#e6eaf2] bg-white p-2 shadow-[0_12px_32px_rgba(17, 24, 39, 0.14)]",
            width,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

function Option({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] hover:bg-[#f2f6ff]",
        on ? "font-semibold text-[#0F766E]" : "text-[#1a1d26]",
      )}
    >
      {children}
      {on ? <Check className="size-4" /> : null}
    </button>
  );
}

export function FormaDesktop({
  products,
  q,
  onEmbroidery,
}: {
  products: Product[];
  q: string;
  onEmbroidery: () => void;
}) {
  const [cat, setCat] = useState<FormaCat>("");
  const [gender, setGender] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [brand, setBrand] = useState("");
  const [material, setMaterial] = useState("");
  const [band, setBand] = useState("");
  const [sort, setSort] = useState<SortId>("popular");
  const [panel, setPanel] = useState(false);

  const brandOptions = useMemo(
    () => [...new Set(products.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, "uz")),
    [products],
  );

  const list = useMemo(() => {
    const priceTest = formaPriceBands.find((b) => b.id === band)?.test;
    const filtered = products.filter((p) => {
      if (!matchesFormaCat(p, cat)) return false;
      if (gender && p.gender !== gender && p.gender !== "unisex") return false;
      if (brand && p.brand !== brand) return false;
      if (color && !(p.colors ?? []).includes(color)) return false;
      if (!matchesClothingSize(p, size)) return false;
      if (material && formaMaterial(p).id !== material) return false;
      if (priceTest && !priceTest(p.price)) return false;
      if (q) {
        const hay = `${p.name} ${p.brand} ${p.kind ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const sorted = [...filtered];
    if (sort === "asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    else if (sort === "new")
      sorted.sort((a, b) => Number(isNewForma(b)) - Number(isNewForma(a)) || b.id.localeCompare(a.id));
    else sorted.sort((a, b) => b.reviews - a.reviews);
    return sorted;
  }, [band, brand, cat, color, gender, material, products, q, size, sort]);

  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (cat) chips.push({ key: "cat", label: formaCats.find((c) => c.id === cat)?.label ?? cat, clear: () => setCat("") });
  if (gender) chips.push({ key: "g", label: formaGenders.find((g) => g.id === gender)?.label ?? gender, clear: () => setGender("") });
  if (size) chips.push({ key: "s", label: `O‘lcham ${size}`, clear: () => setSize("") });
  if (color) chips.push({ key: "c", label: formaColors.find((c) => c.id === color)?.label ?? color, clear: () => setColor("") });
  if (brand) chips.push({ key: "b", label: brand, clear: () => setBrand("") });
  if (material) chips.push({ key: "m", label: formaMaterials.find((m) => m.id === material)?.label ?? material, clear: () => setMaterial("") });
  if (band) chips.push({ key: "p", label: formaPriceBands.find((b) => b.id === band)?.label ?? band, clear: () => setBand("") });

  function reset() {
    setCat("");
    setGender("");
    setSize("");
    setColor("");
    setBrand("");
    setMaterial("");
    setBand("");
  }

  const colorOpt = formaColors.find((c) => c.id === color);

  return (
    <div className="hidden lg:block">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Link href="/forma/buyurtmalarim" className="text-[13px] font-semibold text-primary hover:underline">
          Mening forma buyurtmalarim
        </Link>
      </div>

      {/* Same promo slider as on phones (shared PromoSlider). */}
      <FormaMobileHero
        onPick={(target) => {
          setCat(target);
          document.getElementById("katalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[20px] bg-linear-to-r from-[#F0FDFA] via-[#F0FDFA] to-[#f3f9ff] px-8 pt-7 pb-6">
        <Plus className="pointer-events-none absolute top-6 right-[44%] size-9 text-sky-200" />
        <Plus className="pointer-events-none absolute right-10 bottom-6 size-7 text-sky-200/80" />
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_480px]">
          <div>
            <h1 className="text-[40px] leading-none font-extrabold tracking-tight text-[#111827]">Forma</h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#4b5a78]">
              Stomatolog va klinika xodimlari uchun tibbiy forma, kiyim, poyabzal va aksessuarlar.
            </p>
            <div className="mt-5 grid max-w-[640px] grid-cols-4 gap-3">
              {trust.map(({ icon: Icon, title, sub }) => (
                <div key={title} className="flex items-center gap-2.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#0F766E] shadow-sm">
                    <Icon className="size-5" />
                  </span>
                  <p className="text-[12px] leading-tight font-semibold text-[#111827]">
                    {title}
                    <br />
                    <span className="font-medium text-[#5b6b8c]">{sub}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-end justify-end gap-3">
            {[
              { src: "/images/clinic/dr-peeking.png", alt: "Scrub kiygan shifokor", cls: "h-[190px]" },
              { src: "/images/forma-banner-doctor.png", alt: "Oq xalatli shifokor", cls: "h-[220px]" },
              { src: "/images/usta-sardor.png", alt: "Niqobli stomatolog", cls: "h-[190px]" },
            ].map((item) => (
              <Image
                key={item.src}
                src={item.src}
                alt={item.alt}
                width={300}
                height={300}
                className={cn("w-[150px] rounded-2xl border-4 border-white object-cover object-top shadow-md", item.cls)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Category pills */}
      <div className="mt-5 flex flex-wrap gap-2">
        {formaCats.map((item) => {
          const on = cat === item.id;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => setCat(item.id)}
              className={cn(
                "h-10 rounded-full border px-5 text-[14px] font-semibold transition-colors",
                on
                  ? "border-[#0F766E] bg-[#0F766E] text-white"
                  : "border-[#e6eaf2] bg-white text-[#2b3447] hover:border-[#0F766E]/50 hover:text-[#0F766E]",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Filter dropdowns */}
      <div className="mt-4 flex gap-2.5">
        <Dropdown label="Kategoriya" value={formaCats.find((c) => c.id === cat)?.label} active={Boolean(cat)}>
          {(close) =>
            formaCats.map((c) => (
              <Option key={c.label} on={cat === c.id} onClick={() => { setCat(c.id); close(); }}>
                {c.label}
              </Option>
            ))
          }
        </Dropdown>
        <Dropdown label="Jins" value={gender ? formaGenders.find((g) => g.id === gender)?.label : "Barchasi"} active={Boolean(gender)}>
          {(close) => (
            <>
              <Option on={!gender} onClick={() => { setGender(""); close(); }}>Barchasi</Option>
              {formaGenders.map((g) => (
                <Option key={g.id} on={gender === g.id} onClick={() => { setGender(g.id); close(); }}>
                  {g.label}
                </Option>
              ))}
            </>
          )}
        </Dropdown>
        <Dropdown label="O‘lcham" value={size ? size : "S – XXL"} active={Boolean(size)} width="w-64">
          {(close) => (
            <div className="flex flex-wrap gap-2 p-1">
              {clothingSizes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => { setSize(size === item ? "" : item); close(); }}
                  className={cn(
                    "h-9 min-w-11 rounded-lg border px-3 text-[13px] font-semibold",
                    size === item ? "border-[#0F766E] bg-[#0F766E] text-white" : "border-[#e6eaf2] text-[#2b3447] hover:border-[#0F766E]/50",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </Dropdown>
        <Dropdown
          label="Rang"
          active={Boolean(color)}
          value={
            <span className="flex items-center gap-1.5">
              {colorOpt ? (
                <>
                  <span className="size-3.5 rounded-full border border-slate-200" style={{ backgroundColor: colorOpt.hex }} />
                  {colorOpt.label}
                </>
              ) : (
                formaColors.slice(0, 4).map((c) => (
                  <span key={c.id} className="size-3.5 rounded-full border border-slate-200" style={{ backgroundColor: c.hex }} />
                ))
              )}
            </span>
          }
        >
          {(close) => (
            <>
              <Option on={!color} onClick={() => { setColor(""); close(); }}>Barchasi</Option>
              {formaColors.map((c) => (
                <Option key={c.id} on={color === c.id} onClick={() => { setColor(c.id); close(); }}>
                  <span className="flex items-center gap-2">
                    <span className="size-4 rounded-full border border-slate-200" style={{ backgroundColor: c.hex }} />
                    {c.label}
                  </span>
                </Option>
              ))}
            </>
          )}
        </Dropdown>
        <Dropdown label="Brend" value={brand || "Barchasi"} active={Boolean(brand)}>
          {(close) => (
            <div className="max-h-64 overflow-y-auto">
              <Option on={!brand} onClick={() => { setBrand(""); close(); }}>Barchasi</Option>
              {brandOptions.map((b) => (
                <Option key={b} on={brand === b} onClick={() => { setBrand(b); close(); }}>{b}</Option>
              ))}
            </div>
          )}
        </Dropdown>
        <Dropdown
          label="Material"
          value={material ? formaMaterials.find((m) => m.id === material)?.label : "Barchasi"}
          active={Boolean(material)}
        >
          {(close) => (
            <>
              <Option on={!material} onClick={() => { setMaterial(""); close(); }}>Barchasi</Option>
              {formaMaterials.map((m) => (
                <Option key={m.id} on={material === m.id} onClick={() => { setMaterial(m.id); close(); }}>{m.label}</Option>
              ))}
            </>
          )}
        </Dropdown>
        <Dropdown label="Narx (so‘m)" value={band ? formaPriceBands.find((b) => b.id === band)?.label : "Barchasi"} active={Boolean(band)} width="w-60">
          {(close) => (
            <>
              <Option on={!band} onClick={() => { setBand(""); close(); }}>Barchasi</Option>
              {formaPriceBands.map((b) => (
                <Option key={b.id} on={band === b.id} onClick={() => { setBand(b.id); close(); }}>{b.label}</Option>
              ))}
            </>
          )}
        </Dropdown>
      </div>

      {/* Sort row */}
      <div className="mt-4 flex items-center justify-between gap-4" id="katalog">
        <div className="flex flex-wrap gap-2">
          {sorts.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSort(item.id)}
              className={cn(
                "h-9 rounded-lg border px-3.5 text-[13px] font-semibold transition-colors",
                sort === item.id
                  ? "border-[#0F766E] bg-[#eaf2ff] text-[#0F766E]"
                  : "border-[#F0FDFA] bg-white text-[#0F766E] hover:bg-[#f2f7ff]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="relative flex items-center gap-3">
          <p className="text-[14px] font-semibold text-[#1a1d26]">{list.length} ta mahsulot</p>
          <button
            type="button"
            onClick={() => setPanel((v) => !v)}
            className="flex h-9 items-center gap-2 rounded-lg border border-[#e6eaf2] bg-white px-3.5 text-[13px] font-semibold text-[#1a1d26] hover:border-[#0F766E]/50"
          >
            <SlidersHorizontal className="size-4" />
            Filtrlar
            {chips.length ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-[#0F766E] text-[11px] text-white">{chips.length}</span>
            ) : null}
          </button>
          {panel ? (
            <div className="absolute top-[calc(100%+6px)] right-0 z-30 w-72 rounded-xl border border-[#e6eaf2] bg-white p-3 shadow-[0_12px_32px_rgba(17, 24, 39, 0.14)]">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[13px] font-bold text-[#1a1d26]">Tanlangan filtrlar</p>
                <button type="button" onClick={() => setPanel(false)} aria-label="Yopish" className="text-[#8b93a7]">
                  <X className="size-4" />
                </button>
              </div>
              {chips.length ? (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {chips.map((chip) => (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={chip.clear}
                        className="inline-flex items-center gap-1 rounded-full bg-[#eaf2ff] px-2.5 py-1 text-[12px] font-semibold text-[#0F766E]"
                      >
                        {chip.label}
                        <X className="size-3" />
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={reset} className="mt-3 text-[13px] font-semibold text-[#8b93a7] hover:underline">
                    Filtrlarni tozalash
                  </button>
                </>
              ) : (
                <p className="text-[13px] text-[#8b93a7]">Hozircha filtr tanlanmagan. Yuqoridagi ro‘yxatlardan foydalaning.</p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Grid */}
      <section className="mt-4">
        {list.length === 0 ? (
          <div className="rounded-[14px] border border-[#eceff5] bg-white px-6 py-16 text-center text-[#8b93a7]">
            Bu filtrlar bo‘yicha forma yo‘q.{" "}
            <button type="button" onClick={reset} className="font-semibold text-[#0F766E] hover:underline">
              Filtrlarni tozalash
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 xl:grid-cols-4">
            {list.map((product) => (
              <FormaProductCard
                key={product.id}
                product={product}
                presetSize={size || undefined}
                presetColor={color || undefined}
              />
            ))}
          </div>
        )}
      </section>

      {/* Embroidery banner */}
      <section className="mt-8 overflow-hidden rounded-[20px] bg-[#eef4ff] px-6 py-5">
        <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#1a1d26]">Klinika logotipi embroidery buyurtma</h2>
            <p className="mt-1 max-w-xl text-sm text-[#4b5568]">
              Forma va kiyimlarga klinikingiz logotipi yoki nomi tikib beriladi
            </p>
            <button
              type="button"
              onClick={onEmbroidery}
              className={cn(buttonVariants({ variant: "link" }), "mt-2 h-auto px-0 text-primary")}
            >
              Embroidery buyurtma
              <ArrowRight className="size-4" />
            </button>
          </div>
          <Image
            src="/images/forma-embroidery.png"
            alt="Logotip tikilgan oq va ko‘k forma"
            width={360}
            height={160}
            className="h-[120px] w-[280px] rounded-2xl bg-white object-contain p-2"
          />
        </div>
      </section>
    </div>
  );
}
