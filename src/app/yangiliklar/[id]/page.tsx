import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { YangiliklarMobileArticle } from "@/components/news/mobile/YangiliklarMobileArticle";
import { getMobileNews, mobileNews, type MobileNews } from "@/data/mobile-news";
import { desktopArticles, getDesktopArticle, popularArticles } from "@/data/desktop-news";

type Params = { id: string };

export function generateStaticParams() {
  return [...mobileNews, ...desktopArticles, ...popularArticles].map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const item = getMobileNews(id);
  const wide = getDesktopArticle(id);
  if (!item && wide) return { title: wide.title, description: wide.lead };
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
  const wide = getDesktopArticle(id);
  // Desktop list articles (rendered by the desktop chrome); the mobile view gets the same summary.
  if (!item && wide) {
    return (
      <article className="rounded-2xl border border-[#eceff5] bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1497a8]">{wide.date}</p>
        <h1 className="mt-1 text-[22px] font-bold tracking-tight text-[#1a1d26]">{wide.title}</h1>
        <p className="mt-2 text-sm text-[#52637c]">{wide.lead}</p>
      </article>
    );
  }
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
