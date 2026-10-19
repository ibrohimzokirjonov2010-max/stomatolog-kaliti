"use client";

import { CatalogDetail } from "@/components/library/live-pages";
import type { Product } from "@/data/products";

export function MarketplaceProductView({ slug }: { slug: string; catalog: Product | null }) {
  return <CatalogDetail id={slug} />;
}
