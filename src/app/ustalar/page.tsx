import { Suspense } from "react";
import type { Metadata } from "next";
import { UstaBrowse } from "@/components/usta-browse";

export const metadata: Metadata = {
  title: "Ustalar",
  description:
    "Rentgen, stomatolog kreslosi va klinika jihozlari — o‘rnatish, sozlash, ta’mirlash. ",
};

export default function UstalarPage() {
  return (
    <Suspense>
      <UstaBrowse />
    </Suspense>
  );
}
