import type { Metadata } from "next";
import { PhoneSection } from "@/components/crm/PhoneSection";
import { designCertificates } from "@/data/certificates";

export const metadata: Metadata = { title: "Sertifikatlar", description: "Olingan sertifikatlar va CME ballari." };

export default function Page() {
  return <PhoneSection title="Sertifikatlar" text="Seminar, kurs va vebinar sertifikatlari." lines={designCertificates.map((item) => `${item.title} · ${item.cme} CME`)} />;
}
