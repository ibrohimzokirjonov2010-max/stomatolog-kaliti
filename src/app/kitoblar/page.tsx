import type { Metadata } from "next";
import { KitoblarBrowse } from "@/components/kitoblar-browse";

export const metadata: Metadata = {
  title: "Kitoblar",
  description: "Stomatologiya qo‘llanmalari — namuna katalog.",
};

export default function KitoblarPage() {
  return <KitoblarBrowse />;
}
