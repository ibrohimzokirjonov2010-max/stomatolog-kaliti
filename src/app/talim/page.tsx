import type { Metadata } from "next";
import { TalimMobile } from "@/components/education/mobile/TalimMobile";

export const metadata: Metadata = {
  title: "Ta’lim",
  description: "Stomatologlar uchun kurslar.",
};

export default function TalimPage() {
  return <TalimMobile />;
}
