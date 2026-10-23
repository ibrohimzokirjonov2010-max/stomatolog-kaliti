import type { Metadata } from "next";
import { SertifikatlarMobile } from "@/components/certificates/SertifikatlarMobile";

export const metadata: Metadata = { title: "Sertifikatlar", description: "Olingan sertifikatlar va CME ballari." };

/** Phone view; desktop renders CertificatesDesktop from AppChrome. */
export default function Page() {
  return <SertifikatlarMobile />;
}
