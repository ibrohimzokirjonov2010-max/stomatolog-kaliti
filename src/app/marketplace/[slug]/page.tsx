import type { Metadata } from "next";
import { MarketplaceProductView } from "@/components/marketplace-product-view";
import { assertPublicProduct } from "@/lib/server/public-product";

type Params = { slug: string };

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Mahsulot" };
}

export default async function MarketplaceProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  await assertPublicProduct(slug);
  return <MarketplaceProductView slug={slug} catalog={null} />;
}
