import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Params = { id: string };

export function generateStaticParams() {
  return [];
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Mutaxassis topilmadi" };
}

export default async function MutaxassisProfilePage({ params }: { params: Promise<Params> }) {
  await params;
  notFound();
}
