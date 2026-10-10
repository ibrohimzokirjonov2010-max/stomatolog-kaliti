import { Suspense } from "react";
import type { Metadata } from "next";
import { SellerCabinet } from "@/components/seller-cabinet";

export const metadata: Metadata = {
  title: "Sotuvchi kabineti",
  description: "Marketplace do‘koni: mahsulotlar, profil va karta ulash. Namuna sessiya.",
};

export default function SellerPage() {
  return (
    <Suspense>
      <SellerCabinet />
    </Suspense>
  );
}
