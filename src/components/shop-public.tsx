"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { MapPin, Phone, Send } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ShopAvatar, VerifiedBadge } from "@/components/seller-ui";
import { ShopPhone } from "@/components/shop/ShopPhone";
import { useSellerWork } from "@/components/seller-provider";
import { buttonVariants } from "@/components/ui/button";
import { catalogShop } from "@/data/shops";
import { phoneHref, telegramHref } from "@/data/surplus";
import { cn } from "@/lib/utils";

export function PublicShopPage({ slug }: { slug: string }) {
  const { getShopBySlug, productsForShop, bumpViews, ready, session } = useSellerWork();
  const shop = getShopBySlug(slug);
  const bumped = useRef(false);

  useEffect(() => {
    if (!shop || bumped.current) return;
    bumped.current = true;
    bumpViews(shop.id);
  }, [bumpViews, shop]);

  if (!ready) {
    return <p className="text-sm text-[#8b93a7]">Yuklanmoqda...</p>;
  }

  if (!shop) {
    return (
      <div className="rounded-[16px] border border-[#eceff5] bg-white px-6 py-16 text-center">
        <p className="text-[16px] font-semibold text-[#1a1d26]">Do‘kon topilmadi</p>
        <p className="mt-1 text-sm text-[#8b93a7]">Havola eskirgan yoki do‘kon o‘chirilgan.</p>
        <Link href="/marketplace" className={cn(buttonVariants(), "mt-5 h-10 !rounded-xl")}>
          Marketplace
        </Link>
      </div>
    );
  }

  const items = productsForShop(shop.id);
  const call = phoneHref(shop.phone);
  const tg = telegramHref(shop.telegram);
  const isOwner = session?.id === shop.id;

  return (
    <div>
      <ShopPhone shop={shop} items={items} isOwner={isOwner} />
      <div className="hidden lg:block">
      <p className="text-[13px] text-[#8b93a7]">
        <Link href="/marketplace" className="text-[#0F766E] hover:underline">
          Marketplace
        </Link>
        <span className="mx-1">/</span>
        <span>Do‘konlar</span>
        <span className="mx-1">/</span>
        <span>{shop.name}</span>
      </p>

      <section className="mt-3 rounded-[16px] border border-[#eceff5] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <ShopAvatar shop={shop} className="size-16 text-[22px]" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-bold tracking-tight text-[#1a1d26]">{shop.name}</h1>
              <VerifiedBadge status={shop.verified} />
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#6b7280]">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {shop.city}
              </span>
              <span>{shop.ownerName}</span>
            </p>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[#4b5568]">{shop.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={call} className={cn(buttonVariants(), "h-9 !rounded-xl")}>
                <Phone className="size-3.5" />
                Qo‘ng‘iroq
              </a>
              {tg ? (
                <a
                  href={tg}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "outline" }), "h-9 !rounded-xl")}
                >
                  <Send className="size-3.5" />
                  Telegram
                </a>
              ) : null}
              {isOwner ? (
                <Link href="/marketplace/sotuvchi" className={cn(buttonVariants({ variant: "outline" }), "h-9 !rounded-xl")}>
                  Kabinet
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <h2 className="mt-5 text-[16px] font-semibold text-[#1a1d26]">Mahsulotlar</h2>
      {items.length === 0 ? (
        <div className="mt-3 rounded-[16px] border border-[#eceff5] bg-white px-6 py-14 text-center">
          <p className="font-medium text-[#1a1d26]">Hozircha e’lon yo‘q</p>
          <p className="mt-1 text-sm text-[#8b93a7]">
            {shop.id === catalogShop.id ? "Katalog mahsulotlari tez orada." : "Sotuvchi hali mahsulot joylamagan."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3 hidden grid-cols-2 gap-3 lg:grid xl:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-3 space-y-2 lg:hidden">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} variant="mobile" />
            ))}
          </div>
        </>
      )}
      </div>
    </div>
  );
}
