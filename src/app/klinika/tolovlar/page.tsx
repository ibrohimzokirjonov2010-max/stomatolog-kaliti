import type { Metadata } from "next";
import { TolovlarPage } from "@/components/crm/tolovlar";

export const metadata: Metadata = { title: "To‘lovlar", description: "Moliyaviy operatsiyalar va bemor to‘lovlari" };

export default function Page() {
  return <TolovlarPage />;
}
