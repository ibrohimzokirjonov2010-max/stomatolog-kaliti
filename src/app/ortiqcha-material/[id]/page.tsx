import type { Metadata } from "next";
import { SurplusProductPage } from "@/components/surplus-product";

export const metadata: Metadata = {
  title: "Ortiqcha material — e’lon",
  description: "Doktordan doktorga ortiqcha material: rasmlar, video obzor, narx, holat va joylashuv.",
};

export default async function OrtiqchaListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SurplusProductPage id={id} />;
}
