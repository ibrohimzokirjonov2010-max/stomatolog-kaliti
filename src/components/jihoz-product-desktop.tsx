"use client";

import { RichText } from "@/components/rich-text";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  BatteryCharging,
  Cable,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Droplets,
  Gauge,
  Headset,
  Heart,
  Layers,
  MapPin,
  Minus,
  Monitor,
  Package,
  Phone,
  Play,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Star,
  Sun,
  Target,
  Thermometer,
  Timer,
  Truck,
  Volume2,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { ProductCard } from "@/components/product-card";
import { SafeProductImage } from "@/components/safe-product-image";
import { jihozInfo, jihozType, type JihozIcon } from "@/data/jihoz";
import { getProductDetails, productMaxQty, sellerGallery } from "@/data/product-details";
import { productCity, productCondition, productOldPrice, products, conditionLabels, type Product } from "@/data/products";
import { productShop, shopHref } from "@/data/shops";
import { site } from "@/data/site";
import { formatMoney } from "@/lib/format";
import { ProductReviewsList, useProductReviews } from "@/components/product-reviews";
import { cn } from "@/lib/utils";

type TabId = "tavsif" | "xususiyatlar" | "klinik" | "komplekt" | "yetkazib" | "sharhlar";

const icons: Record<JihozIcon, LucideIcon> = {
  target: Target,
  display: Monitor,
  droplets: Droplets,
  battery: BatteryCharging,
  volume: Volume2,
  gauge: Gauge,
  zap: Zap,
  shield: ShieldCheck,
  wrench: Wrench,
  cable: Cable,
  package: Package,
  sun: Sun,
  thermo: Thermometer,
  timer: Timer,
  smartphone: Smartphone,
  layers: Layers,
};

function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[#f5b400]">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(size, i <= Math.round(value) ? "fill-current" : "fill-none text-[#d7dbe7]")} />
      ))}
    </span>
  );
}

