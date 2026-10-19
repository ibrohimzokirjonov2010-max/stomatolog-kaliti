import type { Metadata } from "next";
import { MarketplaceProductView } from "@/components/marketplace-product-view";

type Params = { slug: string };

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Mahsulot" };
}

export default async function MarketplaceProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return <MarketplaceProductView slug={slug} catalog={null} />;
}
