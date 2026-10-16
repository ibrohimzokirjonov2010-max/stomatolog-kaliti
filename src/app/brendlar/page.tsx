import type { Metadata } from "next";
import { BrendlarPage } from "@/components/catalog-pages/brendlar";

export const metadata: Metadata = {
  title: "Brendlar",
  description: "Dunyoning yetakchi stomatologiya brendlari",
};

export default function Page() {
  return <BrendlarPage />;
}
