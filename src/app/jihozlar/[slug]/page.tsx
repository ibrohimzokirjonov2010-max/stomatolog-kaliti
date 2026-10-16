import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JihozMobileProduct } from "@/components/jihoz/mobile/JihozMobileProduct";
import { desktopJihozSlugs, getDesktopJihoz, type DesktopJihoz } from "@/data/desktop-jihozlar";
import { getMobileJihoz, mobileJihoz, type MobileJihoz } from "@/data/mobile-jihozlar";
import { formatMoney } from "@/lib/format";

type Params = { slug: string };

export function generateStaticParams() {
  const slugs = new Set<string>([...desktopJihozSlugs(), ...mobileJihoz.map((item) => item.id)]);
  return [...slugs].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const mobile = getMobileJihoz(slug);
  if (mobile) return { title: mobile.pdpName ?? mobile.name, description: `${mobile.pdpBrand ?? mobile.brand} — ${mobile.name}` };
  const item = getDesktopJihoz(slug);
  if (!item) return { title: "Jihoz topilmadi" };
  return { title: item.name, description: `${item.brand} — ${item.spec}` };
}

function MobileJihozWide({ item }: { item: MobileJihoz }) {
  return (
    <article className="rounded-2xl border border-[#eceff5] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#1497a8]">{item.pdpBrand ?? item.brand}</p>
      <h1 className="mt-1 text-[22px] font-bold tracking-tight text-[#1a1d26]">{item.pdpName ?? item.name}</h1>
      <p className="mt-2 text-sm text-[#52637c]">{formatMoney(item.price, "UZS")}</p>
    </article>
  );
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
  const mobile = getMobileJihoz(slug);
  const item = getDesktopJihoz(slug);
  if (mobile) {
    return (
      <>
        <JihozMobileProduct item={mobile} />
        <div className="hidden lg:block">
          {item ? <DesktopJihozFallback item={item} /> : <MobileJihozWide item={mobile} />}
        </div>
      </>
    );
  }
  if (!item) notFound();
  return <DesktopJihozFallback item={item} />;
}
