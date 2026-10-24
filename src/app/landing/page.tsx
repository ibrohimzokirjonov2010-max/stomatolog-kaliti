import { LandingPage } from "@/components/landing/landing-page";
import { landingMetadata } from "@/lib/landing-seo";

export const metadata = landingMetadata;

export default function LandingRoutePage() {
  return <LandingPage />;
}
