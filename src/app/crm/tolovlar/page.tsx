import type { Metadata } from "next";
import { PhonePayments } from "@/components/phone14/clinic";

export const metadata: Metadata = { title: "To‘lovlar", description: "Klinika tushumlari va bemor to‘lovlari." };

export default function Page() {
  return <PhonePayments />;
}
