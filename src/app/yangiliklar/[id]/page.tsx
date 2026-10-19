import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { YangiliklarMobileArticle } from "@/components/news/mobile/YangiliklarMobileArticle";
import { getMobileNews, mobileNews, type MobileNews } from "@/data/mobile-news";

type Params = { id: string };

export function generateStaticParams() {
  return mobileNews.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const item = getMobileNews(id);
  if (!item) return { title: "Yangilik topilmadi" };
  return { title: item.title, description: item.excerpt };
}

function NewsWide({ item }: { item: MobileNews }) {
  return (
    <article className="rounded-2xl border border-[#eceff5] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#1497a8]">{item.date}</p>
      <h1 className="mt-1 text-[22px] font-bold tracking-tight text-[#1a1d26]">{item.title}</h1>
      <p className="mt-2 text-sm text-[#52637c]">{item.excerpt}</p>
    </article>
  );
}

export default async function YangilikPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const item = getMobileNews(id);
  if (!item) notFound();
  return (
    <>
      <YangiliklarMobileArticle item={item} />
      <div className="hidden lg:block">
        <NewsWide item={item} />
      </div>
    </>
  );
}
