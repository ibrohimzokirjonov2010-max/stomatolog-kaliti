import type { Metadata } from "next";
import { KitoblarBrowse } from "@/components/kitoblar-browse";

export const metadata: Metadata = {
  title: "Kitoblar",
  description: "Stomatologiya kitoblari — katalog bazadan.",
};

export default function KitoblarPage() {
  return <KitoblarBrowse />;
}
