"use client";

import { RichText } from "@/components/rich-text";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Heart,
  Minus,
  Play,
  Plus,
  Shield,
  ShoppingCart,
  Star,
  Thermometer,
  Truck,
  Wind,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { FormaProductCard } from "@/components/forma-product-card";
import {
  apparelReady,
  clothingSizes,
  colorLabel,
  defaultApparelColor,
  defaultApparelSize,
  formaColors,
  formaMaterial,
  formaProducts,
  formaSku,
  isBestseller,
  isNewForma,
  stockLabel,
} from "@/data/forma";
import { getProductDetails, productMaxQty, sellerGallery } from "@/data/product-details";
import { productOldPrice, type Product } from "@/data/products";
import { formatMoney } from "@/lib/format";
import { ProductReviewsList, useProductReviews } from "@/components/product-reviews";
import { cn } from "@/lib/utils";

type TabId = "tavsif" | "xususiyatlar" | "olcham" | "yetkazib" | "sharhlar";
type ChartId = "ayol" | "erkak" | "unisex";

const kindImages: Record<string, string[]> = {
  scrub: ["/images/forma-scrub.png", "/images/forma-stack.png", "/images/forma-embroidery.png"],
  xalat: ["/images/forma-coat.png", "/images/forma-banner-doctor.png", "/images/forma-embroidery.png"],
  qalpoq: ["/images/forma-cap.png", "/images/forma-scrub.png", "/images/forma-stack.png"],
  poyabzal: ["/images/forma-shoes.png", "/images/forma-stack.png", "/images/forma-scrub.png"],
};

const charts: Record<ChartId, { label: string; rows: { size: string; chest: string; waist: string; height: string }[] }> = {
  ayol: {
    label: "Ayollar forma",
    rows: [
      { size: "S", chest: "84–88", waist: "66–70", height: "155–162" },
      { size: "M", chest: "88–92", waist: "70–74", height: "160–168" },
      { size: "L", chest: "92–98", waist: "74–80", height: "165–172" },
      { size: "XL", chest: "98–104", waist: "80–86", height: "168–175" },
      { size: "XXL", chest: "104–110", waist: "86–92", height: "170–178" },
    ],
  },
  erkak: {
    label: "Erkaklar forma",
    rows: [
      { size: "S", chest: "92–96", waist: "78–82", height: "165–172" },
      { size: "M", chest: "96–102", waist: "82–88", height: "170–177" },
      { size: "L", chest: "102–108", waist: "88–94", height: "175–182" },
      { size: "XL", chest: "108–114", waist: "94–100", height: "180–187" },
      { size: "XXL", chest: "114–120", waist: "100–106", height: "184–192" },
    ],
  },
  unisex: {
    label: "Unisex",
    rows: [
      { size: "S", chest: "88–92", waist: "72–76", height: "160–168" },
      { size: "M", chest: "92–98", waist: "76–82", height: "165–174" },
      { size: "L", chest: "98–104", waist: "82–88", height: "170–179" },
      { size: "XL", chest: "104–110", waist: "88–94", height: "174–184" },
      { size: "XXL", chest: "110–116", waist: "94–100", height: "178–188" },
    ],
  },
};

const features: { icon: LucideIcon; title: string; sub: string }[] = [
  { icon: Wind, title: "Nafas oluvchi mato", sub: "Havo o‘tkazuvchan" },
  { icon: Droplets, title: "Tez quriydi", sub: "Yengil parvarish" },
  { icon: Zap, title: "Antistatik", sub: "Qulay kiyim" },
  { icon: Shield, title: "Bardoshli mato", sub: "Ko‘p yuvishga chidamli" },
  { icon: Thermometer, title: "Qulay kesim", sub: "Harakatni cheklamaydi" },
];

