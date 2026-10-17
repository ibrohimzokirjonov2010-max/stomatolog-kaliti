import type { Metadata } from "next";
import { PhonePlans } from "@/components/phone14/clinic";

export const metadata: Metadata = { title: "Davolash rejalari", description: "Davolash rejalari va odontogramma." };

export default function Page() {
  return <PhonePlans />;
}
