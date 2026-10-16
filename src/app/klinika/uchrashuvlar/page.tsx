import type { Metadata } from "next";
import { UchrashuvlarPage } from "@/components/crm/uchrashuvlar";

export const metadata: Metadata = { title: "Uchrashuvlar", description: "Klinika jadvali va bemor qabuli" };

export default function Page() {
  return <UchrashuvlarPage />;
}
