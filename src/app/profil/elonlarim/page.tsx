import type { Metadata } from "next";
import { MeningElonlarim } from "@/components/profil/mobile/MeningElonlarim";

export const metadata: Metadata = {
  title: "Mening e’lonlarim",
  description: "E’lonlar, ortiqcha material, vakansiyalar va xizmatlaringiz bir joyda.",
};

export default function MeningElonlarimPage() {
  return <MeningElonlarim />;
}
