import { Suspense } from "react";
import type { Metadata } from "next";
import { UstaBrowse } from "@/components/usta-browse";

export const metadata: Metadata = {
  title: "Ustalar",
  description: "Stomatologik uskunalar ta‘mirlash ustalari.",
};

export default function UstalarPage() {
  return (
    <Suspense>
      <UstaBrowse />
    </Suspense>
  );
}
