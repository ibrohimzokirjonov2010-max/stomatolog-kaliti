import type { Metadata } from "next";
import { AksiyalarPage } from "@/components/catalog-pages/aksiyalar";

export const metadata: Metadata = {
  title: "Aksiyalar",
  description: "Maxsus takliflar va chegirmalar",
};

export default function Page() {
  return <AksiyalarPage />;
}
