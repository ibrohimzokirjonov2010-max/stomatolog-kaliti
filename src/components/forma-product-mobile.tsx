"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Check, Clock, Gem, Grid3x3, Plus, ShieldCheck, Star, Truck, WashingMachine, Wind, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { FormaAddSheet } from "@/components/forma-add-sheet";
import { ProductReviewsList, useProductReviews } from "@/components/product-reviews";
import { RichText } from "@/components/rich-text";
import { UzumCartBar, UzumHero, UzumPriceCard, UzumTitleCard } from "@/components/product-uzum";
import { apparelReady, clothingSizes, colorLabel, defaultApparelColor, defaultApparelSize, deliveryShort, formaColors } from "@/data/forma";
import { getProductDetails, productMaxQty, relatedProducts } from "@/data/product-details";
import { productHref, productOldPrice, products, type Product } from "@/data/products";
import { productShop, shopHref } from "@/data/shops";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type TabId = "tavsif" | "xususiyatlar" | "sharhlar" | "yetkazib";

export function FormaProductMobile({ product }: { product: Product }) {
  const details = getProductDetails(product);
  const rv = useProductReviews(product.id);
  const shop = productShop(product);
  const cart = useCart();
  const favorites = useFavorites();
  const [size, setSize] = useState(defaultApparelSize(product));
  const [color, setColor] = useState(defaultApparelColor(product));
  const [pickError, setPickError] = useState("");
  const [tab, setTab] = useState<TabId>("tavsif");
  const [more, setMore] = useState(false);
  const [toast, setToast] = useState("");
  const [sizeChart, setSizeChart] = useState(false);
  const tabsRef = useRef<HTMLElement>(null);

  // Real images only (no generic filler pictures).
  const gallery = useMemo(() => [...new Set([product.image, ...(product.images ?? [])].filter(Boolean))], [product]);
  const colors = product.colors ?? [];
  const sizes = product.sizes ?? [];
  const stdSizes = sizes.some((s) => (["XS", ...clothingSizes] as string[]).includes(s));
  const shownSizes = stdSizes ? ["XS", ...clothingSizes] : sizes;
  const related = useMemo(() => relatedProducts(product).filter((p) => p.id !== product.id).slice(0, 6), [product]);
  const fallbackRelated = useMemo(
    () => (related.length ? related : products.filter((p) => p.category === "forma" && p.id !== product.id).slice(0, 6)),
    [related, product],
  );


  const tabs: { id: TabId; label: string }[] = [
    { id: "tavsif", label: "Tavsif" },
    { id: "xususiyatlar", label: "Xususiyatlar" },
    { id: "sharhlar", label: `Sharhlar (${rv.count})` },
    { id: "yetkazib", label: "Yetkazib berish" },
  ];

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  }

  const desc = details.description?.trim();

  return (
    <div className="pb-2" data-testid="forma-pdp-mobile">
      <UzumHero product={product} gallery={gallery} backHref="/forma" cover />
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

      <div className="-mx-4 mt-2.5 space-y-5 rounded-[24px] bg-white px-4 pt-4 pb-5" data-testid="uzum-options">
        {/* Color */}
        {colors.length ? (
          <div>
            <p className="mb-2 text-[14px] font-semibold text-[#1a1d26]">
              Rang{color ? <span className="font-normal text-[#6b7280]">: {colorLabel(color)}</span> : null}
            </p>
            <div className="flex flex-wrap gap-3">
              {colors.map((id) => {
                const on = color === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-label={colorLabel(id)}
                    aria-pressed={on}
                    onClick={() => {
                      setPickError("");
                      setColor(id);
                    }}
                    className={cn("grid size-10 place-items-center rounded-full border-2", on ? "border-[#0066FF]" : "border-transparent")}
                  >
                    <span
                      className={cn("grid size-8 place-items-center rounded-full border", id === "white" ? "border-slate-300" : "border-black/10")}
                      style={{ backgroundColor: formaColors.find((c) => c.id === id)?.hex ?? "#cbd5e1" }}
                    >
                      {on ? <Check className={cn("size-4", id === "white" ? "text-[#0066FF]" : "text-white")} strokeWidth={3} /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Size */}
        {sizes.length ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[14px] font-semibold text-[#1a1d26]">O‘lcham{size ? <span className="font-normal text-[#6b7280]">: {size}</span> : ":"}</p>
              {stdSizes ? (
                <button type="button" onClick={() => setSizeChart(true)} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0066FF]">
                  <Grid3x3 className="size-4" />
                  O‘lcham jadvali
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {shownSizes.map((item) => {
                const on = size === item;
                const off = !sizes.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={on}
                    disabled={off}
                    onClick={() => {
                      setPickError("");
                      setSize(item);
                    }}
                    className={cn(
                      "h-12 min-w-[52px] rounded-xl border px-3 text-[14px] font-semibold",
                      off ? "border-[#eef1f6] bg-[#f6f7fa] text-[#c3c9d6] line-through" : on ? "border-[#0066FF] bg-[#e8f1ff] text-[#0066FF]" : "border-[#e6eaf2] bg-white text-[#4b5568]",
                    )}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        {pickError ? <p className="text-[13px] text-destructive">{pickError}</p> : null}

        {/* Advantages (generic copy is hidden for seller-listed products) */}
        {product.listedBySeller ? null : (
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { icon: Gem, title: "Premium sifat", sub: "Uzoq muddatga xizmat qiladi." },
            { icon: Wind, title: "Nafas oladigan mato", sub: "Kun davomida qulaylik." },
            { icon: WashingMachine, title: "Oson yuviladi", sub: "Rang o‘zgarmaydi." },
            { icon: ShieldCheck, title: "Stomatologlar tavsiyasi", sub: "Klinik ish uchun mos." },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-start gap-2.5 rounded-2xl bg-[#f2f6ff] p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#dfeaff] text-[#0066FF]">
                <Icon className="size-[18px]" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="text-[12.5px] font-bold text-[#0B1F4D]">{title}</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-[#6b7280]">{sub}</p>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Tabs */}
        <section ref={tabsRef} className="scroll-mt-4">
          <div className="-mx-4 flex gap-5 overflow-x-auto border-b border-[#e8ecf4] px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn("shrink-0 border-b-2 py-3 text-[14px] font-semibold", tab === t.id ? "border-[#0066FF] text-[#0066FF]" : "border-transparent text-[#6b7280]")}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="pt-3.5 text-[14px] leading-relaxed text-[#4b5568]">
            {tab === "tavsif" ? (
              desc ? (
                <>
                  <div className={cn(!more && "line-clamp-4")}>
                    <RichText text={desc} />
                  </div>
                  {true ? (
                    <button type="button" onClick={() => setMore((v) => !v)} className="mt-1.5 inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#0066FF]">
                      {more ? "Yopish" : "Ko‘proq o‘qish"}
                      <ChevronDown className={cn("size-4 transition-transform", more && "rotate-180")} />
                    </button>
                  ) : null}
                </>
              ) : (
                <p className="text-[#8b93a7]">Tavsif kiritilmagan.</p>
              )
            ) : null}
            {tab === "xususiyatlar" ? (
              <dl className="divide-y divide-[#f0f2f7] overflow-hidden rounded-xl border border-[#eceff5]">
                {details.specs.map((row, i) => (
                  <div key={row.label} className={cn("flex justify-between gap-4 px-3.5 py-2.5", i % 2 ? "bg-[#fafbfd]" : "bg-white")}>
                    <dt className="text-[13px] text-[#8b93a7]">{row.label}</dt>
                    <dd className="text-right text-[13.5px] font-medium text-[#1a1d26]">{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {tab === "sharhlar" ? (
              rv.count > 0 ? <ProductReviewsList data={rv} columns={1} /> : <p className="rounded-2xl bg-[#f2f5fa] px-4 py-6 text-center text-[13px] text-[#8b93a7]">Hali sharh yo‘q.</p>
            ) : null}
            {tab === "yetkazib" ? <p>{details.delivery || product.delivery}</p> : null}
          </div>
        </section>

        {/* Bundle carousel */}
        {fallbackRelated.length > 0 ? (
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[16px] font-bold tracking-tight text-[#0B1F4D]">To‘plam bilan birga</h2>
              <Link href="/forma" className="inline-flex items-center text-[12.5px] font-semibold text-[#0066FF]">
                Barchasini ko‘rish <ChevronRight className="size-3.5" />
              </Link>
            </div>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {fallbackRelated.map((p) => (
                <BundleCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Delivery info row */}
        <div className="grid grid-cols-3 divide-x divide-[#e3e8f1] rounded-2xl bg-[#f3f5f9] py-3">
          {[
            { icon: Truck, title: "Toshkentdan yetkazib berish", sub: "Shahar bo‘ylab" },
            { icon: Clock, title: deliveryShort(product).replace(/^Toshkent( yetkazib berish)?:?\s*/i, "") || "24 soat", sub: "Yetkazib berish muddati" },
            { icon: ShieldCheck, title: "Xavfsiz buyurtma", sub: "Qabul qilgach tasdiqlanadi" },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={sub} className="flex flex-col items-center gap-1 px-2 text-center">
              <Icon className="size-5 text-[#0066FF]" strokeWidth={1.7} />
              <p className="text-[11.5px] leading-tight font-bold text-[#0B1F4D]">{title}</p>
              <p className="text-[10.5px] leading-tight text-[#6b7280]">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      <UzumCartBar
        product={product}
        meta={{ size: size || undefined, color: color || undefined }}
        onAdd={() => {
          if (apparelReady(product, size, color)) return true;
          setPickError(
            sizes.length && !size && colors.length && !color
              ? "Savatga qo‘shishdan oldin o‘lcham va rangni tanlang."
              : sizes.length && !size
                ? "Savatga qo‘shishdan oldin o‘lchamni tanlang."
                : "Savatga qo‘shishdan oldin rangni tanlang.",
          );
          window.setTimeout(() => document.querySelector("[data-testid=uzum-options]")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
          return false;
        }}
      />

      {sizeChart ? <SizeChart onClose={() => setSizeChart(false)} /> : null}

      {toast ? (
        <div role="status" className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[70] mx-auto w-fit rounded-full bg-[#0B1F4D] px-4 py-2 text-[13px] font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function BundleCard({ product }: { product: Product }) {
  const { add } = useCart();
  const [sheet, setSheet] = useState(false);

  function onAdd() {
    const size = defaultApparelSize(product);
    const color = defaultApparelColor(product);
    if (apparelReady(product, size, color)) {
      add(product.id, product.listedBySeller ? product : undefined, 1, { size: size || undefined, color: color || undefined });
      return;
    }
    setSheet(true);
  }

  return (
    <div className="w-[140px] shrink-0">
      <Link href={productHref(product)} className="block aspect-square overflow-hidden rounded-2xl bg-[#f3f5f9]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt="" className="h-full w-full object-cover" loading="lazy" />
      </Link>
      <p className="mt-1.5 line-clamp-2 min-h-[30px] text-[12.5px] leading-tight font-semibold text-[#1a1d26]">{product.name}</p>
      {product.reviews > 0 ? (
        <p className="mt-0.5 flex items-center gap-1 text-[11.5px]">
          <Star className="size-3 fill-[#f5b942] text-[#f5b942]" />
          <span className="font-semibold">{product.rating.toFixed(1)}</span>
        </p>
      ) : (
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#8b93a7]">
          <Star className="size-3 text-[#cdd5e4]" />
          Baho yo‘q
        </p>
      )}
      <div className="mt-1 flex items-center justify-between gap-1">
        <p className="text-[13px] font-bold text-[#0B1F4D]">{formatMoney(product.price, "UZS")}</p>
        <button type="button" aria-label="Savatga qo‘shish" data-testid="forma-bundle-add" onClick={onAdd} className="grid size-8 shrink-0 place-items-center rounded-full bg-[#0066FF] text-white">
          <Plus className="size-4" />
        </button>
      </div>
      {sheet ? <FormaAddSheet product={product} onClose={() => setSheet(false)} /> : null}
    </div>
  );
}

const sizeRows = [
  ["XS", "82–86", "66–70", "155–162"],
  ["S", "86–94", "70–78", "160–168"],
  ["M", "94–102", "78–86", "165–173"],
  ["L", "102–110", "86–94", "170–178"],
  ["XL", "110–118", "94–102", "174–182"],
  ["XXL", "118–126", "102–110", "178–186"],
];

function SizeChart({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="O‘lcham jadvali">
      <button type="button" aria-label="Yopish" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-4 pt-3 shadow-2xl" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e6eaf2]" />
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[16px] font-bold text-[#1a1d26]">O‘lcham jadvali <span className="text-[12px] font-medium text-[#8b93a7]">(taxminiy, sm)</span></p>
          <button type="button" aria-label="Yopish" onClick={onClose} className="grid size-9 place-items-center rounded-full bg-[#f4f6fa] text-[#4b5568]">
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#eceff5]">
          <table className="w-full text-center text-[13px]">
            <thead className="bg-[#f2f6ff] text-[#0B1F4D]">
              <tr>
                <th className="py-2.5 font-semibold">O‘lcham</th>
                <th className="py-2.5 font-semibold">Ko‘krak</th>
                <th className="py-2.5 font-semibold">Bel</th>
                <th className="py-2.5 font-semibold">Bo‘y</th>
              </tr>
            </thead>
            <tbody>
              {sizeRows.map((r, i) => (
                <tr key={r[0]} className={i % 2 ? "bg-[#fafbfd]" : "bg-white"}>
                  <td className="py-2.5 font-bold text-[#0066FF]">{r[0]}</td>
                  <td className="py-2.5 text-[#1a1d26]">{r[1]}</td>
                  <td className="py-2.5 text-[#1a1d26]">{r[2]}</td>
                  <td className="py-2.5 text-[#1a1d26]">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2.5 text-[12px] leading-snug text-[#8b93a7]">Taxminiy umumiy standart qiymatlar. Aniq o‘lcham ishlab chiqaruvchiga qarab farq qilishi mumkin.</p>
      </div>
    </div>
  );
}
