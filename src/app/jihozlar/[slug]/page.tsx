import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { desktopJihozSlugs, getDesktopJihoz, type DesktopJihoz } from "@/data/desktop-jihozlar";

type Params = { slug: string };

export function generateStaticParams() {
  return desktopJihozSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const item = getDesktopJihoz(slug);
  if (!item) return { title: "Jihoz topilmadi" };
  return { title: item.name, description: `${item.brand} — ${item.spec}` };
}

function DesktopJihozFallback({ item }: { item: DesktopJihoz }) {
  return (
    <article className="rounded-2xl border border-[#eceff5] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#1497a8]">{item.brand}</p>
      <h1 className="mt-1 text-[22px] font-bold tracking-tight text-[#1a1d26]">{item.name}</h1>
      <p className="mt-2 text-sm text-[#52637c]">{item.spec}</p>
    </article>
  );
}

export default async function JihozSlugPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const item = getDesktopJihoz(slug);
  if (!item) notFound();
  return <DesktopJihozFallback item={item} />;
}
