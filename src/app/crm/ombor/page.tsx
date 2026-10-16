import type { Metadata } from "next";
import { PhoneSection } from "@/components/crm/PhoneSection";
import { buildStock } from "@/data/crm";

export const metadata: Metadata = { title: "Ombor", description: "Klinika inventari va sarf materiallari." };

export default function Page() {
  return <PhoneSection title="Ombor" text="Zaxira, yaroqlilik va buyurtma." lines={buildStock().slice(0, 8).map((item) => `${item.name} · ${item.qty}`)} />;
}
