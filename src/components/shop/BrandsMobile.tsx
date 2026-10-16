"use client";
/* eslint-disable @next/next/no-img-element -- phone cards use fixed-size thumbs */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { brandCountries, brandLetters, deskBrands, filterDeskBrands, getDeskBrand } from "@/data/desktop-brands";
import { marketHref, marketProducts } from "@/data/desktop-shop";
import { formatMoney } from "@/lib/format";

/** Simple phone fallback. The desktop page is drawn by the shop overlay. */
export function BrandsMobile({ slug }: { slug?: string }) {
  if (slug) return <MobileDetail slug={slug} />;
  return <MobileDirectory />;
}

function MobileDirectory() {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [letter, setLetter] = useState("");
  const countries = useMemo(() => brandCountries(), []);
  const items = useMemo(() => filterDeskBrands(deskBrands, { q, country, letter }), [q, country, letter]);

  return (
    <div className="space-y-3 lg:hidden" data-testid="brands-mobile">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-[#0f1e3d]">Brendlar</h1>
        <p className="text-[13px] text-[#6a7c93]">Dunyoning yetakchi stomatologiya brendlari</p>
      </div>
      <label className="flex h-11 items-center gap-2 rounded-xl border border-[#e6edf5] bg-white px-3">
        <Search className="size-4 text-[#8b9bb0]" />
        <input className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" aria-label="Brend nomi" value={q} placeholder="Brend nomi bo‘yicha qidiring..." onChange={(event) => setQ(event.target.value)} />
      </label>
      <select className="h-11 w-full rounded-xl border border-[#e6edf5] bg-white px-3 text-[14px]" aria-label="Davlat" value={country} onChange={(event) => setCountry(event.target.value)}>
        <option value="">Barcha davlatlar</option>
        {countries.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button type="button" className={letter === "" ? "h-8 shrink-0 rounded-lg bg-[#0066ff] px-3 text-[12px] font-bold text-white" : "h-8 shrink-0 rounded-lg bg-white px-3 text-[12px] font-bold text-[#5c6d84]"} onClick={() => setLetter("")}>
          Barchasi
        </button>
        {brandLetters.map((item) => (
          <button key={item} type="button" className={letter === item ? "h-8 w-8 shrink-0 rounded-lg bg-[#0066ff] text-[12px] font-bold text-white" : "h-8 w-8 shrink-0 rounded-lg bg-white text-[12px] font-bold text-[#5c6d84]"} onClick={() => setLetter(item)}>
            {item}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl bg-white px-4 py-8 text-center text-[14px] text-[#6a7c93]">Brend topilmadi</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <Link key={item.slug} href={`/marketplace/brendlar/${item.slug}`} className="rounded-xl bg-white p-3 shadow-sm">
              <b className="block text-[14px] text-[#0f1e3d]">{item.name}</b>
              <span className="mt-1 block text-[12px] text-[#6a7c93]">
                {item.flag} {item.country}
              </span>
              <span className="mt-2 flex items-center justify-between text-[12px] font-bold text-[#0066ff]">
                {item.count} ta mahsulot
                <ChevronRight className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileDetail({ slug }: { slug: string }) {
  const brand = getDeskBrand(slug);
  const products = brand ? marketProducts.filter((item) => item.brandKey === brand.brandKey) : [];
  return (
    <div className="space-y-3 lg:hidden" data-testid="brand-mobile">
      <Link href="/marketplace/brendlar" className="text-[13px] font-bold text-[#0066ff]">
        ← Brendlar
      </Link>
      {!brand ? (
        <p className="rounded-xl bg-white px-4 py-8 text-center">Brend topilmadi</p>
      ) : (
        <>
          <div className="rounded-xl bg-white p-4">
            <h1 className="text-[20px] font-extrabold">{brand.name}</h1>
            <p className="mt-1 text-[13px] text-[#6a7c93]">
              {brand.flag} {brand.country} · {brand.count} ta mahsulot
            </p>
          </div>
          {products.length === 0 ? (
            <p className="rounded-xl bg-white px-4 py-8 text-center text-[14px] text-[#6a7c93]">Bu brend mahsulotlari katalogda tez orada qo‘shiladi.</p>
          ) : (
            products.map((item) => (
              <Link key={item.id} href={marketHref(item.id)} className="flex items-center gap-3 rounded-xl bg-white p-3">
                <img src={item.image} alt="" className="size-14 rounded-lg bg-[#f4f7fb] object-contain" />
                <span>
                  <b className="block text-[14px]">{item.name}</b>
                  <span className="text-[13px] font-bold text-[#0066ff]">{formatMoney(item.price, "UZS")}</span>
                </span>
              </Link>
            ))
          )}
        </>
      )}
    </div>
  );
}
