import type { Metadata } from "next";
import { SeminarBrowse } from "@/components/seminar-browse";

export const metadata: Metadata = {
  title: "Seminarlar",
  description: "Yaqinlashib kelayotgan kurslar va kongresslar O‘zbekistonda. Namuna kalendar.",
};

export default function SeminarsPage() {
  return <SeminarBrowse />;
}
