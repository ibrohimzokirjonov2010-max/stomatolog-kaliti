import type { Metadata } from "next";
import { PhoneReports } from "@/components/phone14/reports";

export const metadata: Metadata = { title: "Hisobotlar", description: "Klinika daromadi, qabullar va shifokorlar hisoboti." };

export default function Page() {
  return <PhoneReports />;
}
