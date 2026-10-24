"use client";

import { RichText, stripRich } from "@/components/rich-text";

import { ContactSeller } from "@/components/contact-seller";
import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Heart,
  MapPin,
  Minus,
  Package,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { FormaProductCard } from "@/components/forma-product-card";
import { ProductCard } from "@/components/product-card";
import { SizeColorPickers } from "@/components/apparel-pickers";
import { apparelReady, defaultApparelColor, defaultApparelSize } from "@/data/forma";
import { getProductDetails, productMaxQty, relatedProducts } from "@/data/product-details";
import {
  categoryLabels,
  conditionLabels,
  marketGroups,
  productCity,
  productCondition,
  productGroup,
  productOldPrice,
  products,
  type Product,
} from "@/data/products";
import { productShop, shopHref } from "@/data/shops";
import { formatMoney } from "@/lib/format";
import { ProductReviewsList, useProductReviews } from "@/components/product-reviews";
import { cn } from "@/lib/utils";

type TabId = "tavsif" | "klinik" | "xususiyatlar" | "sertifikat" | "sharhlar" | "yetkazib";

const SHADES = ["A1", "A2", "A3", "A3.5", "B1", "B2"];

function hashOf(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.;])\s+/)
    .map((part) => part.trim().replace(/[.;]$/, ""))
    .filter(Boolean);
}

