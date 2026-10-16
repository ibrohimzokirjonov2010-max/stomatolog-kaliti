import type { Metadata } from "next";
import { MutaxassislarMobile } from "@/components/specialists/MutaxassislarMobile";

export const metadata: Metadata = {
  title: "Mutaxassislar",
  description: "Tajribali stomatolog mutaxassislar bilan bog‘laning.",
};

export default function MutaxassislarPage() {
  return <MutaxassislarMobile />;
}
