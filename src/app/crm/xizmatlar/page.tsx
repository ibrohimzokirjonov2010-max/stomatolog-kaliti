import type { Metadata } from "next";
import { PhoneSection } from "@/components/crm/PhoneSection";

export const metadata: Metadata = { title: "Xizmatlar", description: "Klinika xizmatlari." };

export default function Page() {
  return <PhoneSection title="Xizmatlar" text="Konsultatsiya, davolash va gigiyena." lines={["Konsultatsiya", "Plomba", "Endodontiya", "Implant"]} />;
}
