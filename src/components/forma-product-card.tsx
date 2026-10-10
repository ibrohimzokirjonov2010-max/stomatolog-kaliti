"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Check, Heart, ShoppingCart, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormaAddSheet } from "@/components/forma-add-sheet";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import {
  apparelReady,
  colorLabel,
  defaultApparelColor,
  defaultApparelSize,
  deliveryShort,
  formaColors,
  isBestseller,
  isNewForma,
  stockLabel,
} from "@/data/forma";
import { productHref, type Product } from "@/data/products";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function FormaProductCard({
  product,
  presetSize,
  presetColor,
  variant = "desktop",
}: {
  product: Product;
  presetSize?: string;
  presetColor?: string;
  variant?: "desktop" | "mobile";
}) {
  const { add } = useCart();
  const favorites = useFavorites();
  const saved = favorites.has(product.id);
  const href = productHref(product);
  const [sheet, setSheet] = useState(false);
  const [pickedSize, setPickedSize] = useState(defaultApparelSize(product, presetSize));
  const [pickedColor, setPickedColor] = useState("");

  useEffect(() => {
    setPickedSize(defaultApparelSize(product, presetSize));
  }, [product, presetSize]);

  function onAdd(sizeOverride?: string) {
    const size = sizeOverride ?? (pickedSize || defaultApparelSize(product, presetSize));
    const color = defaultApparelColor(product, presetColor);
    if (apparelReady(product, size, color)) {
      add(product.id, product.listedBySeller ? product : undefined, 1, { size: size || undefined, color: color || undefined });
      return;
    }
    setSheet(true);
  }

  if (variant === "mobile") {
    const mColors = product.colors ?? [];
    const shown = mColors.slice(0, 4);
    const more = mColors.length - shown.length;
    const mBadge = product.discount
      ? { text: `-${product.discount}%`, cls: "bg-[#ef4444]" }
      : isNewForma(product)
        ? { text: "Yangi", cls: "bg-[#16a34a]" }
        : null;
    return (
      <article data-testid="forma-card" className="flex flex-col overflow-hidden rounded-[18px] border border-[#eceff5] bg-white p-2 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
        <div className="relative">
          {mBadge ? (
            <span className={cn("absolute top-2 left-2 z-10 rounded-md px-1.5 py-[3px] text-[10.5px] leading-none font-bold text-white", mBadge.cls)}>
              {mBadge.text}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => favorites.toggle(product.id)}
            className="absolute top-1.5 right-1.5 z-10 grid size-8 place-items-center rounded-full bg-white text-[#94a3b8] shadow-sm"
            aria-label="Sevimlilarga"
            aria-pressed={saved}
          >
            <Heart className={cn("size-4", saved && "fill-[#f43f5e] text-[#f43f5e]")} />
          </button>
          <Link href={href} className="block overflow-hidden rounded-[14px] bg-[#f3f5f9]">
            <Image src={product.image} alt={product.name} width={320} height={320} className="aspect-[4/5] w-full object-cover" />
          </Link>
        </div>

        {mColors.length ? (
          <div className="mt-2 flex items-center gap-1 px-0.5" aria-label="Ranglar">
            {shown.map((id) => (
              <span
                key={id}
                title={colorLabel(id)}
                className={cn("size-3.5 rounded-full border", id === "white" ? "border-slate-300" : "border-black/10")}
                style={{ backgroundColor: formaColors.find((c) => c.id === id)?.hex ?? "#cbd5e1" }}
              />
            ))}
            {more > 0 ? <span className="text-[11px] font-medium text-[#8b93a7]">+{more}</span> : null}
          </div>
        ) : null}

        <Link href={href} className="mt-1.5 block min-w-0 px-0.5">
          <h3 className="line-clamp-2 min-h-[34px] text-[13px] leading-[17px] font-bold text-[#1a1d26]">{product.name}</h3>
        </Link>
        <p className="mt-0.5 truncate px-0.5 text-[11.5px] text-[#8b93a7]">{product.brand}</p>
        {product.reviews > 0 ? (
          <p className="mt-1 flex items-center gap-1 px-0.5 text-[11.5px]">
            <Star className="size-3.5 fill-[#f5b942] text-[#f5b942]" />
            <span className="font-semibold text-[#1a1d26]">{product.rating.toFixed(1)}</span>
            <span className="text-[#8b93a7]">({product.reviews})</span>
          </p>
        ) : (
          <p className="mt-1 flex items-center gap-1 px-0.5 text-[11.5px] text-[#8b93a7]" data-testid="forma-card-norating">
            <Star className="size-3.5 text-[#cdd5e4]" />
            Hali baho yo‘q
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-1.5 px-0.5 pt-2">
          <div className="min-w-0">
            <p className="text-[14px] leading-tight font-extrabold text-[#0B1F4D]">{formatMoney(product.price, "UZS")}</p>
            {product.oldPrice ? <p className="mt-0.5 text-[11px] leading-none text-[#9aa3b2] line-through">{formatMoney(product.oldPrice, "UZS")}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => onAdd()}
            aria-label="Savatga qo‘shish"
            data-testid="forma-card-add"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0066FF] text-white shadow-[0_6px_14px_rgba(0,102,255,0.28)]"
          >
            <ShoppingCart className="size-[18px]" />
          </button>
        </div>

        {sheet ? (
          <FormaAddSheet product={product} presetSize={pickedSize || presetSize} presetColor={presetColor} onClose={() => setSheet(false)} />
        ) : null}
      </article>
    );
  }

  const colors = product.colors ?? [];
  const sizes = product.sizes ?? [];
  const activeColor = pickedColor || defaultApparelColor(product, presetColor);
  const bestseller = isBestseller(product);
  const fresh = isNewForma(product);
  const badge = bestseller
    ? { text: "Bestseller", cls: "bg-[#0066FF]" }
    : product.discount
      ? { text: `-${product.discount}%`, cls: "bg-[#ef4444]" }
      : fresh
        ? { text: "Yangi", cls: "bg-[#16a34a]" }
        : null;

  function onAddDesktop() {
    const size = pickedSize || defaultApparelSize(product, presetSize);
    const color = activeColor;
    if (apparelReady(product, size, color)) {
      add(product.id, product.listedBySeller ? product : undefined, 1, { size: size || undefined, color: color || undefined });
      return;
    }
    setSheet(true);
  }

  return (
    <article className="flex flex-col rounded-[14px] border border-[#eceff5] bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.09)]">
      <div className="relative overflow-hidden rounded-xl bg-[#f7f9fc]">
        {badge ? (
          <span className={cn("absolute top-2 left-2 z-10 rounded-md px-2 py-[3px] text-[10.5px] leading-none font-bold text-white", badge.cls)}>
            {badge.text}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => favorites.toggle(product.id)}
          className="absolute top-2 right-2 z-10 flex size-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm hover:text-[#f43f5e]"
          aria-label="Sevimlilarga"
          aria-pressed={saved}
        >
          <Heart className={cn("size-4", saved && "fill-[#f43f5e] text-[#f43f5e]")} />
        </button>
        <Link href={href} className="block">
          <Image
            src={product.image}
            alt={product.name}
            width={480}
            height={360}
            className="aspect-square w-full object-contain mix-blend-multiply"
          />
        </Link>
      </div>

      <p className="mt-3 inline-flex items-center gap-1 text-[11px] font-extrabold tracking-wide text-[#0B1F4D] uppercase">
        {product.brand}
        <BadgeCheck className="size-3.5 fill-[#0066FF] text-white" />
      </p>
      <Link href={href} className="mt-0.5 block">
        <h3 className="line-clamp-2 min-h-[36px] text-[13.5px] leading-[18px] font-semibold text-[#1a1d26] hover:text-[#0066FF]">{product.name}</h3>
      </Link>
      {product.reviews > 0 ? (
        <p className="mt-1 flex items-center gap-1 text-[12px]">
          <Star className="size-3.5 fill-[#f5b942] text-[#f5b942]" />
          <span className="font-semibold text-[#1a1d26]">{product.rating.toFixed(1)}</span>
          <span className="text-[#8b93a7]">({product.reviews})</span>
        </p>
      ) : null}

      {sizes.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {sizes.map((item) => {
            const on = pickedSize === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setPickedSize(on ? "" : item)}
                aria-pressed={on}
                className={cn(
                  "h-6 min-w-7 rounded-md border px-1.5 text-[10.5px] font-semibold transition-colors",
                  on ? "border-[#0066FF] bg-[#0066FF] text-white" : "border-[#e6eaf2] bg-white text-[#4b5568] hover:border-[#0066FF]/50",
                )}
              >
                {item}
              </button>
            );
          })}
        </div>
      ) : null}
      {colors.length ? (
        <div className="mt-2 flex items-center gap-1.5">
          {colors.map((id) => {
            const on = activeColor === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPickedColor(on && colors.length > 1 ? "" : id)}
                title={colorLabel(id)}
                aria-label={colorLabel(id)}
                className={cn(
                  "size-[18px] rounded-full border",
                  id === "white" ? "border-slate-300" : "border-transparent",
                  on && "ring-2 ring-[#0066FF] ring-offset-1",
                )}
                style={{ backgroundColor: formaColors.find((c) => c.id === id)?.hex ?? "#cbd5e1" }}
              />
            );
          })}
        </div>
      ) : null}

      <div className="mt-2 space-y-0.5 text-[11.5px]">
        <p className="flex items-center gap-1 font-medium text-[#16a34a]">
          <Check className="size-3.5" strokeWidth={2.6} />
          {stockLabel(product)}
        </p>
        <p className="flex items-center gap-1 text-[#0066FF]">
          <Truck className="size-3.5" />
          {deliveryShort(product)}
        </p>
      </div>

      <div className="mt-auto pt-2.5">
        <div className="flex flex-wrap items-baseline gap-1.5">
          <p className="text-[16px] font-extrabold text-[#0B1F4D]">{formatMoney(product.price, "UZS")}</p>
          {product.oldPrice ? <p className="text-[12px] text-[#9aa3b2] line-through">{formatMoney(product.oldPrice, "UZS")}</p> : null}
        </div>
        <Button type="button" className="mt-2 h-9 w-full !rounded-[10px]" onClick={onAddDesktop}>
          <ShoppingCart className="size-3.5" />
          Savatga qo‘shish
        </Button>
      </div>
      {sheet ? (
        <FormaAddSheet
          product={product}
          presetSize={pickedSize || presetSize}
          presetColor={activeColor || presetColor}
          onClose={() => setSheet(false)}
        />
      ) : null}
    </article>
  );
}
