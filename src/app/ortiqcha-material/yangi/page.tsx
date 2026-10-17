import type { Metadata } from "next";
import { SurplusPostMobile } from "@/components/shop/desktop/SurplusPost";

export const metadata: Metadata = {
  title: "Ortiqcha material sotish",
  description: "Ishlatilmagan yoki ortiqcha qolgan materialni boshqa stomatologlarga soting.",
};

export default function Page() {
  return <SurplusPostMobile />;
}
