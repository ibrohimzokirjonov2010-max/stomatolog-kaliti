import { Suspense } from "react";
import type { Metadata } from "next";
import { FormaBrowse } from "@/components/forma-browse";

export const metadata: Metadata = {
  title: "Forma",
  description: "Stomatolog va klinika xodimlari uchun tibbiy forma, kiyim va poyabzal. Namuna katalog.",
};

export default function FormaPage() {
  return (
    <Suspense>
      <FormaBrowse />
    </Suspense>
  );
}
