import { Suspense } from "react";
import type { Metadata } from "next";
import { MarketplaceBrowse } from "@/components/marketplace-browse";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Klinikangiz uchun materiallar, asbob-uskunalar va jihozlar. Namuna katalog.",
};

export default function MarketplacePage() {
  return (
    <Suspense>
      <MarketplaceBrowse />
    </Suspense>
  );
}
