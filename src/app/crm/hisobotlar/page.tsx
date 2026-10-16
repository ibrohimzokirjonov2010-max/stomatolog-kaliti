import type { Metadata } from "next";
import { PhoneSection } from "@/components/crm/PhoneSection";

export const metadata: Metadata = { title: "Hisobotlar", description: "Klinika hisobotlari." };

export default function Page() {
  return <PhoneSection title="Hisobotlar" text="Kunlik tushum va qabullar." lines={["Bugungi qabullar", "Oylik tushum", "Qarzdorlar"]} />;
}
