import type { Metadata } from "next";
import { HomeGate } from "@/components/home/home-gate";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Bosh sahifa",
  description: site.description,
};

export default function HomePage() {
  return <HomeGate />;
}
