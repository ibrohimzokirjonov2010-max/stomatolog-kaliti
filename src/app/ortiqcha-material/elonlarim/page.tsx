import { Suspense } from "react";
import type { Metadata } from "next";
import { SurplusMinePage } from "@/components/surplus-mine";

export const metadata: Metadata = {
  title: "Mening e’lonlarim",
  description: "Ortiqcha material e’lonlaringiz — tahrirlash, yopish, o‘chirish, kelgan so‘rovlar.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SurplusMinePage />
    </Suspense>
  );
}