function DimsDrawing({ dims }: { dims: [number, number, number] }) {
  const [w, h, d] = dims;
  return (
    <svg viewBox="0 0 360 230" className="h-[230px] w-full" fill="none" aria-label="Qurilma o‘lchamlari chizmasi">
      <g stroke="#0B1F4D" strokeWidth="2" strokeLinejoin="round" fill="#f4f8ff">
        <path d="M70 70 H250 V170 H70 Z" />
        <path d="M70 70 L110 40 H290 L250 70" />
        <path d="M250 70 L290 40 V140 L250 170" />
        <rect x="92" y="88" width="90" height="56" rx="6" fill="#dbe9ff" />
        <circle cx="212" cy="116" r="12" fill="#fff" />
      </g>
      <g stroke="#0066FF" strokeWidth="1.6">
        <path d="M70 192 H250" />
        <path d="M70 186 V198 M250 186 V198" />
        <path d="M312 40 V140" />
        <path d="M306 40 H318 M306 140 H318" />
        <path d="M262 190 L292 170" />
      </g>
      <g fontSize="13" fontWeight="700" fill="#0066FF" textAnchor="middle">
        <text x="160" y="214">{w} mm</text>
        <text x="338" y="94">{h} mm</text>
        <text x="296" y="190">{d} mm</text>
      </g>
    </svg>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[16px] font-bold text-[#0B1F4D]">{children}</h3>;
}

export function JihozProductDesktop({ product }: { product: Product }) {
  const cart = useCart();
  const favorites = useFavorites();
  const liked = favorites.has(product.id);
  const details = getProductDetails(product);
  const rv = useProductReviews(product.id);
  const info = jihozInfo[jihozType(product)];
  const shop = productShop(product);
  const sellerName = shop?.name ?? product.shopName ?? "StomaHub Market";
  const oldPrice = productOldPrice(product);
  const maxQty = productMaxQty(product);
  const condition = productCondition(product);

  const seller = Boolean(product.listedBySeller);
  const gallery = useMemo(
    () =>
      product.listedBySeller
        ? sellerGallery(product)
        : [...new Set([product.image, "/images/product-unit.png", "/images/video-dentist-thumb.png"])],
    [product],
  );
  const [active, setActive] = useState(0);
  const [video, setVideo] = useState(false);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<TabId>("tavsif");
  const [added, setAdded] = useState(false);

  const stockText = product.inStock
    ? details.stockQty >= 20
      ? "Omborda 20+"
      : `Omborda ${details.stockQty}`
    : "Buyurtma asosida";

  const specRows: [string, string][] = [
    ["Brend", product.brand],
    ["Holati", conditionLabels[condition]],
    ...info.specs,
  ];

  const related = useMemo(
    () => products.filter((p) => p.category === "jihozlar" && p.id !== product.id).slice(0, 4),
    [product.id],
  );

  function add() {
    cart.add(product.id, product.listedBySeller ? product : undefined, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "tavsif", label: "Tavsif" },
    { id: "xususiyatlar", label: "Xususiyatlar" },
    { id: "klinik", label: "Klinik qo‘llanish" },
    { id: "komplekt", label: "Komplekt" },
    { id: "yetkazib", label: "Yetkazib berish" },
    { id: "sharhlar", label: `Sharhlar (${rv.count})` },
  ];

  const show = (id: TabId) => tab === "tavsif" || tab === id;

  const featuresBlock = (
    <div>
      <SectionTitle>Asosiy xususiyatlar</SectionTitle>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {info.features.map((f) => {
          const Icon = icons[f.icon];
          return (
            <div key={f.title} className="flex items-start gap-3 rounded-xl bg-[#f5f8ff] p-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#0066FF] shadow-sm">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-[13px] leading-tight font-semibold text-[#0B1F4D]">{f.title}</p>
                <p className="mt-0.5 text-[11.5px] leading-tight text-[#6b7280]">{f.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const usageBlock = (
    <div>
      <SectionTitle>Klinik qo‘llanish</SectionTitle>
      <ul className="mt-3 space-y-2">
        {info.usage.map((u) => (
          <li key={u} className="flex gap-2 text-[14px] text-[#4b5568]">
            <Check className="mt-0.5 size-4 shrink-0 text-[#16a34a]" strokeWidth={2.6} />
            {u}
          </li>
        ))}
      </ul>
    </div>
  );

  const specsBlock = (
    <div>
      <SectionTitle>Texnik xususiyatlar</SectionTitle>
      <dl className="mt-3 grid grid-cols-2 gap-x-10">
        {specRows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-[#f0f2f7] py-2.5 text-[13.5px]">
            <dt className="text-[#8b93a7]">{k}</dt>
            <dd className="text-right font-medium text-[#1a1d26]">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[11.5px] text-[#8b93a7]">
        Qiymatlar mahsulot turi bo‘yicha namunaviy. Aniq ma’lumot uchun sotuvchi yoki ishlab chiqaruvchi spetsifikatsiyasini tekshiring.
      </p>
    </div>
  );

  const kitBlock = (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8">
      <div>
        <SectionTitle>Komplekt</SectionTitle>
        <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5">
          {info.kit.map((k, i) => {
            const Icon = icons[k.icon];
            return (
              <li key={`${k.label}-${i}`} className="flex items-center gap-2.5 text-[13.5px] text-[#2b3447]">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#eaf2ff] text-[#0066FF]">
                  <Icon className="size-4" />
                </span>
                {k.label}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[11.5px] text-[#8b93a7]">Komplekt namunaviy; aniq tarkibni sotuvchidan so‘rang.</p>
      </div>
      <div>
        <SectionTitle>O‘lcham va rasm</SectionTitle>
        <div className="mt-3 rounded-xl bg-[#f5f8ff] p-3">
          <DimsDrawing dims={info.dims} />
          <p className="text-center text-[11px] text-[#8b93a7]">Namunaviy chizma va o‘lchamlar</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap items-center gap-1 text-[12.5px] text-[#8b93a7]">
        <Link href="/" className="hover:text-[#0066FF]">Bosh sahifa</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/marketplace" className="hover:text-[#0066FF]">Marketplace</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/jihozlar" className="hover:text-[#0066FF]">Jihozlar</Link>
        <ChevronRight className="size-3.5" />
        <span className="line-clamp-1 text-[#4b5568]">{product.name}</span>
      </nav>

      <section className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] items-start gap-8">
        {/* Gallery */}
        <div className="flex gap-3">
          <div className="flex max-h-[560px] flex-col gap-2.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {gallery.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => { setActive(i); setVideo(false); }}
                aria-label={`Rasm ${i + 1}`}
                className={cn(
                  "relative size-[76px] shrink-0 overflow-hidden rounded-xl border-2 bg-[#f7f8fb]",
                  i === active && !video ? "border-[#0066FF]" : "border-[#eceff5] hover:border-[#bcd5ff]",
                )}
              >
                <SafeProductImage src={src} alt="" category="jihozlar" fill sizes="76px" className="object-contain p-1 mix-blend-multiply" />
              </button>
            ))}
          </div>
          <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-[#eceff5] bg-[#f7f8fb]">
            <button
              type="button"
              onClick={() => favorites.toggle(product.id)}
              aria-label="Sevimlilarga"
              aria-pressed={liked}
              className="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-white text-[#8b93a7] shadow-sm hover:text-[#f43f5e]"
            >
              <Heart className={cn("size-4.5", liked && "fill-[#f43f5e] text-[#f43f5e]")} />
            </button>
            <div className="relative aspect-square w-full">
              <SafeProductImage
                src={gallery[active] ?? product.image}
                alt={product.name}
                category="jihozlar"
                fill
                priority
                sizes="560px"
                className={cn(active === 0 || seller ? "object-contain p-8 mix-blend-multiply" : "object-cover")}
              />
            </div>
            {gallery.length > 1 ? (
              <>
            <button
              type="button"
              aria-label="Oldingi rasm"
              onClick={() => { setActive((active - 1 + gallery.length) % gallery.length); setVideo(false); }}
              className="absolute top-1/2 left-3 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#0B1F4D] shadow-md"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Keyingi rasm"
              onClick={() => { setActive((active + 1) % gallery.length); setVideo(false); }}
              className="absolute top-1/2 right-3 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#0B1F4D] shadow-md"
            >
              <ChevronRight className="size-5" />
            </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => setVideo(true)}
              className="absolute bottom-3 left-3 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-semibold text-[#0B1F4D] shadow-md hover:text-[#0066FF]"
            >
              <span className="grid size-6 place-items-center rounded-full bg-[#0066FF] text-white">
                <Play className="size-3 fill-white" />
              </span>
              Videoni ko‘rish
            </button>
            {video ? (
              <div className="absolute inset-0 z-20 grid place-items-center bg-[#0B1F4D]/85 p-6 text-center text-white">
                <button type="button" onClick={() => setVideo(false)} aria-label="Yopish" className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/15 hover:bg-white/25">
                  <X className="size-5" />
                </button>
                <div>
                  <span className="mx-auto grid size-16 place-items-center rounded-full bg-white/20">
                    <Play className="size-7 fill-white" />
                  </span>
                  <p className="mt-4 text-[16px] font-bold">Mahsulot videosi hozircha yuklanmagan</p>
                  <p className="mt-1 text-[13px] text-white/80">Video sharh uchun «Maslahat olish» tugmasi orqali bog‘laning.</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#e6f7ee] px-2.5 py-1 text-[12px] leading-none font-semibold text-[#16a34a]">{conditionLabels[condition]}</span>
            {details.officialImport ? (
              <span className="rounded-md bg-[#eaf2ff] px-2.5 py-1 text-[12px] leading-none font-semibold text-[#0066FF]">Rasmiy import</span>
            ) : null}
            {details.certified ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-[#bcd5ff] bg-white px-2.5 py-[3px] text-[12px] leading-none font-semibold text-[#0066FF]">
                <BadgeCheck className="size-3.5" />
                Sertifikat
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 text-[28px] leading-tight font-bold tracking-tight text-[#0B1F4D]">{product.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px]">
            <span className="inline-flex items-center gap-1 text-[13px] font-extrabold tracking-wide text-[#0B1F4D] uppercase">
              {product.brand}
              <BadgeCheck className="size-4 fill-[#0066FF] text-white" />
            </span>
            {rv.count > 0 && rv.avg != null ? (
              <>
                <Stars value={rv.avg} />
                <span className="font-semibold text-[#1a1d26]">{rv.avg.toFixed(1)}</span>
              </>
            ) : null}
            <button type="button" onClick={() => setTab("sharhlar")} className="text-[#0066FF] hover:underline">
              {rv.count > 0 ? `${rv.count} ta sharh` : "Hali sharh yo‘q"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <p className="text-[34px] leading-none font-extrabold text-[#0B1F4D]">{formatMoney(product.price, "UZS")}</p>
            {oldPrice ? <p className="text-[16px] text-[#9aa3b2] line-through">{formatMoney(oldPrice, "UZS")}</p> : null}
            {product.discount ? (
              <span className="rounded-md bg-[#fee2e2] px-2 py-1 text-[12px] font-bold text-[#ef4444]">-{product.discount}%</span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#e6f7ee] px-3 py-1.5 text-[12.5px] font-semibold text-[#16a34a]">
              <Check className="size-4" strokeWidth={2.6} />
              {stockText}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#eaf2ff] px-3 py-1.5 text-[12.5px] font-semibold text-[#0066FF]">
              <Truck className="size-4" />
              {product.delivery}
            </span>
            {details.officialImport ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f1f4fa] px-3 py-1.5 text-[12.5px] font-semibold text-[#4b5568]">
                <ShieldCheck className="size-4" />
                Rasmiy import
              </span>
            ) : null}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-12 items-center rounded-xl border border-[#e6eaf2] bg-white">
              <button type="button" aria-label="Kamaytirish" onClick={() => setQty((v) => Math.max(1, v - 1))} className="grid size-11 place-items-center text-[#4b5568]">
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center text-[15px] font-semibold">{qty}</span>
              <button type="button" aria-label="Ko‘paytirish" onClick={() => setQty((v) => Math.min(maxQty, v + 1))} className="grid size-11 place-items-center text-[#4b5568]">
                <Plus className="size-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={add}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0066FF] text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(0,102,255,0.28)] hover:bg-[#0058dd]"
            >
              {added ? <Check className="size-5" /> : <ShoppingCart className="size-5" />}
              {added ? "Savatga qo‘shildi" : "Savatga qo‘shish"}
            </button>
          </div>

          <div className="mt-2.5 flex gap-2.5">
            <a
              href={site.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#0066FF] text-[14px] font-semibold text-[#0066FF] hover:bg-[#f2f7ff]"
            >
              <Headset className="size-4.5" />
              Maslahat olish
            </a>
            <a
              href={site.phoneHref}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#e6eaf2] px-4 text-[13.5px] font-semibold text-[#2b3447] hover:border-[#0066FF]/50"
            >
              <Phone className="size-4 text-[#0066FF]" />
              {site.phoneDisplay}
            </a>
          </div>

          {/* Seller */}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#eceff5] bg-[#fafbfd] p-3">
            <Image src="/images/clinic/logo-tooth.png" alt="" width={44} height={44} className="size-11 shrink-0 rounded-full bg-[#e8f1ff] object-contain p-1.5" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="flex items-center gap-1 text-[14px] font-bold text-[#1a1d26]">
                <span className="truncate">{sellerName}</span>
                <BadgeCheck className="size-4 shrink-0 fill-[#0066FF] text-white" />
                <span className="text-[11.5px] font-medium text-[#16a34a]">Tasdiqlangan</span>
              </p>
              <p className="mt-1 flex items-center gap-1 text-[12px] text-[#8b93a7]">
                {rv.count > 0 && rv.avg != null ? (
                  <>
                    <Star className="size-3.5 fill-[#f5b942] text-[#f5b942]" />
                    <span className="font-semibold text-[#1a1d26]">{rv.avg.toFixed(1)}</span>
                    <span>· {rv.count} sharh</span>
                  </>
                ) : null}
                <MapPin className={cn("size-3.5", rv.count > 0 && "ml-1")} />
                {productCity(product)}
              </p>
            </div>
            {shop ? (
              <Link href={shopHref(shop.slug)} className="inline-flex h-9 items-center rounded-lg border border-[#dbe7ff] bg-white px-4 text-[13px] font-semibold text-[#0066FF] hover:bg-[#f3f8ff]">
                Do‘konni ko‘rish
              </Link>
            ) : null}
          </div>

          {/* Trust */}
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {[
              { icon: ShieldCheck, title: "Sotuvchi kafolati", sub: "Muddati sotuvchi bilan kelishiladi" },
              { icon: Wrench, title: "Texnik yordam", sub: "Ishga tushirish bo‘yicha maslahat" },
              { icon: Clock, title: "Servis bo‘yicha maslahat", sub: "Savollar uchun bog‘laning" },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-start gap-2 rounded-xl bg-[#f5f8ff] p-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-[#0066FF]" />
                <div>
                  <p className="text-[12.5px] leading-tight font-semibold text-[#0B1F4D]">{title}</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-[#6b7280]">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="rounded-2xl border border-[#eceff5] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
        <div className="flex gap-7 overflow-x-auto border-b border-[#eceff5] px-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "-mb-px shrink-0 border-b-2 py-4 text-[14px] font-semibold",
                tab === t.id ? "border-[#0066FF] text-[#0066FF]" : "border-transparent text-[#4b5568] hover:text-[#0066FF]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-7 p-6">
          {tab === "tavsif" ? (
            <div>
              <SectionTitle>Mahsulot tavsifi</SectionTitle>
              <RichText text={details.description} className="mt-2 max-w-4xl text-[14px] leading-relaxed text-[#4b5568]" />
            </div>
          ) : null}
          {show("tavsif") && tab === "tavsif" ? featuresBlock : null}
          {tab === "xususiyatlar" ? (
            <>
              {featuresBlock}
              {specsBlock}
            </>
          ) : null}
          {tab === "tavsif" ? (
            <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-10">
              {usageBlock}
              {specsBlock}
            </div>
          ) : null}
          {tab === "klinik" ? usageBlock : null}
          {tab === "tavsif" || tab === "komplekt" ? kitBlock : null}
          {tab === "yetkazib" ? (
            <div className="max-w-2xl space-y-3 text-[14px] text-[#4b5568]">
              <p>{details.delivery}</p>
              <ul className="space-y-2">
                <li className="flex gap-2"><Truck className="mt-0.5 size-4 shrink-0 text-[#0066FF]" />{product.delivery}</li>
                <li className="flex gap-2"><Package className="mt-0.5 size-4 shrink-0 text-[#0066FF]" />Viloyatlarga 2–3 ish kuni</li>
                <li className="flex gap-2"><Clock className="mt-0.5 size-4 shrink-0 text-[#0066FF]" />Buyurtma 16:00 gacha berilsa, shu kuni jo‘natiladi</li>
              </ul>
            </div>
          ) : null}
          {tab === "sharhlar" ? <ProductReviewsList data={rv} columns={3} /> : null}
        </div>
      </section>

      {related.length ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-[#0B1F4D]">O‘xshash mahsulotlar</h2>
            <Link href="/jihozlar" className="text-[13px] font-semibold text-[#0066FF] hover:underline">Barchasini ko‘rish</Link>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} variant="market" />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
