"use client";

import Link from "next/link";
import { ProductDetail } from "@/components/product-detail";
import { MarketMobileDetail } from "@/components/market/mobile/MarketMobileDetail";
import { useSellerWork } from "@/components/seller-provider";
import { buttonVariants } from "@/components/ui/button";
import { getMobileMarket } from "@/data/mobile-market";
import type { Product } from "@/data/products";
import { cn } from "@/lib/utils";

export function MarketplaceProductView({ slug, catalog }: { slug: string; catalog: Product | null }) {
  const { getListedProduct, catalog: feed, ready } = useSellerWork();
  const product =
    catalog ?? getListedProduct(slug) ?? feed.find((item) => item.id === slug) ?? null;
  const design = getMobileMarket(slug);

  if (design) {
    return (
      <>
        <MarketMobileDetail item={design} />
        <div className="hidden lg:block">
          {product ? <ProductDetail product={product} /> : <MissingProduct />}
        </div>
      </>
    );
  }

  if (!product) {
    if (!ready) {
      return <p className="text-sm text-[#8b93a7]">Yuklanmoqda...</p>;
    }
    return (
      <div className="rounded-[16px] border border-[#eceff5] bg-white px-6 py-16 text-center">
        <p className="text-[16px] font-semibold text-[#1a1d26]">Mahsulot topilmadi</p>
        <p className="mt-1 text-sm text-[#8b93a7]">E’lon o‘chirilgan yoki havola noto‘g‘ri.</p>
        <Link href="/marketplace" className={cn(buttonVariants(), "mt-5 h-10 !rounded-xl")}>
          Marketplace
        </Link>
      </div>
    );
  }

  return <ProductDetail product={product} />;
}

function MissingProduct() {
  return (
    <div className="rounded-[16px] border border-[#eceff5] bg-white px-6 py-16 text-center">
      <p className="text-[16px] font-semibold text-[#1a1d26]">Mahsulot topilmadi</p>
      <Link href="/marketplace" className={cn(buttonVariants(), "mt-5 h-10 !rounded-xl")}>
        Marketplace
      </Link>
    </div>
  );
}
