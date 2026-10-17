import type { Metadata } from "next";
import { PhonePatients } from "@/components/phone14/clinic";

export const metadata: Metadata = { title: "Bemorlar CRM", description: "Bemorlar ro‘yxati va tish kartasi." };

export default function Page() {
  return <PhonePatients />;
}
