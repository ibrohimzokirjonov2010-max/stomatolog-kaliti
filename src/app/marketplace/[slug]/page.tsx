import type { Metadata } from "next";
import { MarketplaceProductView } from "@/components/marketplace-product-view";
import { getProduct, products } from "@/data/products";

type Params = { slug: string };

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Mahsulot" };
  return {
    title: product.name,
    description: `${product.brand} — ${product.name}. Namuna katalog.`,
  };
}

export default async function MarketplaceProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return <MarketplaceProductView slug={slug} catalog={getProduct(slug) ?? null} />;
}
