import type { Metadata } from "next";
import { BrandsMobile } from "@/components/shop/BrandsMobile";
import { getDeskBrand } from "@/data/desktop-brands";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const brand = getDeskBrand(slug);
  return { title: brand ? brand.name : "Brend", description: brand ? `${brand.name} — ${brand.country}` : "Brend" };
}

export default async function BrandPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return <BrandsMobile slug={decodeURIComponent(slug)} />;
}
