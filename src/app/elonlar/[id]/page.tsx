import type { Metadata } from "next";
import { PhoneSection } from "@/components/crm/PhoneSection";
import { getListing, seedListings } from "@/data/listings";

type Params = { id: string };

export function generateStaticParams() {
  return seedListings.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const item = getListing(id);
  return { title: item?.title ?? "E’lon", description: item?.description ?? "E’lon" };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const item = getListing(decodeURIComponent(id));
  return <PhoneSection title={item?.title ?? "E’lon"} text={item?.priceLabel ?? ""} lines={[item?.city ?? "", item?.description ?? "E’lon topilmadi"]} />;
}
