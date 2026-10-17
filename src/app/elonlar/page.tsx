import type { Metadata } from "next";
import { PhoneAds } from "@/components/phone14/more";

export const metadata: Metadata = { title: "E‘lonlar", description: "Stomatologiya e’lonlari: sotuv, ijara, ish va xizmat." };

export default function Page() {
  return <PhoneAds />;
}
