import { Suspense } from "react";
import type { Metadata } from "next";
import { IshlarBrowse } from "@/components/ishlar-browse";

export const metadata: Metadata = {
  title: "Ishlar",
  description: "Stomatologlar va klinika xodimlari uchun vakansiyalar.",
};

export default function IshlarPage() {
  return (
    <Suspense>
      <IshlarBrowse />
    </Suspense>
  );
}
