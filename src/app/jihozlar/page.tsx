import { Suspense } from "react";
import { MarketplaceBrowse } from "@/components/marketplace-browse";

export default function Page() {
  return (
    <Suspense>
      <MarketplaceBrowse title="Jihozlar" forcedCategory="jihozlar" />
    </Suspense>
  );
}
