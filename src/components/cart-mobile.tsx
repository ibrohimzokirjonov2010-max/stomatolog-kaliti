"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  PlusCircle,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { shopDeliveryFee } from "@/lib/cart-totals";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { useBonusUse } from "@/components/bonus/bonus";
import { apparelMetaLabel } from "@/data/forma";
import { isRemoteImage, surplusCartMeta } from "@/data/surplus";
import { productHref } from "@/data/products";
import { productShop } from "@/data/shops";
import { cn } from "@/lib/utils";

function som(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU").replace(/,/g, " ")} so‘m`;
}

function Checkbox({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid size-[22px] shrink-0 place-items-center rounded-[6px] border-2 transition-colors",
        on ? "border-[#1f6bff] bg-[#1f6bff] text-white" : "border-[#c9d1df] bg-white text-transparent",
      )}
    >
      <Check className="size-3.5" strokeWidth={3.2} />
    </button>
  );
}

export function CartMobile() {
  const cart = useCart();
  const favorites = useFavorites();
  const { items, count, setQty, remove, clear, isSelected, toggleSelected } = cart;
  const { selectedItems, selectedCount, selectedSubtotal } = cart;
  const bonus = useBonusUse(selectedItems.map((i) => ({ productId: i.product.id, qty: i.qty })));
  const delivery = shopDeliveryFee(selectedItems.map((item) => item.product));
  const total = Math.max(0, selectedSubtotal + delivery - bonus.applied);

  if (count === 0) {
    return (
      <div className="px-3 pt-3 pb-6" data-testid="savat-mobile">
        <h1 className="text-[30px] font-extrabold tracking-tight text-[#0B1220]">Savat</h1>
        <p className="mt-0.5 text-[14px] text-[#7a8397]">Tanlangan mahsulotlar ro‘yxati</p>
        <div className="mt-4 rounded-[16px] bg-white px-6 py-14 text-center shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#1f6bff]">
            <ShoppingBag className="size-7" />
          </span>
          <p className="mt-4 text-[17px] font-bold text-[#0B1220]">Savat bo‘sh</p>
          <p className="mt-1 text-[14px] text-[#7a8397]">Marketplace, Forma yoki ortiqcha materialdan mahsulot qo‘shing.</p>
          <Link
            href="/marketplace"
            className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1f6bff] px-6 text-[15px] font-semibold text-white"
          >
            Xaridni boshlash <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-1 -mt-1 pb-5" data-testid="savat-mobile">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[30px] leading-none font-extrabold tracking-tight text-[#0B1220]">Savat</h1>
            <span className="rounded-full bg-[#eef1f6] px-2.5 py-1 text-[12.5px] font-medium text-[#4b5568]">
              {count} ta mahsulot
            </span>
          </div>
          <p className="mt-2 text-[14px] text-[#7a8397]">Tanlangan mahsulotlar ro‘yxati</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Savatdagi barcha mahsulotlar o‘chirilsinmi?")) clear();
          }}
          className="mt-0.5 inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-[#dfe4ec] bg-white px-3.5 text-[13px] font-medium text-[#1a1d26]"
        >
          <Trash2 className="size-4" />
          Savatni tozalash
        </button>
      </div>

      {/* Items */}
      <ul className="mt-3 space-y-2.5">
        {items.map(({ product, qty, max, lineTotal, key, size, color, source, expiryMonths }) => {
          const on = isSelected(key);
          const shop = productShop(product);
          const meta =
            apparelMetaLabel(size, color) ||
            surplusCartMeta(source, expiryMonths) ||
            [product.subcategory, product.sku].filter(Boolean).join(" · ") ||
            product.brand;
          const hasOld = !!product.oldPrice && product.oldPrice > product.price;
          const fav = favorites.has(product.id);
          return (
            <li
              key={key}
              data-testid="savat-item"
              className={cn(
                "rounded-[16px] bg-white p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-opacity",
                !on && "opacity-70",
              )}
            >
              <div className="flex gap-2.5">
                <div className="flex items-center pl-0.5">
                  <Checkbox on={on} onClick={() => toggleSelected(key)} label={`${product.name} — tanlash`} />
                </div>
                <Link
                  href={productHref(product)}
                  className="flex size-[84px] shrink-0 items-center justify-center self-start overflow-hidden rounded-[12px] bg-[#f4f6fa]"
                >
                  {isRemoteImage(product.image) ? (
                    <img src={product.image} alt="" className="size-full object-contain p-1.5" />
                  ) : (
                    <Image src={product.image} alt="" width={180} height={180} className="size-full object-contain p-1.5" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <Link
                      href={productHref(product)}
                      className="line-clamp-2 min-w-0 flex-1 text-[15px] leading-snug font-bold text-[#0B1220]"
                    >
                      {product.name}
                    </Link>
                    {product.inStock ? (
                      <span className="shrink-0 rounded-full bg-[#e8f8ee] px-2 py-0.5 text-[11.5px] font-medium text-[#16a34a]">
                        Sotuvda
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-[#f1f3f7] px-2 py-0.5 text-[11.5px] font-medium text-[#7a8397]">
                        Mavjud emas
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[12.5px] text-[#1f6bff]">{shop?.name ?? product.brand}</p>
                  {meta ? <p className="truncate text-[12.5px] text-[#7a8397]">{meta}</p> : null}
                  <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[16px] font-extrabold text-[#1f6bff]">{som(product.price)}</span>
                    {hasOld ? (
                      <span className="text-[12px] text-[#9aa3b5] line-through">{som(product.oldPrice!)}</span>
                    ) : null}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 pl-[126px]">
                <div className="inline-flex h-8 shrink-0 items-center rounded-full border border-[#dfe4ec] bg-white">
                  <button
                    type="button"
                    className="grid size-8 place-items-center text-[#1a1d26] disabled:opacity-35"
                    onClick={() => setQty(key, qty - 1)}
                    disabled={qty <= 1}
                    aria-label="Kamaytirish"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-5 text-center text-[13.5px] font-semibold" data-testid="savat-qty">{qty}</span>
                  <button
                    type="button"
                    className="grid size-8 place-items-center text-[#1a1d26] disabled:opacity-35"
                    onClick={() => setQty(key, qty + 1)}
                    disabled={qty >= max}
                    aria-label="Ko‘paytirish"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <p className="min-w-0 flex-1 pl-1 text-[13px] leading-tight font-bold whitespace-nowrap text-[#0B1220]">{som(lineTotal)}</p>
                <button
                  type="button"
                  onClick={() => favorites.toggle(product.id)}
                  aria-label={fav ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"}
                  aria-pressed={fav}
                  className={cn("grid size-7 shrink-0 place-items-center", fav ? "text-[#ef4444]" : "text-[#4b5568]")}
                >
                  <Heart className="size-[19px]" fill={fav ? "currentColor" : "none"} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(key)}
                  aria-label="O‘chirish"
                  className="grid size-7 shrink-0 place-items-center text-[#4b5568]"
                >
                  <Trash2 className="size-[19px]" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Add more */}
      <Link
        href="/marketplace"
        className="mt-2.5 flex h-[44px] items-center gap-2.5 rounded-[14px] border border-[#e3e8f0] bg-[#f7f9fc] px-3.5 text-[14px] font-medium text-[#1f6bff]"
      >
        <PlusCircle className="size-[22px] fill-[#1f6bff] text-white" />
        Yana mahsulot qo‘shish
        <ChevronRight className="ml-auto size-4 text-[#9aa3b5]" />
      </Link>

      {/* Summary */}
      <section className="mt-2.5 rounded-[16px] bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[16px] font-bold text-[#0B1220]">Buyurtma summasi</h2>
          <span className="text-[12px] text-[#7a8397]">{selectedCount} ta mahsulot</span>
        </div>
        <dl className="mt-2.5 space-y-1.5 text-[13.5px] text-[#4b5568]">
          <div className="flex justify-between">
            <dt>Mahsulotlar</dt>
            <dd className="text-[#0B1220]">{som(selectedSubtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Yetkazib berish</dt>
            <dd className={delivery > 0 ? "font-medium text-[#0B1220]" : "font-medium text-[#16a34a]"}>{delivery > 0 ? som(delivery) : "Bepul"}</dd>
          </div>
          {bonus.applied > 0 ? (
            <div className="flex justify-between text-[#1f6bff]">
              <dt>Bonus</dt>
              <dd className="font-semibold">- {som(bonus.applied)}</dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-3 flex items-baseline justify-between border-t border-[#eceff5] pt-3">
          <span className="text-[17px] font-bold text-[#0B1220]">Jami</span>
          <span className="text-[18px] font-extrabold text-[#0B1220]" data-testid="savat-total">{som(total)}</span>
        </div>
        {selectedItems.length > 0 ? (
          <Link
            href="/buyurtma"
            className="mt-3.5 flex h-[50px] items-center justify-center gap-2 rounded-full bg-[#1f6bff] text-[15.5px] font-semibold text-white shadow-[0_6px_16px_rgba(31,107,255,0.28)]"
          >
            Buyurtma berish <ArrowRight className="size-[18px]" />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="mt-3.5 flex h-[50px] w-full items-center justify-center rounded-full bg-[#c9d6f0] text-[15px] font-semibold text-white"
          >
            Mahsulot tanlang
          </button>
        )}
        <Link
          href="/marketplace"
          className="mt-2 flex h-[46px] items-center justify-center rounded-full border border-[#dfe4ec] bg-white text-[14.5px] font-medium text-[#0B1220]"
        >
          Xaridni davom ettirish
        </Link>
      </section>

    </div>
  );
}