export function ProductDetailDesktop({ product }: { product: Product }) {
  const router = useRouter();
  const details = getProductDetails(product);
  const rv = useProductReviews(product.id);
  const shop = productShop(product);
  const cart = useCart();
  const favorites = useFavorites();
  const liked = favorites.has(product.id);
  const oldPrice = productOldPrice(product);
  const discount = product.discount ?? 0;
  const gallery = (details.gallery.length ? details.gallery : [product.image]).slice(0, 10);
  const maxQty = productMaxQty(product);
  const isForma = product.category === "forma";
  const group = productGroup(product);
  const condition = productCondition(product);
  const consumable = ["materiallar", "implantlar", "laboratoriya"].includes(product.category);

  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<TabId>("tavsif");
  const [size, setSize] = useState(defaultApparelSize(product));
  const [color, setColor] = useState(defaultApparelColor(product));
  const [pickError, setPickError] = useState("");

  const showShades = !isForma && group === "kompozit";
  const nameShade = product.name.match(/\b([A-D][1-4](?:\.5)?)\b/)?.[1];
  const [shade, setShade] = useState(nameShade ?? "A2");
  const volumeToken = !isForma
    ? product.name.match(/\d+(?:\.\d+)?\s?(?:g|ml|mm|sm)\b/i)?.[0]?.replace(/\s/g, "")
    : undefined;

  const seed = hashOf(product.id);
  const own = Boolean(product.listedBySeller);
  // Seller products show only what the seller really entered; sample-catalog products keep generated demo values.
  const expiry = own
    ? product.attrs?.expiryDate
      ? product.attrs.expiryDate.split("-").reverse().slice(1).join("/")
      : null
    : consumable
      ? `${String(1 + (seed % 12)).padStart(2, "0")}/${2028 + (seed % 2)}`
      : null;
  const lot = own
    ? product.attrs?.lot ?? null
    : `${product.brand.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "SK"}${24000 + (seed % 9000)}${(seed % 90) + 10}`;
  const stockText = product.inStock
    ? details.stockQty >= 20
      ? "Omborda 20+"
      : `Omborda ${details.stockQty}`
    : "Buyurtma asosida";
  const deliveryShort = product.delivery.replace(/^[^\s]+\s*/, "");

  const related = useMemo(() => {
    const base = relatedProducts(product).filter((item) => item.id !== product.id);
    const seen = new Set([product.id, ...base.map((item) => item.id)]);
    for (const item of products) {
      if (base.length >= 4) break;
      if (item.category === product.category && !seen.has(item.id)) {
        base.push(item);
        seen.add(item.id);
      }
    }
    return base.slice(0, 4);
  }, [product]);

  const groupLabel = marketGroups.find((g) => g.id === group)?.label ?? categoryLabels[product.category];
  const sellerName = shop?.name ?? product.shopName ?? null;

  function addToCart(): boolean {
    if (!apparelReady(product, size, color)) {
      setPickError("Savatga qo‘shishdan oldin o‘lcham va rangni tanlang.");
      return false;
    }
    cart.add(product.id, product.listedBySeller ? product : undefined, qty, {
      size: size || undefined,
      color: (showShades ? shade : color) || undefined,
    });
    return true;
  }

  function buyNow() {
    if (addToCart()) router.push("/buyurtma");
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "tavsif", label: "Tavsif" },
    { id: "klinik", label: "Klinik qo‘llanish" },
    { id: "xususiyatlar", label: "Texnik xususiyatlar" },
    { id: "sertifikat", label: "Sertifikat" },
    { id: "sharhlar", label: `Sharhlar (${rv.count})` },
    { id: "yetkazib", label: "Yetkazib berish" },
  ];

  const usageItems = splitSentences(details.usage);

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap items-center gap-1 text-[12.5px] text-[#8b93a7]">
        {isForma ? (
          <>
            <Link href="/forma" className="hover:text-[#0F766E]">Forma</Link>
          </>
        ) : (
          <>
            <Link href="/marketplace" className="hover:text-[#0F766E]">Marketplace</Link>
            <ChevronRight className="size-3.5" />
            <Link href={`/marketplace?cat=${product.category}`} className="hover:text-[#0F766E]">
              {categoryLabels[product.category]}
            </Link>
            <ChevronRight className="size-3.5" />
            <Link href={`/marketplace?cat=${group}`} className="hover:text-[#0F766E]">{groupLabel}</Link>
          </>
        )}
        <ChevronRight className="size-3.5" />
        <span className="line-clamp-1 text-[#4b5568]">{product.name}</span>
      </nav>

      <section className="grid grid-cols-[minmax(300px,0.9fr)_minmax(0,1.15fr)_minmax(260px,0.62fr)] items-start gap-4 min-[1400px]:gap-5">
        {/* ───── Gallery ───── */}
        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-xl border border-[#eceff5] bg-[#f7f8fb] shadow-[0_2px_10px_rgba(17, 24, 39, 0.04)]">
            <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-[#e6f7ee] px-2 py-1 text-[11px] leading-none font-semibold text-[#16a34a]">
                {conditionLabels[condition]}
              </span>
              {details.officialImport ? (
                <span className="rounded-md bg-[#eaf2ff] px-2 py-1 text-[11px] leading-none font-semibold text-[#0F766E]">
                  Original
                </span>
              ) : null}
              {details.certified ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-[#CCFBF1] bg-white px-2 py-[3px] text-[11px] leading-none font-semibold text-[#0F766E]">
                  <BadgeCheck className="size-3" />
                  Sertifikat mavjud
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => favorites.toggle(product.id)}
              aria-label="Sevimlilarga"
              aria-pressed={liked}
              className="absolute top-3 right-3 z-10 grid size-8 place-items-center rounded-full bg-white/95 text-[#8b93a7] shadow-sm hover:text-[#f43f5e]"
            >
              <Heart className={cn("size-4", liked && "fill-[#f43f5e] text-[#f43f5e]")} />
            </button>
            {gallery.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Oldingi rasm"
                  onClick={() => setActiveImage((i) => (i - 1 + gallery.length) % gallery.length)}
                  className="absolute top-1/2 left-2.5 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#4b5568] shadow-sm hover:text-[#0F766E]"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Keyingi rasm"
                  onClick={() => setActiveImage((i) => (i + 1) % gallery.length)}
                  className="absolute top-1/2 right-2.5 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#4b5568] shadow-sm hover:text-[#0F766E]"
                >
                  <ChevronRight className="size-4" />
                </button>
              </>
            ) : null}
            <div className="relative h-[min(380px,calc(100vh-300px))] min-h-[260px] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gallery[activeImage]}
                alt={product.name}
                className="absolute inset-0 size-full object-contain p-8 mix-blend-multiply"
              />
            </div>
          </div>
          <div className="mt-2.5 grid grid-cols-5 gap-2">
            {gallery.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setActiveImage(i)}
                aria-label={`Rasm ${i + 1}`}
                className={cn(
                  "aspect-[1.15/1] overflow-hidden rounded-lg border bg-[#f7f8fb] p-1.5 transition",
                  i === activeImage ? "border-[#0F766E] ring-1 ring-[#0F766E]/30" : "border-[#eceff5] hover:border-[#0F766E]/40",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="size-full object-contain mix-blend-multiply" />
              </button>
            ))}
          </div>
        </div>

        {/* ───── Configuration ───── */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[15px] font-extrabold tracking-tight text-[#111827]">{product.brand}</p>
            {details.officialImport ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf2ff] px-2 py-0.5 text-[11px] font-semibold text-[#0F766E]">
                <BadgeCheck className="size-3.5" />
                Rasmiy distribyutor
              </span>
            ) : null}
          </div>
          <h1 className="mt-1.5 text-[24px] leading-[1.15] font-extrabold tracking-tight text-[#111827] min-[1400px]:text-[26px]">
            {product.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
            {rv.count > 0 && rv.avg != null ? (
              <>
                <span className="flex items-center gap-0.5 text-[#f5b400]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("size-4", i < Math.round(rv.avg ?? 0) ? "fill-current" : "fill-none text-[#d7dbe7]")} />
                  ))}
                </span>
                <span className="font-semibold text-[#1a1d26]">{rv.avg.toFixed(1)}</span>
                <span className="text-[#8b93a7]">({rv.count} sharh)</span>
              </>
            ) : (
              <span className="text-[#8b93a7]">Hali sharh yo‘q</span>
            )}
            <button type="button" onClick={() => setTab("sharhlar")} className="font-semibold text-[#0F766E] hover:underline">
              Sharhlarni ko‘rish
            </button>
          </div>
          <p className="mt-2.5 line-clamp-2 text-[13px] leading-snug text-[#4b5568]">{stripRich(details.description)}</p>

          {showShades ? (
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-bold text-[#111827]">
                  Rang (shade): <span className="font-semibold text-[#0F766E]">{shade}</span>
                </p>
                <button type="button" onClick={() => setTab("xususiyatlar")} className="text-[12px] font-semibold text-[#0F766E] hover:underline">
                  Shade qo‘llanmasi
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {SHADES.map((item) => (
                  <Chip key={item} active={shade === item} onClick={() => setShade(item)}>
                    {item}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}

          {volumeToken ? (
            <div className="mt-3">
              <p className="text-[12.5px] font-bold text-[#111827]">Hajmi</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Chip active>{volumeToken}</Chip>
              </div>
            </div>
          ) : null}

          {isForma ? (
            <div className="mt-3">
              <SizeColorPickers
                product={product}
                size={size}
                color={color}
                onSize={(value) => {
                  setPickError("");
                  setSize(value);
                }}
                onColor={(value) => {
                  setPickError("");
                  setColor(value);
                }}
              />
              {pickError ? <p className="mt-2 text-sm text-destructive">{pickError}</p> : null}
            </div>
          ) : null}

          <div className="mt-3.5 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-[#eceff5] bg-[#eceff5]">
            <InfoCell label="Holati" value={condition === "yangi" ? "Yangi (yopiq)" : conditionLabels[condition]} />
            {expiry ? (
              <InfoCell label="Yaroqlilik muddati" value={expiry} />
            ) : own ? (
              <InfoCell label="Yaroqlilik muddati" value="Ko‘rsatilmagan" />
            ) : (
              <InfoCell label="Kafolat" value="12 oy" />
            )}
            <InfoCell label="Lot raqami" value={lot ?? "Ko‘rsatilmagan"} />
            <InfoCell label="Mavjudlik" value={stockText} tone={product.inStock ? "good" : undefined} />
            <InfoCell label="Joylashuv" value={productCity(product)} />
            <InfoCell label="Yetkazib berish" value={deliveryShort || "24 soat"} />
          </div>
        </div>

        {/* ───── Purchase box ───── */}
        <aside className="sticky top-0 min-w-0 rounded-xl border border-[#eceff5] bg-white p-4 shadow-[0_4px_18px_rgba(17, 24, 39, 0.07)]">
          <p className="text-[28px] leading-none font-extrabold tracking-tight text-[#0F766E] min-[1400px]:text-[30px]">
            {formatMoney(product.price, "UZS")}
          </p>
          {oldPrice ? (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[13px] text-[#9aa3b2] line-through">{formatMoney(oldPrice, "UZS")}</span>
              {discount ? (
                <span className="rounded-md bg-[#ffe9e9] px-1.5 py-[3px] text-[11px] leading-none font-bold text-[#e5484d]">
                  -{discount}%
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-3">
            <div className="inline-flex h-10 items-center rounded-[10px] border border-[#e6eaf2] bg-white">
              <button
                type="button"
                className="grid h-10 w-9 place-items-center text-[#6b7280] hover:text-[#1a1d26]"
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                aria-label="Kamaytirish"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-7 text-center text-[15px] font-semibold">{qty}</span>
              <button
                type="button"
                className="grid h-10 w-9 place-items-center text-[#6b7280] hover:text-[#1a1d26] disabled:opacity-40"
                onClick={() => setQty((n) => Math.min(maxQty, n + 1))}
                disabled={qty >= maxQty}
                aria-label="Ko‘paytirish"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <span className={cn("text-[12px] font-semibold", product.inStock ? "text-[#16a34a]" : "text-[#8b93a7]")}>
              {product.inStock ? (details.stockQty >= 20 ? "20+ dona mavjud" : `${details.stockQty} dona mavjud`) : "Buyurtma asosida"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void addToCart()}
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0F766E] text-[14px] font-semibold text-white shadow-[0_4px_12px_rgba(15, 118, 110, 0.28)] transition-colors hover:bg-[#115E59]"
          >
            <ShoppingCart className="size-4" />
            Savatga qo‘shish
          </button>
          <button
            type="button"
            onClick={buyNow}
            className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-[10px] border border-[#0F766E] bg-white text-[14px] font-semibold text-[#0F766E] transition-colors hover:bg-[#f3f8ff]"
          >
            Hozir xarid qilish
          </button>

          {sellerName ? (
            <div className="mt-3 rounded-xl border border-[#eceff5] bg-[#fafbfd] p-3">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/images/clinic/logo-tooth.png"
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 shrink-0 rounded-full bg-[#F0FDFA] object-contain p-1"
                />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="flex items-center gap-1 text-[13px] font-bold text-[#1a1d26]">
                    <span className="truncate">{sellerName}</span>
                    <BadgeCheck className="size-3.5 shrink-0 fill-[#0F766E] text-white" />
                  </p>
                  {rv.count > 0 && rv.avg != null ? (
                    <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-[#8b93a7]">
                      <Star className="size-3 fill-[#f5b942] text-[#f5b942]" />
                      <span className="font-semibold text-[#1a1d26]">{rv.avg.toFixed(1)}</span>
                      <span>· {rv.count} sharh</span>
                    </p>
                  ) : null}
                  <p className="mt-0.5 flex items-center gap-0.5 text-[11.5px] text-[#8b93a7]">
                    <MapPin className="size-3" />
                    {productCity(product)}
                  </p>
                </div>
              </div>
              {shop ? (
                <Link
                  href={shopHref(shop.slug)}
                  className="mt-2.5 inline-flex h-8 w-full items-center justify-center rounded-lg border border-[#F0FDFA] bg-white text-[12.5px] font-semibold text-[#0F766E] hover:bg-[#f3f8ff]"
                >
                  Sotuvchi profili
                </Link>
              ) : null}
              {product.listedBySeller && product.shopId ? (
                <ContactSeller storeId={product.shopId} shopName={sellerName ?? undefined} productId={product.id} className="mt-2" />
              ) : null}
            </div>
          ) : null}

          <ul className="mt-3 space-y-1.5">
            <Trust icon={Wallet} text="Xavfsiz to‘lov" />
            <Trust icon={Truck} text="Tez yetkazib berish" />
            <Trust icon={RotateCcw} text="Qaytarish kafolati" />
            <Trust icon={ShieldCheck} text="Rasmiy mahsulot" />
          </ul>
        </aside>
      </section>

      {/* ───── Tabs ───── */}
      <section className="overflow-hidden rounded-xl border border-[#eceff5] bg-white shadow-[0_2px_10px_rgba(17, 24, 39, 0.04)]">
        <div className="flex gap-1 overflow-x-auto border-b border-[#eceff5] px-3">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "shrink-0 border-b-2 px-4 py-3 text-[13.5px] font-semibold transition",
                tab === item.id ? "border-[#0F766E] text-[#0F766E]" : "border-transparent text-[#8b93a7] hover:text-[#4b5568]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="p-5 text-[13.5px] leading-relaxed text-[#4b5568]">
          {tab === "tavsif" ? (
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">Mahsulot haqida</h3>
                <RichText text={details.description} className="mt-2" />
                <ul className="mt-3 space-y-1.5">
                  {details.benefits.map((b) => (
                    <li key={b} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#0F766E]" strokeWidth={2.4} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">Asosiy xususiyatlar</h3>
                <dl className="mt-2 divide-y divide-[#f0f2f7]">
                  {details.specs.slice(0, 6).map((row) => (
                    <div key={row.label} className="flex justify-between gap-3 py-1.5 text-[13px]">
                      <dt className="text-[#8b93a7]">{row.label}</dt>
                      <dd className="text-right font-medium text-[#1a1d26]">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                <h3 className="mt-4 text-[14px] font-bold text-[#111827]">Hujjatlar</h3>
                {own ? (
                  details.docs?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <DocButton label={`Hujjatlar (${details.docs.length})`} onClick={() => setTab("sertifikat")} />
                    </div>
                  ) : (
                    <p className="mt-2 text-[13px] text-[#8b93a7]">Sotuvchi hujjat yuklamagan.</p>
                  )
                ) : (
                  <div className="mt-2 flex gap-2">
                    <DocButton label="Sertifikat (PDF)" onClick={() => setTab("sertifikat")} />
                    <DocButton label="Yo‘riqnoma (PDF)" onClick={() => setTab("klinik")} />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">Klinik qo‘llanish</h3>
                <ul className="mt-2 space-y-1.5">
                  {usageItems.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#0F766E]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {tab === "klinik" ? (
            <div className="max-w-3xl">
              <h3 className="text-[14px] font-bold text-[#111827]">Klinik qo‘llanish</h3>
              <ul className="mt-2 space-y-1.5">
                {usageItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#0F766E]" strokeWidth={2.4} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {tab === "xususiyatlar" ? (
            <dl className="grid grid-cols-2 gap-x-10">
              {details.specs.map((row) => (
                <div key={row.label} className="flex justify-between gap-4 border-b border-[#f0f2f7] py-2">
                  <dt className="text-[#8b93a7]">{row.label}</dt>
                  <dd className="text-right font-medium text-[#1a1d26]">{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {tab === "sertifikat" ? (
            <div className="max-w-2xl space-y-2">
              <p className="flex items-center gap-2 font-semibold text-[#1a1d26]">
                <ShieldCheck className="size-4 text-[#0F766E]" />
                {own ? (details.docs?.length ? "Sotuvchi hujjatlari" : "Sotuvchi hujjat yuklamagan") : details.certified ? "Sertifikat mavjud" : "Sertifikat talab qilinmaydi"}
              </p>
              {own && details.docs?.length ? (
                <ul className="space-y-1.5">
                  {details.docs.map((d) => (
                    <li key={d.url}>
                      <a href={d.url} target="_blank" rel="noreferrer" className="font-medium text-[#0F766E] hover:underline">{d.name}</a>
                    </li>
                  ))}
                </ul>
              ) : null}
              <p>
                {own ? "" : details.certified
                  ? "Mahsulot ishlab chiqaruvchi sertifikati va ro‘yxatdan o‘tish hujjatlari buyurtma bilan birga beriladi. Namuna katalog — hujjatlar fayli keyinroq yuklanadi."
                  : "Ushbu mahsulot turi uchun alohida klinik sertifikat talab qilinmaydi."}
              </p>
            </div>
          ) : null}

          {tab === "sharhlar" ? <ProductReviewsList data={rv} columns={3} /> : null}

          {tab === "yetkazib" ? (
            <div className="max-w-2xl space-y-3">
              <p>{details.delivery}</p>
              <ul className="space-y-2 text-[13px]">
                <li className="flex gap-2">
                  <Truck className="mt-0.5 size-4 shrink-0 text-[#0F766E]" />
                  Toshkent ichida 24 soat
                </li>
                <li className="flex gap-2">
                  <Package className="mt-0.5 size-4 shrink-0 text-[#0F766E]" />
                  Viloyatlarga 2–3 ish kuni
                </li>
                <li className="flex gap-2">
                  <Clock className="mt-0.5 size-4 shrink-0 text-[#0F766E]" />
                  Buyurtma 16:00 gacha berilsa, shu kuni jo‘natiladi
                </li>
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      {/* ───── Related ───── */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-bold text-[#111827]">O‘xshash mahsulotlar</h2>
          <Link href={isForma ? "/forma" : "/marketplace"} className="text-[13px] font-semibold text-[#0F766E] hover:underline">
            Barchasini ko‘rish
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {related.map((item) =>
            item.category === "forma" ? (
              <FormaProductCard key={item.id} product={item} />
            ) : (
              <ProductCard key={item.id} product={item} variant="market" />
            ),
          )}
        </div>
      </section>
    </div>
  );
}

function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-8 min-w-11 rounded-lg border px-3 text-[13px] font-semibold transition-colors",
        active ? "border-[#0F766E] bg-[#f3f8ff] text-[#0F766E]" : "border-[#e6eaf2] bg-white text-[#4b5568] hover:border-[#0F766E]/40",
      )}
    >
      {children}
    </button>
  );
}

function InfoCell({ label, value, tone }: { label: string; value: string; tone?: "good" }) {
  return (
    <div className="bg-[#f7f8fb] px-3 py-2">
      <p className="text-[11px] text-[#8b93a7]">{label}</p>
      <p className={cn("mt-0.5 truncate text-[13px] font-bold", tone === "good" ? "text-[#16a34a]" : "text-[#111827]")}>{value}</p>
    </div>
  );
}

function Trust({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <li className="flex items-center gap-2 text-[12.5px] font-medium text-[#4b5568]">
      <Icon className="size-4 shrink-0 text-[#0F766E]" strokeWidth={1.9} />
      {text}
    </li>
  );
}

function DocButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e6eaf2] bg-white px-3 text-[12.5px] font-semibold text-[#111827] hover:border-[#0F766E]/40 hover:text-[#0F766E]"
    >
      <FileText className="size-4 text-[#e5484d]" />
      {label}
    </button>
  );
}
