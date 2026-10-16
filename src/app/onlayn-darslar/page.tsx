import type { Metadata } from "next";
import { OnlaynDarslarPage } from "@/components/catalog-pages/onlayn-darslar";

export const metadata: Metadata = {
  title: "Onlayn darslar",
  description: "Stomatologiya bo‘yicha professional onlayn kurslar",
};

export default function Page() {
  return <OnlaynDarslarPage />;
}
