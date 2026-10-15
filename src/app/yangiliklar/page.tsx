import type { Metadata } from "next";
import { ComingSoon } from "@/components/dashboard/ui";

export const metadata: Metadata = {
  title: "Yangiliklar",
  description: "Stomatologiya sohasidagi eng so‘nggi yangiliklar, tadbirlar va tahlillar.",
};

export default function Page() {
  return (
    <ComingSoon
      title="Yangiliklar"
      description="Soha yangiliklari tez orada shu yerda bo‘ladi."
    />
  );
}
