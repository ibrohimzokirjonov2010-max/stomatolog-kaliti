import type { Metadata } from "next";
import { PhoneCerts } from "@/components/phone14/clinic";

export const metadata: Metadata = { title: "Sertifikatlar", description: "Olingan sertifikatlar va CME ballari." };

export default function Page() {
  return <PhoneCerts />;
}
