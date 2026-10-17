import type { Metadata } from "next";
import { PhoneStock } from "@/components/phone14/clinic";

export const metadata: Metadata = { title: "Ombor", description: "Klinika inventari va sarf materiallari." };

export default function Page() {
  return <PhoneStock />;
}
