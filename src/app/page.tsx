import { HomeGate } from "@/components/home/home-gate";
import { landingMetadata } from "@/lib/landing-seo";

export const metadata = landingMetadata;

export default function HomePage() {
  return <HomeGate />;
}
