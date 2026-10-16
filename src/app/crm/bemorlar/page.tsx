import type { Metadata } from "next";
import { PhoneSection } from "@/components/crm/PhoneSection";
import { buildPatients } from "@/data/crm";

export const metadata: Metadata = { title: "Bemorlar CRM", description: "Bemorlar ro‘yxati va tish kartasi." };

export default function Page() {
  return <PhoneSection title="Bemorlar CRM" text="Bemor qidirish, status va qabul." lines={buildPatients().slice(0, 8).map((item) => `${item.name} · ${item.city}`)} />;
}
