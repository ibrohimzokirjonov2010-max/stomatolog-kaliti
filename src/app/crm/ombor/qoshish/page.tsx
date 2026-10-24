import { OmborMobile } from "@/components/crm/mobile/OmborMobile";

/** Phone list; desktop opens the add-product dialog from AppChrome → StockDesktop. */
export default function Page() {
  return (
    <div className="lg:hidden">
      <OmborMobile />
    </div>
  );
}
