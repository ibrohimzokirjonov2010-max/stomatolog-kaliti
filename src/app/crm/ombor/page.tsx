import { OmborMobile } from "@/components/crm/mobile/OmborMobile";

/** Phone view; desktop renders StockDesktop from AppChrome. */
export default function Page() {
  return (
    <div className="lg:hidden">
      <OmborMobile />
    </div>
  );
}
