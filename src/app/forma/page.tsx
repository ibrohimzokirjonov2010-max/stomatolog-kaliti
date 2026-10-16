import { Suspense } from "react";
import type { Metadata } from "next";
import { FormaBrowse } from "@/components/forma-browse";
import { FormaMobileCatalog } from "@/components/forma/mobile/FormaMobileCatalog";

export const metadata: Metadata = {
  title: "Forma",
  description: "Stomatolog va klinika xodimlari uchun tibbiy forma, kiyim va poyabzal. Namuna katalog.",
};

export default function FormaPage() {
  return (
    <>
      <FormaMobileCatalog />
      <div className="hidden lg:block">
        <Suspense>
          <FormaBrowse />
        </Suspense>
      </div>
    </>
  );
}
