import type { Metadata } from "next";
import { PhoneAdDetail } from "@/components/phone14/more";
import { getListing, seedListings } from "@/data/listings";
import { findPhoneAd } from "@/data/phone14";

type Params = { id: string };

export function generateStaticParams() {
  return seedListings.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const item = getListing(id) ?? findPhoneAd(id);
  return { title: item?.title ?? "E’lon", description: item?.description ?? "E’lon" };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  return <PhoneAdDetail id={decodeURIComponent(id)} />;
}
