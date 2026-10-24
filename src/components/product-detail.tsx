"use client";

import { RichText } from "@/components/rich-text";
import { UzumCartBar, UzumHero, UzumPriceCard, UzumTitleCard, realGallery } from "@/components/product-uzum";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Package,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import { FormaProductCard } from "@/components/forma-product-card";
import { ProductCard } from "@/components/product-card";
import { SizeColorPickers } from "@/components/apparel-pickers";
import { apparelReady, defaultApparelColor, defaultApparelSize } from "@/data/forma";
import { getProductDetails, relatedProducts } from "@/data/product-details";
import { products, type Product } from "@/data/products";
import { productShop, shopHref } from "@/data/shops";
import { FormaProductMobile } from "@/components/forma-product-mobile";
import { FormaProductDesktop } from "@/components/forma-product-desktop";
import { JihozProductDesktop } from "@/components/jihoz-product-desktop";
import { ProductDetailDesktop } from "@/components/product-detail-desktop";
import { ProductReviewsList, useProductReviews } from "@/components/product-reviews";
import { cn } from "@/lib/utils";

type TabId = "tavsif" | "xususiyatlar" | "yetkazib" | "sharhlar";

function ProductDetailMobile({ product }: { product: Product }) {
  const details = getProductDetails(product);
  const rv = useProductReviews(product.id);
  const shop = productShop(product);
  const [tab, setTab] = useState<TabId>("tavsif");
  const [size, setSize] = useState(defaultApparelSize(product));
  const [color, setColor] = useState(defaultApparelColor(product));
  const [pickError, setPickError] = useState("");
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
  const stockChip = product.inStock
    ? details.stockQty >= 20
      ? "Omborda 20+"
      : `Omborda ${details.stockQty}`
    : "Buyurtma asosida";

  const tabs: { id: TabId; label: string }[] = [
    { id: "tavsif", label: "Tavsif" },
    { id: "xususiyatlar", label: "Xususiyatlar" },
    { id: "yetkazib", label: "Yetkazib berish" },
    { id: "sharhlar", label: "Sharhlar" },
  ];

  const tabsRef = useRef<HTMLElement>(null);
  const hasPickers = Boolean(product.sizes?.length || product.colors?.length);

  return (
    <div className="pb-2" data-testid="uzum-pdp">
      <UzumHero product={product} gallery={realGallery(product)} backHref={product.category === "forma" ? "/forma" : "/marketplace"} />
      <UzumPriceCard product={product} />
      <div className="mt-2.5">
        <UzumTitleCard
          product={product}
          rv={rv}
          original={details.certified || details.officialImport}
          brandHref={shop ? shopHref(shop.slug) : undefined}
          onReviews={() => {
            setTab("sharhlar");
            tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      </div>

      <div className="-mx-4 mt-2.5 space-y-4 rounded-[24px] bg-white p-4" data-testid="uzum-options">
        {/* Real stock / delivery facts */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dcfce7] bg-[#f0fdf4] px-3 py-1.5 text-[12.5px] font-semibold text-[#15803d]">
            <Package className="size-3.5" />
            {stockChip}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8eef8] bg-[#f7f9fc] px-3 py-1.5 text-[12.5px] font-semibold text-[#374151]">
            <Truck className="size-3.5 text-[#0F766E]" />
            {product.delivery || "Toshkent 24 soat"}
          </span>
          {details.officialImport ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F0FDFA] bg-[#f5f9ff] px-3 py-1.5 text-[12.5px] font-semibold text-[#0F766E]">
              <ShieldCheck className="size-3.5" />
              Rasmiy import
            </span>
          ) : null}
        </div>

        {hasPickers ? (
          <div>
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
          </div>
        ) : null}
        {pickError ? <p className="text-sm text-destructive">{pickError}</p> : null}

        {/* Seller mini-card */}
        {shop ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[#eceff5] bg-white p-3.5">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#F0FDFA] text-[#0F766E]">
              <Store className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-[14px] font-bold text-[#1a1d26]">{shop.name}</p>
                <BadgeCheck className="size-4 shrink-0 fill-[#0F766E] text-white" />
              </div>
              <p className="mt-0.5 text-[12px] text-[#8b93a7]">Tasdiqlangan do‘kon</p>
            </div>
            <Link
              href={shopHref(shop.slug)}
              className="shrink-0 rounded-xl border border-[#e6eaf2] bg-white px-3 py-2 text-[12.5px] font-semibold text-[#0F766E]"
            >
              Do‘kon
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-[#eceff5] bg-white p-3.5">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#f2f4f7] text-[#8b93a7]">
              <Store className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold text-[#1a1d26]">{product.brand}</p>
              <p className="mt-0.5 text-[12px] text-[#8b93a7]">StomaHub katalogi</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-6">
      {/* Tabs */}
      <section ref={tabsRef} className="scroll-mt-4 overflow-hidden rounded-2xl border border-[#eceff5] bg-white">
        <div className="flex gap-1 overflow-x-auto border-b border-[#eceff5] px-2 sm:gap-2 sm:px-4">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "shrink-0 border-b-2 px-3 py-3.5 text-[14px] font-semibold transition sm:px-4",
                tab === item.id
                  ? "border-[#0F766E] text-[#0F766E]"
                  : "border-transparent text-[#8b93a7] hover:text-[#4b5568]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="p-5 sm:p-6">
          <div className="min-w-0 text-[14px] leading-relaxed text-[#4b5568]">
            {tab === "tavsif" ? (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div>
                  <RichText text={details.description} />
                  <p className="mt-5 text-[15px] font-semibold text-[#1a1d26]">Afzalliklari</p>
                  <ul className="mt-2.5 space-y-2">
                    {details.benefits.map((b) => (
                      <li key={b} className="flex gap-2.5">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#0F766E]" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <aside className="rounded-xl border border-[#e8eef8] bg-[#f7f9fc] p-4">
                  <p className="text-[12px] font-bold tracking-wide text-[#8b93a7] uppercase">
                    Klinik qo‘llanish
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#4b5568]">{details.usage}</p>
                </aside>
              </div>
            ) : null}

            {tab === "xususiyatlar" ? (
              <div className="overflow-hidden rounded-xl border border-[#eceff5]">
                <dl className="divide-y divide-[#f0f2f7]">
                  {details.specs.map((row, i) => (
                    <div
                      key={row.label}
                      className={cn(
                        "grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-4",
                        i % 2 === 0 ? "bg-white" : "bg-[#fafbfd]",
                      )}
                    >
                      <dt className="text-[13px] text-[#8b93a7]">{row.label}</dt>
                      <dd className="text-[14px] font-medium text-[#1a1d26]">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            {tab === "yetkazib" ? (
              <div className="max-w-2xl space-y-3">
                <p>{details.delivery}</p>
                <ul className="space-y-2 text-[13.5px]">
                  <li className="flex gap-2">
                    <Truck className="mt-0.5 size-4 shrink-0 text-[#0F766E]" />
                    Toshkent ichida 24 soat
                  </li>
                  <li className="flex gap-2">
                    <Package className="mt-0.5 size-4 shrink-0 text-[#0F766E]" />
                    Viloyatlarga 2–3 ish kuni
                  </li>
                </ul>
              </div>
            ) : null}

            {tab === "sharhlar" ? <ProductReviewsList data={rv} columns={2} /> : null}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-bold text-[#1a1d26] sm:text-[20px]">O‘xshash mahsulotlar</h2>
          <Link
            href={product.category === "forma" ? "/forma" : "/marketplace"}
            className="text-[13px] font-semibold text-[#0F766E] hover:underline"
          >
            Barchasini ko‘rish
          </Link>
        </div>
        {/* Mobile: same 2-col card grid as Marketplace list */}
        <div className="grid grid-cols-2 gap-2.5 lg:hidden">
          {related.map((item) =>
            item.category === "forma" ? (
              <FormaProductCard key={item.id} product={item} variant="mobile" />
            ) : (
              <ProductCard key={item.id} product={item} variant="mobile" />
            ),
          )}
        </div>
        {/* Desktop: Marketplace desktop grid */}
        <div className="hidden gap-3 lg:grid lg:grid-cols-3 xl:grid-cols-4">
          {related.map((item) =>
            item.category === "forma" ? (
              <FormaProductCard key={item.id} product={item} />
            ) : (
              <ProductCard key={item.id} product={item} />
            ),
          )}
        </div>
      </section>

      </div>

      <UzumCartBar
        product={product}
        meta={{ size: size || undefined, color: color || undefined }}
        onAdd={() => {
          if (!apparelReady(product, size, color)) {
            setPickError("Savatga qo‘shishdan oldin o‘lcham va rangni tanlang.");
            window.setTimeout(() => document.querySelector("[data-testid=uzum-options]")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
            return false;
          }
          return true;
        }}
      />
    </div>
  );
}

export function ProductDetail({ product }: { product: Product }) {
  return (
    <>
      <div className="lg:hidden">
        {product.category === "forma" ? <FormaProductMobile product={product} /> : <ProductDetailMobile product={product} />}
      </div>
      <div className="hidden lg:block">
        {product.category === "forma" ? (
          <FormaProductDesktop product={product} />
        ) : product.category === "jihozlar" ? (
          <JihozProductDesktop product={product} />
        ) : (
          <ProductDetailDesktop product={product} />
        )}
      </div>
    </>
  );
}