function ScrubDiagram() {
  return (
    <svg viewBox="0 0 320 300" className="h-[250px] w-full" fill="none" aria-label="Scrub ko‘ylak chizmasi">
      <g stroke="#111827" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="#f4f8ff">
        <path d="M118 36 L88 48 L40 86 L62 128 L92 108 L92 252 Q160 262 228 252 L228 108 L258 128 L280 86 L232 48 L202 36 Q160 74 118 36 Z" />
        <path d="M118 36 Q160 74 202 36" fill="none" />
        <rect x="190" y="150" width="26" height="34" rx="3" fill="none" />
        <path d="M92 108 L62 128" fill="none" />
      </g>
      <g stroke="#0F766E" strokeWidth="1.8" strokeDasharray="5 4">
        <path d="M92 100 H228" />
        <path d="M92 190 H228" />
        <path d="M290 36 V252" />
      </g>
      {[
        { x: 160, y: 100, t: "A" },
        { x: 160, y: 190, t: "B" },
        { x: 290, y: 144, t: "C" },
      ].map((m) => (
        <g key={m.t}>
          <circle cx={m.x} cy={m.y} r="12" fill="#0F766E" />
          <text x={m.x} y={m.y + 4.5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">
            {m.t}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn("size-4", className, i <= Math.round(value) ? "fill-[#f5b942] text-[#f5b942]" : "fill-[#e5e9f2] text-[#e5e9f2]")}
        />
      ))}
    </span>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-[16px] font-bold text-[#111827]">{title}</h3>
      {children}
    </div>
  );
}

export function FormaProductDesktop({ product }: { product: Product }) {
  const router = useRouter();
  const cart = useCart();
  const favorites = useFavorites();
  const liked = favorites.has(product.id);
  const details = getProductDetails(product);
  const rv = useProductReviews(product.id);
  const material = formaMaterial(product);
  /** Seller-listed products carry only what the seller entered — no invented material/feature copy. */
  const own = Boolean(product.listedBySeller);
  const oldPrice = productOldPrice(product);
  const maxQty = productMaxQty(product);
  const kind = product.kind ?? "scrub";

  const gallery = useMemo(() => {
    // seller products: only the seller's own photos (all of them, in order)
    if (product.listedBySeller) return sellerGallery(product);
    const list = [product.image, ...(kindImages[kind] ?? kindImages.scrub)];
    return [...new Set(list)].slice(0, 5);
  }, [product, kind]);

  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState(defaultApparelSize(product));
  const [color, setColor] = useState(defaultApparelColor(product));
  const [tab, setTab] = useState<TabId>("tavsif");
  const [chart, setChart] = useState<ChartId>(
    product.gender === "ayol" ? "ayol" : product.gender === "erkak" ? "erkak" : "unisex",
  );
  const [chartOpen, setChartOpen] = useState(true);
  const [error, setError] = useState("");

  const related = useMemo(
    () => formaProducts.filter((item) => item.id !== product.id && item.kind === product.kind).slice(0, 4),
    [product],
  );

  const badge = isBestseller(product)
    ? { text: "Bestseller", cls: "bg-[#0F766E]" }
    : product.discount
      ? { text: `-${product.discount}%`, cls: "bg-[#ef4444]" }
      : isNewForma(product)
        ? { text: "Yangi", cls: "bg-[#16a34a]" }
        : null;

  const sizes = product.sizes ?? [];
  const colors = product.colors ?? [];
  const showChart = sizes.some((s) => clothingSizes.includes(s as (typeof clothingSizes)[number]));

  function add(): boolean {
    if (!apparelReady(product, size, color)) {
      setError("Savatga qo‘shishdan oldin o‘lcham va rangni tanlang.");
      return false;
    }
    setError("");
    cart.add(product.id, product.listedBySeller ? product : undefined, qty, {
      size: size || undefined,
      color: color || undefined,
    });
    return true;
  }

  function openSizeChart() {
    setTab("olcham");
    setChartOpen(true);
    document.getElementById("olcham-jadvali")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "tavsif", label: "Tavsif" },
    { id: "xususiyatlar", label: "Xususiyatlar" },
    ...(showChart ? [{ id: "olcham" as TabId, label: "O‘lcham jadvali" }] : []),
    { id: "yetkazib", label: "Yetkazib berish" },
    { id: "sharhlar", label: `Sharhlar (${rv.count})` },
  ];

  const thumbBtn = (src: string, i: number) => (
    <button
      key={`${src}-${i}`}
      type="button"
      onClick={() => setActive(i)}
      aria-label={`Rasm ${i + 1}`}
      className={cn(
        "size-[76px] shrink-0 overflow-hidden rounded-xl border-2 bg-[#f7f8fb]",
        i === active ? "border-[#0F766E]" : "border-[#eceff5] hover:border-[#CCFBF1]",
      )}
    >
      <Image src={src} alt="" width={152} height={152} className="size-full object-cover" />
    </button>
  );

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap items-center gap-1 text-[12.5px] text-[#8b93a7]">
        <Link href="/" className="hover:text-[#0F766E]">Bosh sahifa</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/forma" className="hover:text-[#0F766E]">Forma</Link>
        <ChevronRight className="size-3.5" />
        <span className="line-clamp-1 text-[#4b5568]">{product.name}</span>
      </nav>

      <section className="grid grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] items-start gap-8">
        {/* Gallery */}
        <div className="flex gap-3">
          <div className="flex max-h-[600px] flex-col gap-2.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{gallery.map((src, i) => thumbBtn(src, i))}</div>
          <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-[#eceff5] bg-[#f7f8fb]">
            {badge ? (
              <span className={cn("absolute top-3 left-3 z-10 rounded-md px-2.5 py-1 text-[12px] leading-none font-bold text-white", badge.cls)}>
                {badge.text}
              </span>
            ) : null}
            <Image
              src={gallery[active] ?? product.image}
              alt={product.name}
              width={900}
              height={900}
              priority
              className="aspect-square w-full object-cover"
            />
            {gallery.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Oldingi rasm"
                  onClick={() => setActive((active - 1 + gallery.length) % gallery.length)}
                  className="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#111827] shadow-md hover:bg-white"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="Keyingi rasm"
                  onClick={() => setActive((active + 1) % gallery.length)}
                  className="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#111827] shadow-md hover:bg-white"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1 text-[13px] font-extrabold tracking-wide text-[#111827] uppercase">
            {product.brand}
            <BadgeCheck className="size-4 fill-[#0F766E] text-white" />
          </p>
          <h1 className="mt-1 text-[28px] leading-tight font-bold tracking-tight text-[#111827]">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-[13px]">
            {rv.count > 0 && rv.avg != null ? (
              <>
                <Stars value={rv.avg} />
                <span className="font-semibold text-[#1a1d26]">{rv.avg.toFixed(1)}</span>
              </>
            ) : null}
            <button type="button" onClick={() => setTab("sharhlar")} className="text-[#0F766E] hover:underline">
              {rv.count > 0 ? `Sharhlarni ko‘rish (${rv.count})` : "Hali sharh yo‘q"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <p className="text-[34px] leading-none font-extrabold text-[#111827]">{formatMoney(product.price, "UZS")}</p>
            {oldPrice ? <p className="text-[16px] text-[#9aa3b2] line-through">{formatMoney(oldPrice, "UZS")}</p> : null}
            {product.discount ? (
              <span className="rounded-md bg-[#fee2e2] px-2 py-1 text-[12px] font-bold text-[#ef4444]">-{product.discount}%</span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#e6f7ee] px-3 py-1.5 text-[12.5px] font-semibold text-[#16a34a]">
              <Check className="size-4" strokeWidth={2.6} />
              {stockLabel(product)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#eaf2ff] px-3 py-1.5 text-[12.5px] font-semibold text-[#0F766E]">
              <Truck className="size-4" />
              {product.delivery || "Toshkent 24 soat"}
            </span>
          </div>

          <p className="mt-3 text-[13px] text-[#6b7280]">
            Artikul: <span className="font-semibold text-[#1a1d26]">{formaSku(product)}</span>
            {own ? null : (
              <>
                <span className="mx-2 text-[#d4dae6]">|</span>
                <Link href="/forma" className="font-semibold text-[#0F766E] hover:underline">
                  Klinika uchun ham mos
                </Link>
              </>
            )}
          </p>

          <hr className="my-4 border-[#eceff5]" />

          {colors.length ? (
            <div>
              <p className="text-[14px] font-semibold text-[#1a1d26]">
                Rang: <span className="font-medium text-[#4b5568]">{color ? colorLabel(color) : "tanlang"}</span>
              </p>
              <div className="mt-2 flex items-center gap-2.5">
                {colors.map((id) => {
                  const on = color === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { setColor(id); setError(""); }}
                      title={colorLabel(id)}
                      aria-label={colorLabel(id)}
                      aria-pressed={on}
                      className={cn(
                        "size-9 rounded-full border-2 border-white shadow-[0_0_0_1px_#d4dae6]",
                        on && "shadow-[0_0_0_2px_#0F766E]",
                      )}
                      style={{ backgroundColor: formaColors.find((c) => c.id === id)?.hex ?? "#cbd5e1" }}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          {sizes.length ? (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold text-[#1a1d26]">
                  O‘lcham: <span className="font-medium text-[#4b5568]">{size || "tanlang"}</span>
                </p>
                {showChart ? (
                  <button type="button" onClick={openSizeChart} className="text-[13px] font-semibold text-[#0F766E] hover:underline">
                    O‘lcham jadvali
                  </button>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((item) => {
                  const on = size === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => { setSize(item); setError(""); }}
                      aria-pressed={on}
                      className={cn(
                        "h-11 min-w-14 rounded-lg border px-3 text-[14px] font-semibold transition-colors",
                        on ? "border-[#0F766E] bg-[#eaf2ff] text-[#0F766E]" : "border-[#e6eaf2] bg-white text-[#2b3447] hover:border-[#0F766E]/50",
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {error ? <p className="mt-3 text-[13px] font-medium text-[#ef4444]">{error}</p> : null}

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
              onClick={() => { add(); }}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0F766E] text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(15, 118, 110, 0.28)] hover:bg-[#115E59]"
            >
              <ShoppingCart className="size-5" />
              Savatga qo‘shish
            </button>
            <button
              type="button"
              onClick={() => favorites.toggle(product.id)}
              aria-label="Sevimlilarga"
              aria-pressed={liked}
              className="grid size-12 place-items-center rounded-xl border border-[#e6eaf2] bg-white text-[#8b93a7] hover:text-[#f43f5e]"
            >
              <Heart className={cn("size-5", liked && "fill-[#f43f5e] text-[#f43f5e]")} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => { if (add()) router.push("/buyurtma"); }}
            className="mt-2.5 h-11 w-full rounded-xl border border-[#0F766E] text-[14px] font-semibold text-[#0F766E] hover:bg-[#f2f7ff]"
          >
            Hozir sotib olish
          </button>
        </div>
      </section>

      {/* Tabs */}
      <section className="rounded-2xl border border-[#eceff5] bg-white shadow-[0_2px_10px_rgba(17, 24, 39, 0.04)]">
        <div className="flex gap-7 border-b border-[#eceff5] px-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "-mb-px border-b-2 py-4 text-[14px] font-semibold",
                tab === t.id ? "border-[#0F766E] text-[#0F766E]" : "border-transparent text-[#4b5568] hover:text-[#0F766E]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "tavsif" ? (
            <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-8">
              <div className="space-y-6">
                <Section title="Mahsulot tavsifi">
                  <RichText className="mt-2 text-[14px] leading-relaxed text-[#4b5568]" text={details.description || product.description || ""} />
                  {own ? null : (
                  <p className="mt-2 text-[14px] leading-relaxed text-[#4b5568]">
                    Klinika va shifoxona xodimlari uchun qulay kesim, kun bo‘yi kiyishga mos yengil mato va ko‘p yuvishga bardoshli tikuv.
                  </p>
                  )}
                </Section>
                {own ? null : (
                <Section title="Asosiy xususiyatlar">
                  <div className="mt-3 grid grid-cols-5 gap-3">
                    {features.map(({ icon: Icon, title, sub }) => (
                      <div key={title} className="flex flex-col items-center rounded-xl bg-[#f5f8ff] px-2 py-3 text-center">
                        <span className="grid size-10 place-items-center rounded-full bg-white text-[#0F766E] shadow-sm">
                          <Icon className="size-5" />
                        </span>
                        <p className="mt-2 text-[12px] leading-tight font-semibold text-[#111827]">{title}</p>
                        <p className="mt-0.5 text-[11px] leading-tight text-[#8b93a7]">{sub}</p>
                      </div>
                    ))}
                  </div>
                </Section>
                )}
              </div>
              {own ? null : (
              <div className="space-y-4">
                <Section title="Material tarkibi">
                  <div className="mt-3 rounded-xl bg-[#f5f8ff] p-4">
                    <p className="text-[18px] font-extrabold text-[#111827]">{material.composition}</p>
                    <p className="mt-1 text-[13px] text-[#6b7280]">Zichlik: {material.density}</p>
                  </div>
                </Section>
                <div className="relative overflow-hidden rounded-xl">
                  <Image src={gallery[1] ?? product.image} alt="Material tarkibi" width={560} height={300} className="h-[170px] w-full object-cover" />
                  <div className="absolute inset-0 grid place-items-center bg-[#111827]/25">
                    <span className="grid size-14 place-items-center rounded-full bg-white/95 text-[#0F766E] shadow-lg">
                      <Play className="size-6 fill-[#0F766E]" />
                    </span>
                  </div>
                  <span className="absolute bottom-2 left-3 rounded-md bg-white/95 px-2 py-1 text-[12px] font-semibold text-[#111827]">
                    Material tarkibi
                  </span>
                </div>
              </div>
              )}
            </div>
          ) : null}

          {tab === "xususiyatlar" ? (
            <dl className="grid max-w-3xl grid-cols-[200px_minmax(0,1fr)] gap-y-0 text-[14px]">
              {[
                ["Brend", product.brand],
                ["Tur", { scrub: "Scrub", xalat: "Xalat", qalpoq: "Qalpoq", poyabzal: "Poyabzal" }[kind] ?? kind],
                ["Jins", product.gender === "ayol" ? "Ayollar" : product.gender === "erkak" ? "Erkaklar" : "Unisex"],
                ...(own ? [] : [["Material", material.composition], ["Zichlik", material.density]]),
                ["O‘lchamlar", sizes.join(", ") || "—"],
                ["Ranglar", colors.map(colorLabel).join(", ") || "—"],
                ["Artikul", formaSku(product)],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="border-b border-[#f0f2f7] py-3 text-[#8b93a7]">{k}</dt>
                  <dd className="border-b border-[#f0f2f7] py-3 font-medium text-[#1a1d26]">{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {tab === "olcham" ? (
            <p className="text-[14px] text-[#4b5568]">
              Namunaviy standart o‘lchamlar quyida, «O‘lcham jadvali» bo‘limida ko‘rsatilgan. Aniq o‘lcham uchun ko‘krak, bel va bo‘yingizni o‘lchang.
            </p>
          ) : null}

          {tab === "yetkazib" ? (
            <div className="space-y-2 text-[14px] leading-relaxed text-[#4b5568]">
              <p className="flex items-center gap-2 font-semibold text-[#0F766E]">
                <Truck className="size-4" />
                {product.delivery || "Toshkent 24 soat"}
              </p>
              <p>{details.delivery}</p>
            </div>
          ) : null}

          {tab === "sharhlar" ? <ProductReviewsList data={rv} columns={1} /> : null}
        </div>
      </section>

      {/* Size chart */}
      {showChart && chartOpen ? (
        <section id="olcham-jadvali" className="scroll-mt-24 rounded-2xl border border-[#eceff5] bg-white p-6 shadow-[0_2px_10px_rgba(17, 24, 39, 0.04)]">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold text-[#111827]">O‘lcham jadvali</h2>
            <button type="button" onClick={() => setChartOpen(false)} aria-label="Yopish" className="grid size-8 place-items-center rounded-full text-[#8b93a7] hover:bg-slate-100">
              <X className="size-5" />
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            {(Object.keys(charts) as ChartId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setChart(id)}
                className={cn(
                  "h-10 rounded-lg border px-5 text-[14px] font-semibold",
                  chart === id ? "border-[#0F766E] bg-[#0F766E] text-white" : "border-[#e6eaf2] bg-white text-[#2b3447] hover:border-[#0F766E]/50",
                )}
              >
                {charts[id].label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-[320px_minmax(0,1fr)_320px] items-start gap-6">
            <div className="rounded-xl bg-[#f5f8ff] p-3">
              <ScrubDiagram />
              <p className="text-center text-[11px] text-[#8b93a7]">Chizma namuna sifatida berilgan</p>
            </div>

            <div>
              <div className="overflow-hidden rounded-xl border border-[#eceff5]">
                <table className="w-full text-center text-[14px]">
                  <thead className="bg-[#f5f8ff] text-[#111827]">
                    <tr>
                      <th className="py-3 font-bold">O‘lcham</th>
                      <th className="py-3 font-bold">A — Ko‘krak (sm)</th>
                      <th className="py-3 font-bold">B — Bel (sm)</th>
                      <th className="py-3 font-bold">C — Bo‘y (sm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {charts[chart].rows.map((row) => (
                      <tr key={row.size} className={cn("border-t border-[#eceff5]", size === row.size && "bg-[#eaf2ff]")}>
                        <td className="py-3 font-bold text-[#111827]">{row.size}</td>
                        <td className="py-3 text-[#4b5568]">{row.chest}</td>
                        <td className="py-3 text-[#4b5568]">{row.waist}</td>
                        <td className="py-3 text-[#4b5568]">{row.height}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[12px] text-[#8b93a7]">Standart namunaviy o‘lchamlar. Ishlab chiqaruvchiga qarab ±2 sm farq bo‘lishi mumkin.</p>
            </div>

            <div>
              <h3 className="text-[16px] font-bold text-[#111827]">Qanday o‘lchash kerak?</h3>
              <ol className="mt-3 space-y-3">
                {[
                  { t: "A", title: "Ko‘krak", text: "Ko‘krakning eng keng qismi bo‘ylab, qo‘lni pastga tushirib o‘lchang." },
                  { t: "B", title: "Bel", text: "Belning eng ingichka joyi bo‘ylab lentani gorizontal tutib o‘lchang." },
                  { t: "C", title: "Bo‘y", text: "Poyabzalsiz, tik turib, boshdan tovongacha bo‘lgan balandlikni o‘lchang." },
                ].map((step) => (
                  <li key={step.t} className="flex gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#0F766E] text-[13px] font-bold text-white">{step.t}</span>
                    <p className="text-[13px] leading-snug text-[#4b5568]">
                      <span className="font-semibold text-[#1a1d26]">{step.title}.</span> {step.text}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section>
          <h2 className="mb-3 text-[18px] font-bold text-[#111827]">O‘xshash mahsulotlar</h2>
          <div className="grid grid-cols-4 gap-4">
            {related.map((item) => (
              <FormaProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
