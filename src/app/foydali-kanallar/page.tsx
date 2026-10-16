import type { Metadata } from "next";
import { KanallarMobile } from "@/components/channels/mobile/KanallarMobile";

export const metadata: Metadata = {
  title: "Foydali kanallar",
  description: "Stomatologlar uchun eng yaxshi kanallar bir joyda.",
};

export default function FoydaliKanallarPage() {
  return <KanallarMobile />;
}
