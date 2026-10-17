import type { Metadata } from "next";
import { PhoneSpecialists } from "@/components/phone14/learn";

export const metadata: Metadata = {
  title: "Mutaxassislar",
  description: "Tajribali stomatolog mutaxassislar bilan bog‘laning.",
};

export default function MutaxassislarPage() {
  return <PhoneSpecialists />;
}
