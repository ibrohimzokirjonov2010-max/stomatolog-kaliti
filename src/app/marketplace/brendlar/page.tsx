import type { Metadata } from "next";
import { PhoneBrands } from "@/components/phone14/shop";

export const metadata: Metadata = {
  title: "Brendlar",
  description: "Dunyoning yetakchi stomatologiya brendlari. Rasmiy yetkazib beruvchilar.",
};

export default function BrandsPage() {
  return <PhoneBrands />;
}
