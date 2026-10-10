import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KitobDetail } from "@/components/kitob-detail";
import { books } from "@/data/education";

type Params = { id: string };

export function generateStaticParams() {
  return books.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const book = books.find((b) => b.id === id);
  if (!book) return { title: "Kitob topilmadi" };
  return { title: book.title, description: `${book.author} — ${book.summary}` };
}

export default async function KitobPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const book = books.find((b) => b.id === id);
  if (!book) notFound();
  return <KitobDetail book={book} />;
}
