import type { Metadata } from "next";
import { MutaxassislarPage } from "@/components/catalog-pages/mutaxassislar";

export const metadata: Metadata = {
  title: "Mutaxassislar",
  description: "Tajribali stomatolog mutaxassislar bilan bog‘laning",
};

export default function Page() {
  return <MutaxassislarPage />;
}
