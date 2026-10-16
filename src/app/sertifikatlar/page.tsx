import type { Metadata } from "next";
import { SertifikatlarPage } from "@/components/catalog-pages/sertifikatlar";

export const metadata: Metadata = {
  title: "Sertifikatlar",
  description: "Siz olgan barcha sertifikatlar va yutuqlar",
};

export default function Page() {
  return <SertifikatlarPage />;
}
