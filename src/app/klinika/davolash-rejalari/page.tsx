import type { Metadata } from "next";
import { DavolashPage } from "@/components/crm/davolash";

export const metadata: Metadata = { title: "Davolash rejalari", description: "Bemorlarning davolash rejalari va bosqichlari" };

export default function Page() {
  return <DavolashPage />;
}
