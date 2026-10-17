import { LandingDesktop } from "@/components/landing/landing-desktop";
import { LandingMobile } from "@/components/landing/landing-mobile";

/** Guests see this at `/` and `/landing`. The phone layout stays the previous page. */
export function LandingPage() {
  return (
    <>
      <div className="lg:hidden">
        <LandingMobile />
      </div>
      <div className="hidden lg:block">
        <LandingDesktop />
      </div>
    </>
  );
}
