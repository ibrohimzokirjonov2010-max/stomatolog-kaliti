import type { Metadata } from "next";
import { ProfilMobile } from "@/components/profil/mobile/ProfilMobile";

export const metadata: Metadata = {
  title: "Profil",
  description: "Shifokor profilini ko‘rish va tahrirlash",
};

export default function ProfilRoutePage() {
  return <ProfilMobile />;
}
