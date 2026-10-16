import type { Metadata } from "next";
import { BrandsMobile } from "@/components/shop/BrandsMobile";

export const metadata: Metadata = {
  title: "Brendlar",
  description: "Dunyoning yetakchi stomatologiya brendlari. Rasmiy yetkazib beruvchilar.",
};

export default function BrandsPage() {
  return <BrandsMobile />;
}
