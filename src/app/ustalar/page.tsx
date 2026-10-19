import { Suspense } from "react";
import type { Metadata } from "next";
import { PhoneLabs } from "@/components/phone14/more";
import { UstaBrowse } from "@/components/usta-browse";

export const metadata: Metadata = {
  title: "Ustalar",
  description: "Stomatologik uskunalar ta‘mirlash ustalari.",
};

export default function UstalarPage() {
  return (
    <>
      <PhoneLabs />
      <div className="hidden lg:block">
        <Suspense>
          <UstaBrowse />
        </Suspense>
      </div>
    </>
  );
}
