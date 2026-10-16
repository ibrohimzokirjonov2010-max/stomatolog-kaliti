import type { Metadata } from "next";
import { OmborPage } from "@/components/crm/ombor";

export const metadata: Metadata = { title: "Ombor", description: "Klinika inventari va sarf materiallari" };

export default function Page() {
  return <OmborPage />;
}
