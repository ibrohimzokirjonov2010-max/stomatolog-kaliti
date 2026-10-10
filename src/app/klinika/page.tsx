import type { Metadata } from "next";
import { ClinicDashboard } from "@/components/clinic-dashboard";

export const metadata: Metadata = {
  title: "Mening klinikam",
  description: "Klinika boshqaruvi: bemorlar, qabullar va xodimlar. Ma’lumotlar faqat egasiga ko‘rinadi.",
};

export default function ClinicPage() {
  return <ClinicDashboard />;
}
