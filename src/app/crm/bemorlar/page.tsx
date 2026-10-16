import type { Metadata } from "next";
import { PatientsPhone } from "@/components/crm/PatientsPhone";

export const metadata: Metadata = { title: "Bemorlar CRM", description: "Bemorlar ro‘yxati va tish kartasi." };

export default function Page() {
  return <PatientsPhone />;
}
