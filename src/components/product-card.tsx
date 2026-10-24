"use client";

import type { ReactNode } from "react";
import { ProductImageFrame } from "@/components/product-image-frame";
import { SafeProductImage } from "@/components/safe-product-image";
import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, MessageCircle, ShoppingCart, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import {
  conditionLabels,
  productCity,
  productCondition,
  productHref,
  productOldPrice,
  productSpecs,
  type Product,
} from "@/data/products";
import { catalogShop, productShop, shopHref } from "@/data/shops";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export type OrtiqchaCardOptions = {
  /** Blue seller line (doctor name) */
  sellerLabel: string;
  brandLabel?: string;
  /** Circular seller avatar URL (optional — initials fallback) */
  sellerAvatar?: string;
  /** City / district for seller meta */
  sellerCity?: string;
  /** Image overlays (Ajratilgan, Yopiq/Ochilgan) — keep silhouette intact */
  imageBadges?: ReactNode;
  isMine?: boolean;
  added?: boolean;
  onAddSurplus?: () => void;
  onContact?: () => void;
  onEdit?: () => void;
  /** Override delivery / location line */
  deliveryLabel?: string;
  /** Full listing page — when set, tapping image/title opens it instead of the modal */
  href?: string;
};

function CardLink({
  href,
  ortiqcha,
  className,
  children,
}: {
  href: string;
  ortiqcha?: OrtiqchaCardOptions;
  className?: string;
  children: ReactNode;
}) {
  // Ortiqcha material kartalarida alohida mahsulot sahifasi yo‘q: karta o‘zi bosiladigan bo‘lib, egasi uchun tahrirlash, boshqalar uchun bog‘lanish oynasini ochadi.
  const action = ortiqcha ? (ortiqcha.isMine ? ortiqcha.onEdit : ortiqcha.onContact) : undefined;
  if (ortiqcha?.href) {
    return (
      <Link href={ortiqcha.href} className={className}>
        {children}
      </Link>
    );
  }
  if (ortiqcha) {
    if (!action) return <div className={className}>{children}</div>;
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={action}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            action();
          }
        }}
        className={cn("cursor-pointer", className)}
      >
        {children}
      </div>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function ProductCard({
  product,
  compact = false,
  variant = "desktop",
  ortiqcha,
}: {
  product: Product;
  compact?: boolean;
  variant?: "desktop" | "mobile" | "mobile-list" | "market" | "market-list";
  /** When set, card keeps Marketplace silhouette with C2C adaptations */
  ortiqcha?: OrtiqchaCardOptions;
}) {
  const { add } = useCart();
  const favorites = useFavorites();
  const saved = favorites.has(product.id);
  const href = productHref(product);
  const oldPrice = productOldPrice(product);
  const shop = ortiqcha ? null : productShop(product);
  const brand = ortiqcha?.brandLabel?.trim() || product.brand;
  const sellerLabel = ortiqcha?.sellerLabel;
  const delivery = ortiqcha?.deliveryLabel || product.delivery;
  const showRating = product.reviews > 0;
  const isOrtiqcha = Boolean(ortiqcha);

  function addToCart() {
    if (ortiqcha?.onAddSurplus) {
      ortiqcha.onAddSurplus();
      return;
    }
    add(product.id, product.listedBySeller ? product : undefined);
  }

  if (variant === "market" || variant === "market-list") {
    return (
      <MarketCard
        product={product}
        list={variant === "market-list"}
        saved={saved}
        onToggleSaved={() => favorites.toggle(product.id)}
        onAdd={addToCart}
      />
    );
  }

  if (variant === "mobile-list") {
    return (
      <article className="flex gap-3 rounded-2xl border border-[#eceff5] bg-white p-2.5">
        <CardLink ortiqcha={ortiqcha}
          href={href}
          className="relative size-[92px] shrink-0 overflow-hidden rounded-2xl bg-[#f4f7fb]"
        >
          {ortiqcha?.imageBadges}
          <SafeProductImage
            src={product.image}
            alt={product.name}
            category={product.category}
            width={184}
            height={184}
            className="size-full object-contain p-1.5"
          />
        </CardLink>
        <div className="flex min-w-0 flex-1 flex-col">
          <CardLink ortiqcha={ortiqcha} href={href} className="min-w-0">
            <p className="text-[11px] text-[#8b93a7]">{brand}</p>
            <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-[#1a1d26]">{product.name}</h3>
          </CardLink>
          {isOrtiqcha && sellerLabel ? (
            <OrtiqchaSellerRow
              label={sellerLabel}
              avatar={ortiqcha?.sellerAvatar}
              city={ortiqcha?.sellerCity}
              size="sm"
            />
          ) : sellerLabel ? (
            <p className="mt-0.5 truncate text-[11px] font-medium text-[#0F766E]">{sellerLabel}</p>
          ) : null}
          {showRating ? (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#8b93a7]">
              <Star className="size-3 fill-[#f5b942] text-[#f5b942]" />
              <span className="text-[#1a1d26]">{product.rating.toFixed(1)}</span>
              <span>({product.reviews})</span>
            </p>
          ) : (
            <p className="mt-1 text-[11px] font-medium text-[#8b93a7]">Yangi e’lon</p>
          )}
          <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-1.5">
                <span className="text-[15px] font-bold text-[#0F766E]">{formatMoney(product.price, "UZS")}</span>
                {product.discount ? (
                  <span className="rounded-md bg-[#e8f8ef] px-1.5 py-0.5 text-[11px] font-semibold text-[#16a34a]">
                    -{product.discount}%
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#16a34a]">
                <Truck className="size-3" />
                {delivery}
              </p>
            </div>
            {ortiqcha?.isMine ? (
              <button
                type="button"
                onClick={ortiqcha.onEdit}
                className="inline-flex h-9 min-h-9 shrink-0 items-center justify-center gap-1 rounded-xl bg-[#0F766E] px-3 text-[12px] font-semibold text-white"
              >
                Tahrirlash
              </button>
            ) : (
              <button
                type="button"
                disabled={false}
                onClick={ortiqcha ? ortiqcha.onContact : addToCart}
                className="inline-flex h-9 min-h-9 shrink-0 items-center justify-center gap-1 rounded-xl bg-[#0F766E] px-3 text-[12px] font-semibold text-white disabled:opacity-70"
              >
                {ortiqcha ? <MessageCircle className="size-3.5" /> : <ShoppingCart className="size-3.5" />}
                {ortiqcha ? "Bog‘lanish" : "Savatga"}
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  if (variant === "mobile") {
    return (
      <article className="flex flex-col overflow-hidden rounded-2xl border border-[#eceff5] bg-white p-2.5 shadow-[0_1px_2px_rgba(17, 24, 39, 0.04)]">
        <div className="relative">
          <button
            type="button"
            onClick={() => favorites.toggle(product.id)}
            className="absolute top-1 right-1 z-10 grid size-8 place-items-center rounded-full bg-white/95 text-[#94a3b8] shadow-sm"
            aria-label="Sevimlilarga"
          >
            <Heart className={cn("size-4", saved && "fill-[#f43f5e] text-[#f43f5e]")} />
          </button>
          {ortiqcha?.imageBadges}
          <CardLink ortiqcha={ortiqcha} href={href} className="block overflow-hidden rounded-xl">
            <ProductImageFrame
              src={product.image}
              alt={product.name}
              category={product.category}
              className="rounded-xl"
            />
          </CardLink>
        </div>

        <CardLink ortiqcha={ortiqcha} href={href} className="mt-2 block min-w-0">
          <p className="truncate text-[11px] text-[#8b93a7]">{brand}</p>
          <h3 className="mt-0.5 line-clamp-2 min-h-[36px] text-[13px] font-bold leading-snug text-[#1a1d26]">
            {product.name}
          </h3>
        </CardLink>

        {isOrtiqcha && sellerLabel ? (
          <OrtiqchaSellerRow
            label={sellerLabel}
            avatar={ortiqcha?.sellerAvatar}
            city={ortiqcha?.sellerCity}
            size="sm"
          />
        ) : sellerLabel ? (
          <p className="mt-1 truncate text-[11px] font-medium text-[#0F766E]">{sellerLabel}</p>
        ) : null}

        {showRating ? (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[#8b93a7]">
            <Star className="size-3 fill-[#f5b942] text-[#f5b942]" />
            <span className="font-semibold text-[#1a1d26]">{product.rating.toFixed(1)}</span>
            <span>({product.reviews})</span>
          </p>
        ) : (
          <p className="mt-1.5 text-[11px] text-[#8b93a7]">Yangi e’lon</p>
        )}

        {isOrtiqcha ? (
          <>
            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[14px] font-bold leading-tight text-[#0F766E]">
                    {formatMoney(product.price, "UZS")}
                  </span>
                </p>
                {oldPrice ? (
                  <p className="mt-0.5 text-[11px] text-[#9aa3b2] line-through">{formatMoney(oldPrice, "UZS")}</p>
                ) : null}
              </div>
              {ortiqcha?.isMine ? (
                <button
                  type="button"
                  onClick={ortiqcha.onEdit}
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-[#0F766E] px-2.5 text-[11px] font-semibold text-white"
                >
                  Tahrirlash
                </button>
              ) : (
                <button
                  type="button"
                  disabled={false}
                  onClick={ortiqcha ? ortiqcha.onContact : addToCart}
                  className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg bg-[#0F766E] px-2.5 text-[11px] font-semibold text-white disabled:opacity-70"
                >
                  {ortiqcha ? <MessageCircle className="size-3.5" /> : <ShoppingCart className="size-3.5" />}
                  {ortiqcha ? "Bog‘lanish" : "Savatga"}
                </button>
              )}
            </div>
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-[#8b93a7]">
              <Truck className="size-3.5 shrink-0" />
              <span className="truncate">{delivery || "Toshkent 24 soat"}</span>
              {!ortiqcha?.isMine && ortiqcha?.onContact ? (
                <button
                  type="button"
                  onClick={ortiqcha.onContact}
                  className="ml-auto inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[#0F766E] hover:bg-[#F0FDFA]"
                  aria-label="Bog‘lanish"
                >
                  <MessageCircle className="size-3.5" />
                </button>
              ) : null}
            </p>
          </>
        ) : (
          <>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[14px] font-bold leading-tight text-[#0F766E]">
                {formatMoney(product.price, "UZS")}
              </span>
              {product.discount ? (
                <span className="rounded-md bg-[#e8f8ef] px-1.5 py-0.5 text-[11px] font-semibold text-[#16a34a]">
                  -{product.discount}%
                </span>
              ) : null}
            </div>

            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-[#16a34a]">
              <Truck className="size-3.5" />
              {delivery || "Toshkent 24 soat"}
            </p>

            <button
              type="button"
              onClick={ortiqcha ? ortiqcha.onContact : addToCart}
              className="mt-2.5 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] text-[13px] font-semibold text-white"
            >
              {ortiqcha ? <MessageCircle className="size-3.5" /> : <ShoppingCart className="size-3.5" />}
              Savatga
            </button>
          </>
        )}
      </article>
    );
  }

  return (
    <article className="flex flex-col rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_1px_2px_rgba(17, 24, 39, 0.04)]">
      <div className="relative">
        <button
          type="button"
          onClick={() => favorites.toggle(product.id)}
          className="absolute top-1.5 right-1.5 z-10 flex size-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm hover:text-[#f43f5e]"
          aria-label="Sevimlilarga"
        >
          <Heart className={cn("size-4", saved && "fill-[#f43f5e] text-[#f43f5e]")} />
        </button>
        {ortiqcha?.imageBadges}
        <CardLink ortiqcha={ortiqcha} href={href} className="block">
          <ProductImageFrame
            src={product.image}
            alt={product.name}
            category={product.category}
            className={cn("rounded-lg", compact && "max-h-40")}
            fit={compact ? "contain" : "cover"}
          />
        </CardLink>
      </div>
      <CardLink ortiqcha={ortiqcha} href={href} className="mt-2 block">
        <p className="text-[12px] text-muted-foreground">{brand}</p>
        <h3 className="mt-0.5 line-clamp-2 min-h-10 text-sm font-semibold leading-snug">{product.name}</h3>
      </CardLink>
      {isOrtiqcha && sellerLabel ? (
        <OrtiqchaSellerRow
          label={sellerLabel}
          avatar={ortiqcha?.sellerAvatar}
          city={ortiqcha?.sellerCity}
        />
      ) : sellerLabel ? (
        <p className="mt-1 truncate text-[12px] font-medium text-[#0F766E]">{sellerLabel}</p>
      ) : shop ? (
        <Link href={shopHref(shop.slug)} className="mt-1 text-[12px] font-medium text-[#0F766E] hover:underline">
          {shop.name}
        </Link>
      ) : null}
      {showRating ? (
        <p className="mt-1.5 flex items-center gap-1 text-[12px] text-slate-500">
          <Star className="size-3.5 fill-[#f5b942] text-[#f5b942]" />
          <span className="font-medium text-foreground">{product.rating.toFixed(1)}</span>
          <span>({product.reviews})</span>
        </p>
      ) : (
        <p className="mt-1.5 text-[12px] text-slate-500">Yangi e’lon</p>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-1.5">
            <span className="text-[15px] font-bold text-[#0F766E]">{formatMoney(product.price, "UZS")}</span>
            {product.discount ? (
              <span className="text-[12px] font-semibold text-[#22c55e]">-{product.discount}%</span>
            ) : oldPrice && isOrtiqcha ? (
              <span className="text-[11px] text-[#9aa3b2] line-through">{formatMoney(oldPrice, "UZS")}</span>
            ) : null}
          </p>
        </div>
        {ortiqcha?.isMine ? (
          <Button
            type="button"
            size="sm"
            className="h-8 shrink-0 !rounded-lg px-2.5 text-[12px] font-semibold"
            onClick={ortiqcha.onEdit}
          >
            Tahrirlash
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="h-8 shrink-0 !rounded-lg px-2.5 text-[12px] font-semibold"
            disabled={false}
            onClick={ortiqcha ? ortiqcha.onContact : addToCart}
          >
            {ortiqcha ? <MessageCircle className="size-3.5" /> : <ShoppingCart className="size-3.5" />}
            {ortiqcha ? "Bog‘lanish" : "Savatga"}
          </Button>
        )}
      </div>
      <p className="mt-2 flex items-center gap-1 text-[12px] text-muted-foreground">
        <Truck className="size-3.5 shrink-0" />
        <span className="truncate">{delivery}</span>
        {isOrtiqcha && !ortiqcha?.isMine && ortiqcha?.onContact ? (
          <button
            type="button"
            onClick={ortiqcha.onContact}
            className="ml-auto inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[#0F766E] hover:bg-[#F0FDFA]"
            aria-label="Bog‘lanish"
            title="Bog‘lanish"
          >
            <MessageCircle className="size-3.5" />
          </button>
        ) : null}
      </p>
    </article>
  );
}


function sellerInitials(label: string) {
  const parts = label.replace(/^Siz\s*·\s*/i, "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function OrtiqchaSellerRow({
  label,
  avatar,
  city,
  size = "md",
}: {
  label: string;
  avatar?: string;
  city?: string;
  size?: "sm" | "md";
}) {
  const avatarSize = size === "sm" ? "size-5 text-[8px]" : "size-6 text-[9px]";
  const nameSize = size === "sm" ? "text-[11px]" : "text-[12px]";
  return (
    <div className="mt-1 flex min-w-0 items-center gap-1.5">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className={cn(avatarSize, "shrink-0 rounded-full object-cover")} />
      ) : (
        <span
          className={cn(
            avatarSize,
            "grid shrink-0 place-items-center rounded-full bg-[#F0FDFA] font-bold text-[#0F766E]",
          )}
        >
          {sellerInitials(label)}
        </span>
      )}
      <div className="min-w-0 flex-1 leading-tight">
        <p className={cn("truncate font-medium text-[#0F766E]", nameSize)}>{label}</p>
        {city ? <p className="truncate text-[10px] text-[#8b93a7]">{city}</p> : null}
      </div>
    </div>
  );
}

/** Compact status / featured badges for Ortiqcha image overlays (top-left stack; heart stays top-right) */
export function OrtiqchaImageBadges({
  featured,
  status,
  statusText,
  size = "md",
}: {
  featured?: boolean;
  status?: "yopiq" | "ochilgan";
  statusText?: string;
  size?: "sm" | "md";
}) {
  if (!featured && !(status && statusText)) return null;
  const pad = size === "sm" ? "px-1.5 py-0.5 text-[9px] font-bold" : "px-2 py-0.5 text-[11px] font-semibold";
  return (
    <div
      className={cn(
        "pointer-events-none absolute top-2 left-2 z-[9] flex max-w-[70%] flex-col items-start gap-1",
        size === "sm" && "top-1.5 left-1.5 gap-0.5",
      )}
    >
      {featured ? (
        <span className={cn("rounded-md bg-[#0F766E] text-white", pad)}>
          {size === "sm" ? "TOP" : "Ajratilgan"}
        </span>
      ) : null}
      {status && statusText ? (
        <span
          className={cn(
            "rounded-md text-white",
            pad,
            status === "yopiq" ? (featured ? "bg-[#111827]" : "bg-[#0F766E]") : "bg-[#f43f5e]",
          )}
        >
          {statusText}
        </span>
      ) : null}
    </div>
  );
}


function hashOf(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

const conditionBadge = {
  yangi: "bg-[#e6f7ee] text-[#16a34a]",
  ochilgan: "bg-[#ffe9e9] text-[#e5484d]",
  ishlatilgan: "bg-[#fff3e0] text-[#e8890c]",
} as const;

/** Desktop Marketplace card (design mock): status badge, heart, packshot, spec pills, rating + city, price, seller, cart. */
function MarketCard({
  product,
  list,
  saved,
  onToggleSaved,
  onAdd,
}: {
  product: Product;
  list: boolean;
  saved: boolean;
  onToggleSaved: () => void;
  onAdd: () => void;
}) {
  const href = productHref(product);
  const oldPrice = productOldPrice(product);
  const condition = productCondition(product);
  const specs = productSpecs(product);
  const shop = productShop(product);
  const sellerName = shop?.name ?? product.shopName ?? "Sotuvchi";
  const isCatalogShop = shop?.slug === catalogShop.slug;
  const deals = 12 + (hashOf(sellerName) % 180);
  const packshot = product.image.startsWith("/images/dentrade/") || product.image.startsWith("/images/product-");

  return (
    <article
      className={cn(
        "relative flex rounded-xl border border-[#eceff5] bg-white p-3 shadow-[0_2px_10px_rgba(17, 24, 39, 0.05)] transition-shadow hover:shadow-[0_8px_24px_rgba(17, 24, 39, 0.10)]",
        list ? "flex-row gap-4" : "flex-col",
      )}
    >
      <div className={cn("relative", list && "w-[168px] shrink-0")}>
        <Link href={href} className="relative block aspect-square w-full overflow-hidden rounded-lg bg-[#f7f8fb]">
          <SafeProductImage
            src={product.image}
            alt={product.name}
            category={product.category}
            fill
            sizes="240px"
            className={cn(packshot ? "object-contain p-3 mix-blend-multiply" : "object-cover object-center")}
          />
        </Link>
        <span
          className={cn(
            "pointer-events-none absolute top-2 left-2 rounded-md px-2 py-[3px] text-[10.5px] leading-none font-semibold",
            conditionBadge[condition],
          )}
        >
          {conditionLabels[condition]}
        </span>
        <button
          type="button"
          onClick={onToggleSaved}
          aria-label="Sevimlilarga"
          aria-pressed={saved}
          className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-white/95 text-[#8b93a7] shadow-sm hover:text-[#f43f5e]"
        >
          <Heart className={cn("size-3.5", saved && "fill-[#f43f5e] text-[#f43f5e]")} />
        </button>
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col", list ? "justify-between" : "mt-2.5")}>
        <div>
          <p className="truncate text-[11.5px] text-[#8b93a7]">{product.brand}</p>
          <Link href={href} className="block">
            <h3 className="mt-0.5 line-clamp-2 min-h-[34px] text-[13px] leading-[17px] font-bold text-[#1a1d26] hover:text-[#0F766E]">
              {product.name}
            </h3>
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-1">
            {specs.map((spec) => (
              <span
                key={spec}
                className="rounded-md bg-[#eaf2ff] px-1.5 py-[3px] text-[10.5px] leading-none font-medium text-[#0F766E]"
              >
                {spec}
              </span>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 text-[11.5px] text-[#8b93a7]">
            {product.reviews > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-[#f5b942] text-[#f5b942]" />
                <span className="font-semibold text-[#1a1d26]">{product.rating.toFixed(1)}</span>
                <span>({product.reviews})</span>
              </span>
            ) : (
              <span>Yangi e’lon</span>
            )}
            <span className="inline-flex min-w-0 items-center gap-0.5">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{productCity(product)}</span>
            </span>
          </div>
        </div>

        <div>
          <div className="mt-2 text-[15.5px] leading-tight font-extrabold text-[#0F766E]">
            {formatMoney(product.price, "UZS")}
          </div>
          {oldPrice ? (
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="text-[11.5px] text-[#9aa3b2] line-through">{formatMoney(oldPrice, "UZS")}</span>
              {product.discount ? (
                <span className="rounded-md bg-[#ffe9e9] px-1.5 py-[2px] text-[10.5px] leading-none font-bold text-[#e5484d]">
                  -{product.discount}%
                </span>
              ) : null}
            </div>
          ) : (
            <div className="h-[18px]" />
          )}

          <div className="mt-2 flex items-center gap-1.5 border-t border-[#f0f3f8] pt-2">
            {isCatalogShop ? (
              <Image
                src="/images/clinic/logo-tooth.png"
                alt=""
                width={22}
                height={22}
                className="size-[22px] shrink-0 rounded-full bg-[#F0FDFA] object-contain p-0.5"
              />
            ) : (
              <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[9px] font-bold text-[#0F766E]">
                {sellerInitials(sellerName)}
              </span>
            )}
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[11.5px] font-semibold text-[#1a1d26]">{sellerName}</span>
              <span className="block truncate text-[10.5px] text-[#8b93a7]">{deals} ta savdo</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onAdd}
            className="mt-2.5 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#0F766E] text-[13px] font-semibold text-white shadow-[0_3px_10px_rgba(15, 118, 110, 0.25)] transition-colors hover:bg-[#115E59]"
          >
            <ShoppingCart className="size-3.5" />
            Savatga
          </button>
        </div>
      </div>
    </article>
  );
}
