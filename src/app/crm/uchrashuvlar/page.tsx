import type { Metadata } from "next";
import { PhoneAppointments } from "@/components/phone14/clinic";

export const metadata: Metadata = { title: "Uchrashuvlar", description: "Klinika jadvali va bemor qabuli." };

export default function Page() {
  return <PhoneAppointments />;
}
