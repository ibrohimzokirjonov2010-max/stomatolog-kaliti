import type { Metadata } from "next";
import { PublicShopPage } from "@/components/shop-public";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: slug === "kaliti-market" ? "StomaHub Market" : "Do‘kon",
    description: "Sotuvchi do‘koni — stomatologik materiallar. Namuna katalog.",
  };
}

export default async function ShopPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return <PublicShopPage slug={slug} />;
}
