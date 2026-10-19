import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UstaProfile } from "@/components/usta-profile";
import { getDesktopUsta } from "@/data/desktop-ustalar";
import { getMobileUsta } from "@/data/mobile-ustalar";

type Params = { id: string };

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  if (getDesktopUsta(id) || getMobileUsta(id)) return { title: "Usta topilmadi" };
  return { title: "Usta profili" };
}

export default async function UstaProfilePage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  if (getDesktopUsta(id) || getMobileUsta(id)) notFound();
  return <UstaProfile id={id} />;
}
