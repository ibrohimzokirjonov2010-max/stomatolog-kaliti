import type { Metadata } from "next";
import { PhoneSection } from "@/components/crm/PhoneSection";
import { seedListings } from "@/data/listings";

export const metadata: Metadata = { title: "E‘lonlar", description: "Stomatologiya e’lonlari: sotuv, ijara, ish va xizmat." };

export default function Page() {
  return <PhoneSection title="E‘lonlar" text="Sotiladi, ijaraga, ish o‘rni va xizmatlar." lines={seedListings.map((item) => item.title)} />;
}
