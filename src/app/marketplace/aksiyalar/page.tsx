import type { Metadata } from "next";
import { PhoneSales } from "@/components/phone14/shop";

export const metadata: Metadata = {
  title: "Aksiyalar",
  description: "Maxsus takliflar va chegirmalar. Stomatologiya mahsulotlari.",
};

export default function SalesPage() {
  return <PhoneSales />;
}
