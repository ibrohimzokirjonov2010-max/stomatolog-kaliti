import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { desktopFormaSlugs, getDesktopForma, type DesktopForma } from "@/data/desktop-forma";
import { formaProducts } from "@/data/forma";
import { getProduct } from "@/data/products";

type Params = { id: string };

export function generateStaticParams() {
  const ids = new Set<string>([...formaProducts.map((product) => product.id), ...desktopFormaSlugs()]);
  return [...ids].map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const desktop = getDesktopForma(id);
  if (desktop) return { title: desktop.name, description: `${desktop.brand} — ${desktop.blurb}` };
  const product = getProduct(id);
  if (!product) return { title: "Forma topilmadi" };
  return { title: product.name, description: `${product.brand} — tibbiy forma. Namuna katalog.` };
}

/** Mobile body for a desktop-known uniform. The desktop shell overlays this at lg+. */
function DesktopFormaFallback({ item }: { item: DesktopForma }) {
  return (
    <article className="rounded-2xl border border-[#eceff5] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#1497a8]">{item.brand}</p>
      <h1 className="mt-1 text-[22px] font-bold tracking-tight text-[#1a1d26]">{item.name}</h1>
      <p className="mt-2 text-sm text-[#52637c]">{item.blurb}</p>
    </article>
  );
}

export default async function FormaProductPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const desktop = getDesktopForma(id);
  if (desktop) return <DesktopFormaFallback item={desktop} />;
  const product = getProduct(id);
  if (!product || product.category !== "forma") notFound();
  return <ProductDetail product={product} />;
}
