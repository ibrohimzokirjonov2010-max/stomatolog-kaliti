import type { Metadata } from "next";
import { KategoriyalarPage } from "@/components/catalog-pages/kategoriyalar";

export const metadata: Metadata = {
  title: "Kategoriyalar",
  description: "Stomatologiya mahsulotlarini kategoriya bo‘yicha tanlang",
};

export default function Page() {
  return <KategoriyalarPage />;
}
