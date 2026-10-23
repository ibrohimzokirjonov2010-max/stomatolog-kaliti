import { TolovlarMobile } from "@/components/crm/mobile/TolovlarMobile";

/** Phone view; desktop renders PaymentsDesktop from AppChrome. */
export default function Page() {
  return (
    <div className="lg:hidden">
      <TolovlarMobile />
    </div>
  );
}
