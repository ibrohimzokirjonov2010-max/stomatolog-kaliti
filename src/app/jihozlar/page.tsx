import { Suspense } from "react";
import type { Metadata } from "next";
import { MarketplaceBrowse } from "@/components/marketplace-browse";

export const metadata: Metadata = {
  title: "Stomatologik jihozlar",
  description: "Klinikangiz uchun yangi va ishlatilgan stomatologik uskunalar.",
};

export default function Page() {
  return (
    <Suspense>
      <MarketplaceBrowse title="Jihozlar" forcedCategory="jihozlar" />
    </Suspense>
  );
}
