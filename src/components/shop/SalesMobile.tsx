"use client";
/* eslint-disable @next/next/no-img-element -- phone cards use fixed-size thumbs */

import { useMemo, useState } from "react";
import { Heart, Search, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { filterSales, saleCategories, saleProducts, sortSales, type SaleCategory, type SaleSort } from "@/data/desktop-sales";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/data/products";

/** Simple phone fallback. The desktop sale page is the shop overlay. */
export function SalesMobile() {
  const { add } = useCart();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<SaleCategory | "">("");
  const [sort, setSort] = useState<SaleSort>("mashhurlik");
  const items = useMemo(() => sortSales(filterSales(saleProducts, { q, category }), sort), [q, category, sort]);

  return (
    <div className="space-y-3 lg:hidden" data-testid="sales-mobile">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-[#0f1e3d]">Aksiyalar</h1>
        <p className="text-[13px] text-[#6a7c93]">Maxsus takliflar va chegirmalar</p>
      </div>
      <label className="flex h-11 items-center gap-2 rounded-xl border border-[#e6edf5] bg-white px-3">
        <Search className="size-4 text-[#8b9bb0]" />
        <input className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" aria-label="Aksiyalarda qidirish" value={q} placeholder="Aksiyalarda qidirish..." onChange={(event) => setQ(event.target.value)} />
      </label>
      <select className="h-11 w-full rounded-xl border border-[#e6edf5] bg-white px-3 text-[14px]" aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as SaleSort)}>
        <option value="mashhurlik">Mashhurlik bo‘yicha</option>
        <option value="chegirma">Chegirma %</option>
        <option value="arzon">Arzon</option>
        <option value="qimmat">Qimmat</option>
      </select>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button type="button" className={category === "" ? "h-8 shrink-0 rounded-full bg-[#0066ff] px-3 text-[12px] font-bold text-white" : "h-8 shrink-0 rounded-full bg-white px-3 text-[12px] font-bold text-[#5c6d84]"} onClick={() => setCategory("")}>
          Barchasi
        </button>
        {saleCategories.map((item) => (
          <button key={item.id} type="button" className={category === item.id ? "h-8 shrink-0 rounded-full bg-[#0066ff] px-3 text-[12px] font-bold text-white" : "h-8 shrink-0 rounded-full bg-white px-3 text-[12px] font-bold text-[#5c6d84]"} onClick={() => setCategory(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl bg-white px-4 py-8 text-center text-[14px] text-[#6a7c93]">Aksiya topilmadi</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl bg-white p-2.5 shadow-sm">
              <div className="relative h-24 overflow-hidden rounded-lg bg-[#f4f7fb]">
                <img src={item.image} alt="" className="h-full w-full object-contain" />
                <span className="absolute left-1.5 top-1.5 rounded-md bg-[#ef3b3b] px-1.5 text-[11px] font-bold text-white">-{item.discount}%</span>
                <Heart className="absolute right-1.5 top-1.5 size-4 text-[#8b9bb0]" />
              </div>
              <b className="mt-2 block text-[13px] leading-tight">{item.name}</b>
              <span className="mt-0.5 block text-[11px] text-[#8b9bb0]">{item.brand}</span>
              <span className="mt-1 block text-[13px] font-extrabold text-[#0066ff]">{formatMoney(item.price, "UZS")}</span>
              <button
                type="button"
                className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg bg-[#0066ff] text-[12px] font-bold text-white"
                onClick={() =>
                  add(item.id, {
                    id: item.id,
                    name: item.name,
                    brand: item.brand,
                    category: "materiallar",
                    price: item.price,
                    oldPrice: item.oldPrice,
                    discount: item.discount,
                    rating: item.rating,
                    reviews: item.reviews,
                    inStock: true,
                    delivery: "Toshkent 24 soat",
                    image: item.image,
                    stockQty: 20,
                  } satisfies Product)
                }
              >
                <ShoppingCart className="size-3.5" /> Savatga
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
