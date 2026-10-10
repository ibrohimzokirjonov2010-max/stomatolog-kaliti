"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, BadgeCheck, ChevronLeft, ChevronRight, Heart, Minus, Plus, Share2, ShoppingBag, Star, X } from "lucide-react";
import { cartLineKey, useCart, type CartLineMeta } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import type { useProductReviews } from "@/components/product-reviews";
import { productOldPrice, type Product } from "@/data/products";
import { formatGroupedNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Real photos only: cover + seller/catalog extra images, de-duplicated (no filler pictures). */
export function realGallery(product: Product) {
  return [...new Set([product.image, ...(product.images ?? [])].filter(Boolean))];
}

function som(n: number) {
  return `${formatGroupedNumber(n)} so‘m`;
}

/* ───────────── 01 · Full-bleed hero gallery ───────────── */

export function UzumHero({ product, gallery, backHref, cover = false }: { product: Product; gallery: string[]; backHref: string; cover?: boolean }) {
  const router = useRouter();
  const favorites = useFavorites();
  const liked = favorites.has(product.id);
  const [slide, setSlide] = useState(0);
  const [zoomAt, setZoomAt] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setToast("Havola nusxalandi");
      window.setTimeout(() => setToast(""), 2000);
    } catch {
      /* cancelled */
    }
  }

  const btn = "pointer-events-auto grid size-11 place-items-center rounded-[14px] bg-white/80 text-[#1a1d26] shadow-[0_2px_10px_rgba(15,23,42,0.10)] backdrop-blur-md active:scale-95";

  return (
    <section className="relative -mx-4 -mt-4 bg-white" style={{ paddingTop: "env(safe-area-inset-top)" }} data-testid="uzum-hero">
      <div
        ref={ref}
        data-testid="pdp-gallery"
        onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {gallery.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            aria-label={`Rasmni kattalashtirish ${i + 1}`}
            onClick={() => setZoomAt(i)}
            className="relative h-[min(132vw,620px)] w-full shrink-0 snap-center cursor-zoom-in bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={i === 0 ? product.name : `${product.name} — rasm ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
              className={cn("h-full w-full select-none", cover ? "object-cover" : "object-contain px-4 pt-16 pb-10")}
            />
          </button>
        ))}
      </div>

      {/* Overlaid actions — kept below the status bar (safe area) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
        <button type="button" aria-label="Orqaga" onClick={() => (window.history.length > 1 ? router.back() : router.push(backHref))} className={btn}>
          <ChevronLeft className="size-6" strokeWidth={2} />
        </button>
        <div className="flex gap-2.5">
          <button type="button" aria-label="Sevimlilarga" aria-pressed={liked} onClick={() => favorites.toggle(product.id)} className={btn}>
            <Heart className={cn("size-[22px]", liked && "fill-[#f43f5e] text-[#f43f5e]")} strokeWidth={1.9} />
          </button>
          <button type="button" aria-label="Ulashish" onClick={share} className={btn}>
            <Share2 className="size-[20px]" strokeWidth={1.9} />
          </button>
        </div>
      </div>

      {/* Pagination dots */}
      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center gap-1.5" aria-hidden>
        {gallery.map((_, i) => (
          <span key={i} className={cn("h-[5px] rounded-full transition-all", i === slide ? "w-4 bg-[#1a1d26]" : "w-[5px] bg-[#1a1d26]/25")} />
        ))}
      </div>

      {zoomAt !== null ? <UzumLightbox gallery={gallery} start={zoomAt} name={product.name} onClose={() => setZoomAt(null)} /> : null}
      {toast ? (
        <div role="status" className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+70px)] z-[95] mx-auto w-fit rounded-full bg-[#1a1d26] px-4 py-2 text-[13px] font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </section>
  );
}

