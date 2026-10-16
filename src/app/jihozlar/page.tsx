import { Suspense } from "react";
import type { Metadata } from "next";
import { JihozMobileCatalog } from "@/components/jihoz/mobile/JihozMobileCatalog";
import { MarketplaceBrowse } from "@/components/marketplace-browse";

export const metadata: Metadata = {
  title: "Stomatologik jihozlar",
  description: "Klinikangiz uchun yangi va ishlatilgan stomatologik uskunalar.",
};

export default function Page() {
  return (
    <>
      <JihozMobileCatalog />
      <div className="hidden lg:block">
        <Suspense>
          <MarketplaceBrowse title="Jihozlar" forcedCategory="jihozlar" />
        </Suspense>
      </div>
    </>
  );
}
