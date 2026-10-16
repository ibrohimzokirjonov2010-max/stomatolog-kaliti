import type { Metadata } from "next";
import { PhoneSection } from "@/components/crm/PhoneSection";
import { debtors } from "@/data/crm";

export const metadata: Metadata = { title: "To‘lovlar", description: "Klinika tushumlari va bemor to‘lovlari." };

export default function Page() {
  return <PhoneSection title="To‘lovlar" text="Tushum, qarzdorlar va tezkor to‘lov." lines={debtors.map((item) => `${item.name} · ${item.amount}`)} />;
}
