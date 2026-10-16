import { Suspense } from "react";
import type { Metadata } from "next";
import { UstalarMobileList } from "@/components/ustalar/mobile/UstalarMobileList";
import { UstaBrowse } from "@/components/usta-browse";

export const metadata: Metadata = {
  title: "Ustalar",
  description: "Stomatologik uskunalar ta‘mirlash ustalari.",
};

export default function UstalarPage() {
  return (
    <>
      <UstalarMobileList />
      <div className="hidden lg:block">
        <Suspense>
          <UstaBrowse />
        </Suspense>
      </div>
    </>
  );
}
