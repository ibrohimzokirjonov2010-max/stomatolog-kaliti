"use client";
/* eslint-disable @next/next/no-img-element -- phone cards use fixed-size thumbs */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { brandLetters } from "@/data/desktop-brands";
import { fetchCatalogProducts, type CatalogCard } from "@/lib/catalog-client";
import { marketHref } from "@/data/desktop-shop";
import { formatMoney } from "@/lib/format";

type LiveBrand = { slug: string; name: string; count: number };

function useCatalog() {
  const [products, setProducts] = useState<CatalogCard[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let stop = false;
    void fetchCatalogProducts().then((rows) => {
      if (stop) return;
      setProducts(rows);
      setReady(true);
    });
    return () => {
      stop = true;
    };
  }, []);
  return { products, ready };
}

function brandsOf(products: CatalogCard[]) {
  const map = new Map<string, LiveBrand>();
  for (const item of products) {
    const prev = map.get(item.brandKey);
    if (prev) prev.count += 1;
    else map.set(item.brandKey, { slug: item.brandKey, name: item.brand, count: 1 });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "uz"));
}

/** Simple phone fallback. The desktop page is drawn by the shop overlay. */
export function BrandsMobile({ slug }: { slug?: string }) {
  if (slug) return <MobileDetail slug={slug} />;
  return <MobileDirectory />;
}

function MobileDirectory() {
  const { products, ready } = useCatalog();
  const [q, setQ] = useState("");
  const [letter, setLetter] = useState("");
  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    return brandsOf(products).filter((item) => {
      if (letter && !item.name.toUpperCase().startsWith(letter)) return false;
      if (query && !item.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [letter, products, q]);

  return (
    <div className="space-y-3 lg:hidden" data-testid="brands-mobile">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-[#0f1e3d]">Brendlar</h1>
        <p className="text-[13px] text-[#6a7c93]">Marketplace’dagi haqiqiy e’lonlar</p>
      </div>
      <label className="flex h-11 items-center gap-2 rounded-xl border border-[#e6edf5] bg-white px-3">
        <Search className="size-4 text-[#8b9bb0]" />
        <input className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" aria-label="Brend nomi" value={q} placeholder="Brend nomi bo‘yicha qidiring..." onChange={(event) => setQ(event.target.value)} />
      </label>
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
      {!ready || items.length === 0 ? (
        <p className="rounded-xl bg-white px-4 py-8 text-center text-[14px] text-[#6a7c93]">{!ready ? "Yuklanmoqda..." : "Hozircha brend yo‘q"}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <Link key={item.slug} href={`/marketplace/brendlar/${item.slug}`} className="rounded-xl bg-white p-3 shadow-sm">
              <b className="block text-[14px] text-[#0f1e3d]">{item.name}</b>
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
  const { products, ready } = useCatalog();
  const brand = brandsOf(products).find((item) => item.slug === slug);
  const rows = products.filter((item) => item.brandKey === slug);
  return (
    <div className="space-y-3 lg:hidden" data-testid="brand-mobile">
      <Link href="/marketplace/brendlar" className="text-[13px] font-bold text-[#0066ff]">
        ← Brendlar
      </Link>
      {!ready ? (
        <p className="rounded-xl bg-white px-4 py-8 text-center">Yuklanmoqda...</p>
      ) : !brand ? (
        <p className="rounded-xl bg-white px-4 py-8 text-center">Brend topilmadi</p>
      ) : (
        <>
          <div className="rounded-xl bg-white p-4">
            <h1 className="text-[20px] font-extrabold">{brand.name}</h1>
            <p className="mt-1 text-[13px] text-[#6a7c93]">{brand.count} ta mahsulot</p>
          </div>
          {rows.length === 0 ? (
            <p className="rounded-xl bg-white px-4 py-8 text-center text-[14px] text-[#6a7c93]">Hozircha mahsulot yo‘q</p>
          ) : (
            rows.map((item) => (
              <Link key={item.id} href={marketHref(item.id)} className="flex items-center gap-3 rounded-xl bg-white p-3">
                {item.image ? <img src={item.image} alt="" className="size-14 rounded-lg bg-[#f4f7fb] object-contain" /> : <span className="size-14 rounded-lg bg-[#f4f7fb]" />}
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
