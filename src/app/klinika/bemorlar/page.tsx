import type { Metadata } from "next";
import { BemorlarPage } from "@/components/crm/bemorlar";

export const metadata: Metadata = { title: "Bemorlar CRM", description: "Barcha bemorlaringizni boshqaring" };

export default function Page() {
  return <BemorlarPage />;
}
