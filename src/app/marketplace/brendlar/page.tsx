import type { Metadata } from "next";
import { BrandsMobile } from "@/components/shop/BrandsMobile";

export const metadata: Metadata = {
  title: "Brendlar",
  description: "Katalogdagi brendlar.",
};

export default function BrandsPage() {
  return <BrandsMobile />;
}
