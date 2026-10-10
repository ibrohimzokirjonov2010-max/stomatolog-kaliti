import { Suspense } from "react";
import type { Metadata } from "next";
import { LabBrowse } from "@/components/lab-browse";

export const metadata: Metadata = {
  title: "Laboratoriya",
  description: "Digital lab, crowns, veneers va protez — buyurtma va lab hamkorlar.",
};

export default function LaboratoriyaPage() {
  return (
    <Suspense>
      <LabBrowse />
    </Suspense>
  );
}
