import type { Metadata } from "next";
import { SalesMobile } from "@/components/shop/SalesMobile";

export const metadata: Metadata = {
  title: "Aksiyalar",
  description: "Maxsus takliflar va chegirmalar. Stomatologiya mahsulotlari.",
};

export default function SalesPage() {
  return <SalesMobile />;
}
