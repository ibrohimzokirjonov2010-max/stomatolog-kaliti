import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KitobDetail } from "@/components/kitob-detail";
import { books as hubBooks } from "@/data/desktop-hub";
import { books } from "@/data/education";

type Params = { id: string };

export function generateStaticParams() {
  const ids = new Set([...books.map((book) => book.id), ...hubBooks.map((book) => book.id)]);
  return [...ids].map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const book = books.find((item) => item.id === id);
  if (book) return { title: book.title, description: `${book.author} — ${book.summary}` };
  const hub = hubBooks.find((item) => item.id === id);
  if (hub) return { title: hub.title, description: `${hub.authors} — ${hub.sample}` };
  return { title: "Kitob topilmadi" };
}

export default async function KitobPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const book = books.find((item) => item.id === id);
  if (book) return <KitobDetail book={book} />;
  const hub = hubBooks.find((item) => item.id === id);
  if (!hub) notFound();
  return (
    <section className="space-y-3 px-4 py-4 lg:hidden" data-testid="hub-book-phone">
      <Link href="/kitoblar" className="text-[13px] font-bold text-[#0066FF]">← Kitoblar</Link>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={hub.image} alt="" className="h-48 w-36 rounded-2xl object-cover" />
      <h1 className="text-[22px] font-extrabold text-[#0B1F4D]">{hub.title}</h1>
      <p className="text-[14px] text-[#6b7280]">{hub.authors}</p>
      <p className="text-[14px] leading-relaxed text-[#24344d]">{hub.sample}</p>
      <Link href={`/kitoblar/${hub.id}/oqish`} className="inline-flex h-11 items-center rounded-xl bg-[#0066FF] px-4 text-[14px] font-bold text-white">O‘qib ko‘rish</Link>
    </section>
  );
}
