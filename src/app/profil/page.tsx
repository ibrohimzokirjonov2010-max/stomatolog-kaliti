import type { Metadata } from "next";
import { ProfilPage } from "@/components/profil-page";

export const metadata: Metadata = {
  title: "Profil",
  description: "Shifokor profilini ko‘rish va tahrirlash",
};

export default function ProfilRoutePage() {
  return <ProfilPage />;
}
