import type { Metadata } from "next";
import { PhoneSection } from "@/components/crm/PhoneSection";
import { seedAppointments } from "@/data/crm";

export const metadata: Metadata = { title: "Uchrashuvlar", description: "Klinika jadvali va bemor qabuli." };

export default function Page() {
  return <PhoneSection title="Uchrashuvlar" text="Haftalik jadval va bugungi qabullar." lines={seedAppointments.filter((item) => item.date === "2026-10-22" && item.grid !== false).map((item) => `${item.start} ${item.patient}`)} />;
}
