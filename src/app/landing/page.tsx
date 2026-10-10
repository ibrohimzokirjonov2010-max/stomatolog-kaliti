import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: `${site.name} — stomatologlar ekotizimi`,
  description: site.description,
};

export default function LandingRoutePage() {
  return <LandingPage />;
}
