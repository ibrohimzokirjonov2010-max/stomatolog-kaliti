import { Suspense } from "react";
import type { Metadata } from "next";
import { OrtiqchaBrowse } from "@/components/ortiqcha-browse";

export const metadata: Metadata = {
  title: "Ortiqcha material",
  description: "Doktordan doktorga shaxsiy ortiqcha materiallar. E’lon joylash, filtrlar, bog‘lanish.",
};

export default function OrtiqchaMaterialPage() {
  return (
    <Suspense>
      <OrtiqchaBrowse />
    </Suspense>
  );
}