/* Fullscreen viewer: swipe between photos, tap to zoom 2.5× (pan by dragging), X to close. */
export function UzumLightbox({ gallery, start, name, onClose }: { gallery: string[]; start: number; name: string; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const [zoomed, setZoomed] = useState(false);
  const strip = useRef<HTMLDivElement>(null);
  const pan = useRef<HTMLDivElement>(null);

  useEffect(() => {
    strip.current?.scrollTo({ left: start * (strip.current?.clientWidth ?? 0) });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [start, onClose]);

  function toggleZoom(e: React.MouseEvent<HTMLElement>) {
    if (zoomed) {
      setZoomed(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    setZoomed(true);
    requestAnimationFrame(() => {
      const el = pan.current;
      if (!el) return;
      el.scrollTo({ left: fx * el.scrollWidth - el.clientWidth / 2, top: fy * el.scrollHeight - el.clientHeight / 2 });
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black" role="dialog" aria-modal="true" aria-label="Rasmni ko‘rish" data-testid="uzum-lightbox">
      <div className="flex items-center justify-between px-4 text-white" style={{ paddingTop: "calc(env(safe-area-inset-top) + 10px)" }}>
        <span className="text-[14px] font-semibold tabular-nums">
          {index + 1} / {gallery.length}
        </span>
        <button type="button" aria-label="Yopish" onClick={onClose} className="grid size-11 place-items-center rounded-full bg-white/15 active:bg-white/25">
          <X className="size-6" />
        </button>
      </div>

      {zoomed ? (
        <div ref={pan} className="relative min-h-0 flex-1 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-h-full w-[250%] items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gallery[index]} alt={name} onClick={toggleZoom} className="block h-auto w-full max-w-none cursor-zoom-out" draggable={false} />
          </div>
        </div>
      ) : (
        <div
          ref={strip}
          onScroll={(e) => setIndex(Math.min(gallery.length - 1, Math.max(0, Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))))}
          className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {gallery.map((src, i) => (
            <div key={`${src}-z${i}`} className="grid h-full w-full shrink-0 snap-center place-items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={name} onClick={toggleZoom} className="max-h-full w-full cursor-zoom-in object-contain" draggable={false} style={{ touchAction: "pan-x pinch-zoom" }} />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 px-4 pt-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 18px)" }}>
        {gallery.length > 1 ? (
          <div className="flex gap-1.5" aria-hidden>
            {gallery.map((_, i) => (
              <span key={i} className={cn("h-[5px] rounded-full", i === index ? "w-4 bg-white" : "w-[5px] bg-white/35")} />
            ))}
          </div>
        ) : null}
        <p className="text-[12px] text-white/60">{zoomed ? "Kichraytirish uchun bosing" : "Kattalashtirish uchun rasmga bosing"}</p>
      </div>
    </div>
  );
}

/* ───────────── White cards: price + title/rating ───────────── */

export function UzumPriceCard({ product }: { product: Product }) {
  const oldPrice = productOldPrice(product);
  const discount = product.discount ?? (oldPrice ? Math.round((1 - product.price / oldPrice) * 100) : 0);
  return (
    <div className="relative -mx-4 -mt-6 rounded-[24px] bg-white px-4 pt-4 pb-4 shadow-[0_-4px_16px_rgba(15,23,42,0.04)]" data-testid="uzum-price">
      <div className="flex items-baseline gap-2">
        <p className="text-[24px] leading-none font-extrabold tracking-tight text-[#1a1d26]">{som(product.price)}</p>
        {discount > 0 ? (
          <span className="inline-flex items-center text-[16px] font-bold text-[#e5177e]">
            <ArrowDown className="size-4" strokeWidth={2.6} />
            {discount}%
          </span>
        ) : null}
      </div>
      {oldPrice ? <p className="mt-1.5 text-[14px] text-[#8b93a7] line-through">{formatGroupedNumber(oldPrice)}</p> : null}
    </div>
  );
}

type Reviews = ReturnType<typeof useProductReviews>;

export function UzumTitleCard({
  product,
  rv,
  original,
  brandHref,
  onReviews,
  children,
}: {
  product: Product;
  rv: Reviews;
  original: boolean;
  brandHref?: string;
  onReviews?: () => void;
  children?: ReactNode;
}) {
  const hasRating = rv.count > 0 && rv.avg != null;
  const badge = (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-[0.04em] text-[#1a1d26] uppercase">
      {original ? <BadgeCheck className="size-[18px] fill-[#16a34a] text-white" /> : null}
      {original ? "Original" : product.brand}
      {original && product.brand ? <span className="font-semibold tracking-normal text-[#8b93a7] normal-case">· {product.brand}</span> : null}
      <ChevronRight className="size-4 text-[#8b93a7]" />
    </span>
  );
  return (
    <div className="-mx-4 rounded-[24px] bg-white px-4 pt-4 pb-4" data-testid="uzum-title">
      {brandHref ? <Link href={brandHref}>{badge}</Link> : badge}
      <h1 className="mt-2 text-[20px] leading-[1.3] font-medium text-[#1a1d26]">{product.name}</h1>
      <button
        type="button"
        onClick={onReviews}
        className="mt-3 block w-full rounded-[16px] border border-[#eceff3] px-3.5 py-3 text-left"
        data-testid="uzum-rating"
      >
        <span className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn("size-[22px]", hasRating && i < Math.round(rv.avg ?? 0) ? "fill-[#f5b400] text-[#f5b400]" : "fill-[#d9dde5] text-[#d9dde5]")}
            />
          ))}
          {hasRating ? <span className="ml-1.5 text-[15px] font-bold text-[#1a1d26]">{rv.avg!.toFixed(1)}</span> : null}
        </span>
        <span className="mt-1 block text-[13px] text-[#8b93a7]">{hasRating ? `${rv.count} ta sharh` : "Hali baho yo‘q"}</span>
      </button>
      {children}
    </div>
  );
}

/* ───────────── 02 · Sticky bottom bar (above the 5-tab nav) ───────────── */

export function UzumCartBar({
  product,
  meta,
  onAdd,
  ready = true,
}: {
  product: Product;
  meta?: CartLineMeta;
  /** Return false to cancel (e.g. size/colour not chosen). */
  onAdd?: () => boolean;
  ready?: boolean;
}) {
  const cart = useCart();
  const key = cartLineKey(product.id, meta?.size || undefined, meta?.color || undefined);
  const line = cart.lines.find((l) => cartLineKey(l.productId, l.size || undefined, l.color || undefined) === key);
  const qty = line?.qty ?? 0;
  const max = cart.items.find((i) => i.key === key)?.max ?? 99;

  function add() {
    if (onAdd && !onAdd()) return;
    cart.add(product.id, product.listedBySeller ? product : undefined, 1, meta);
  }

  return (
    <>
      <div className="h-[84px]" aria-hidden />
      <div
        className="fixed inset-x-0 z-40 border-t border-[#eef0f4] bg-white px-4 pt-2.5 pb-2.5 lg:hidden"
        style={{ bottom: "calc(4.15rem + env(safe-area-inset-bottom))" }}
        data-testid="uzum-cart-bar"
      >
        {qty > 0 ? (
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="flex h-[52px] w-[46%] shrink-0 items-center justify-between rounded-[14px] bg-[#f2f4f7] p-1" data-testid="uzum-qty">
              <button
                type="button"
                aria-label="Kamaytirish"
                onClick={() => (qty <= 1 ? cart.remove(key) : cart.setQty(key, qty - 1))}
                className="grid h-full w-11 place-items-center rounded-[11px] bg-white text-[#1a1d26] shadow-sm active:scale-95"
              >
                <Minus className="size-5" strokeWidth={2.2} />
              </button>
              <span className="text-[16px] font-semibold tabular-nums text-[#1a1d26]" aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                aria-label="Ko‘paytirish"
                disabled={qty >= max}
                onClick={() => cart.setQty(key, qty + 1)}
                className="grid h-full w-11 place-items-center rounded-[11px] bg-white text-[#1a1d26] shadow-sm active:scale-95 disabled:opacity-40"
              >
                <Plus className="size-5" strokeWidth={2.2} />
              </button>
            </div>
            <Link
              href="/savat"
              data-testid="uzum-goto-cart"
              className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#e8f1ff] text-[16px] font-semibold text-[#0066FF] active:scale-[0.98]"
            >
              <ShoppingBag className="size-5" strokeWidth={2} />
              O‘tish
            </Link>
          </div>
        ) : (
          <button
            type="button"
            onClick={add}
            disabled={!ready}
            data-testid="uzum-add"
            className="mx-auto flex h-[52px] w-full max-w-lg flex-col items-center justify-center rounded-[14px] bg-[#0066FF] leading-tight text-white shadow-[0_8px_18px_rgba(0,102,255,0.28)] active:scale-[0.98] disabled:opacity-60"
          >
            <span className="text-[16px] font-semibold">Savatga</span>
            <span className="text-[12px] text-white/80">{som(product.price)}</span>
          </button>
        )}
      </div>
    </>
  );
}
