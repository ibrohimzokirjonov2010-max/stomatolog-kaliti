"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import { apparelMetaLabel } from "@/data/forma";
import { isRemoteImage, surplusCartMeta } from "@/data/surplus";
import { productHref } from "@/data/products";
import { productShop, shopHref } from "@/data/shops";
import { shopDeliveryFee } from "@/lib/cart-totals";
import { formatMoney } from "@/lib/format";
import { BonusUseCard, useBonusUse } from "@/components/bonus/bonus";
import { cn } from "@/lib/utils";
import { CartMobile } from "@/components/cart-mobile";

export function CartBrowse() {
  const { items, count, subtotal, setQty, remove, clear } = useCart();
  const bonus = useBonusUse(items.map((i) => ({ productId: i.product.id, qty: i.qty })));
  const delivery = shopDeliveryFee(items.map((item) => item.product));
  const payable = Math.max(0, subtotal + delivery - bonus.applied);

  return (
    <>
    <div className="lg:hidden">
      <CartMobile />
    </div>
    <div className="hidden lg:block">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <header>
          <h1 className="text-[26px] font-bold tracking-tight text-[#1a1d26]">Savat</h1>
          <p className="mt-1 text-sm text-[#8b93a7]">
            {count ? `${count} ta mahsulot` : "Savat hozircha bo‘sh"}
          </p>
        </header>
        {count ? (
          <button type="button" onClick={clear} className="text-sm font-medium text-[#8b93a7] hover:text-[#ef4444]">
            Savatni tozalash
          </button>
        ) : null}
      </div>

      {count === 0 ? (
        <div className="rounded-[16px] border border-[#eceff5] bg-white px-6 py-16 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#0066FF]">
            <ShoppingBag className="size-6" />
          </span>
          <p className="mt-4 text-[16px] font-semibold text-[#1a1d26]">Savat bo‘sh</p>
          <p className="mt-1 text-sm text-[#8b93a7]">Marketplace, Forma yoki ortiqcha materialdan mahsulot qo‘shing.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/marketplace" className={cn(buttonVariants(), "h-10 !rounded-xl px-4")}>
              Xaridni davom ettirish
            </Link>
            <Link href="/forma" className={cn(buttonVariants({ variant: "outline" }), "h-10 !rounded-xl px-4")}>
              Forma
            </Link>
            <Link href="/ortiqcha-material" className={cn(buttonVariants({ variant: "outline" }), "h-10 !rounded-xl px-4")}>
              Ortiqcha material
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <ul className="space-y-3">
            {items.map(({ product, qty, max, lineTotal, key, size, color, source, expiryMonths }) => (
              <li
                key={key}
                className="flex gap-3 rounded-[14px] border border-[#eceff5] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                <Link
                  href={productHref(product)}
                  className="flex size-[88px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f7f9fc]"
                >
                  {isRemoteImage(product.image) ? (
                    <img src={product.image} alt="" className="size-full object-contain p-2" />
                  ) : (
                    <Image src={product.image} alt="" width={160} height={160} className="size-full object-contain p-2" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-[#8b93a7]">{product.brand}</p>
                  <Link href={productHref(product)} className="line-clamp-2 text-[14px] font-semibold text-[#1a1d26] hover:text-[#0066FF]">
                    {product.name}
                  </Link>
                  {productShop(product) ? (
                    <Link href={shopHref(productShop(product)!.slug)} className="mt-0.5 text-[12px] font-medium text-[#0066FF]">
                      {productShop(product)!.name}
                    </Link>
                  ) : null}
                  {size || color ? (
                    <p className="mt-0.5 text-[12px] text-[#8b93a7]">{apparelMetaLabel(size, color)}</p>
                  ) : null}
                  {surplusCartMeta(source, expiryMonths) ? (
                    <p className="mt-0.5 text-[12px] font-medium text-[#0066FF]">{surplusCartMeta(source, expiryMonths)}</p>
                  ) : null}
                  <p className="mt-1 text-[15px] font-bold text-[#0066FF]">{formatMoney(product.price, "UZS")}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="inline-flex h-9 items-center rounded-xl border border-[#e6eaf2]">
                      <button
                        type="button"
                        className="grid size-9 place-items-center text-[#6b7280]"
                        onClick={() => setQty(key, qty - 1)}
                        aria-label="Kamaytirish"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">{qty}</span>
                      <button
                        type="button"
                        className="grid size-9 place-items-center text-[#6b7280] disabled:opacity-40"
                        onClick={() => setQty(key, qty + 1)}
                        disabled={qty >= max}
                        aria-label="Ko‘paytirish"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <p className="text-[13px] font-semibold text-[#1a1d26]">{formatMoney(lineTotal, "UZS")}</p>
                    <button
                      type="button"
                      onClick={() => remove(key)}
                      className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-[#8b93a7] hover:text-[#ef4444]"
                    >
                      <Trash2 className="size-3.5" />
                      O‘chirish
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-[16px] border border-[#eceff5] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h2 className="text-[15px] font-semibold text-[#1a1d26]">Buyurtma summasi</h2>
            <dl className="mt-3 space-y-2 text-[13.5px]">
              <div className="flex justify-between text-[#4b5568]">
                <dt>Mahsulotlar</dt>
                <dd>{formatMoney(subtotal, "UZS")}</dd>
              </div>
              <div className="flex justify-between text-[#4b5568]">
                <dt>Yetkazib berish</dt>
                <dd className={delivery > 0 ? "font-medium text-[#1a1d26]" : "font-medium text-[#16a34a]"}>{delivery > 0 ? formatMoney(delivery, "UZS") : "Bepul"}</dd>
              </div>
              {bonus.applied > 0 ? (
                <div className="flex justify-between text-[#0066FF]">
                  <dt>Bonus</dt>
                  <dd className="font-semibold">−{formatMoney(bonus.applied, "UZS")}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-[#eceff5] pt-2 text-[16px] font-bold text-[#1a1d26]">
                <dt>{bonus.applied > 0 ? "To‘lanadi" : "Jami"}</dt>
                <dd>{formatMoney(payable, "UZS")}</dd>
              </div>
            </dl>
            <BonusUseCard use={bonus} className="mt-3" />
            <Link href="/buyurtma" className={cn(buttonVariants(), "mt-4 h-11 w-full !rounded-xl")}>
              Buyurtma berish
            </Link>
            <Link
              href="/marketplace"
              className={cn(buttonVariants({ variant: "outline" }), "mt-2 h-10 w-full !rounded-xl")}
            >
              Xaridni davom ettirish
            </Link>
            <Link href="/forma" className="mt-2 block text-center text-sm font-medium text-[#0066FF] hover:underline">
              Forma katalogi
            </Link>
            <p className="mt-3 text-[12px] leading-relaxed text-[#8b93a7]">
              To‘lov yetkazib berilganda naqd qilinadi.
            </p>
          </aside>
        </div>
      )}
    </div>
    </>
  );
}
