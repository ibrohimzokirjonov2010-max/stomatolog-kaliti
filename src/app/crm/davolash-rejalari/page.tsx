import type { Metadata } from "next";
import { PhoneSection } from "@/components/crm/PhoneSection";
import { seedPlans } from "@/data/crm";

export const metadata: Metadata = { title: "Davolash rejalari", description: "Davolash rejalari va odontogramma." };

export default function Page() {
  return <PhoneSection title="Davolash rejalari" text="Bosqichlar, to‘lovlar va tish kartasi." lines={seedPlans.map((item) => item.title)} />;
}
