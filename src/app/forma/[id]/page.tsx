import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { formaProducts } from "@/data/forma";
import { getProduct } from "@/data/products";

type Params = { id: string };

export function generateStaticParams() {
  return formaProducts.map((product) => ({ id: product.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) return { title: "Forma topilmadi" };
  return { title: product.name, description: `${product.brand} — tibbiy forma. Namuna katalog.` };
}

export default async function FormaProductPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product || product.category !== "forma") notFound();
  return <ProductDetail product={product} />;
}
