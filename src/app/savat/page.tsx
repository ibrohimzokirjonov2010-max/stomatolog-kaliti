import type { Metadata } from "next";
import { CartBrowse } from "@/components/cart-browse";
import { SavatMobile } from "@/components/savat/mobile/SavatMobile";

export const metadata: Metadata = {
  title: "Savat",
  description: "Buyurtma savati. Namuna to‘lov.",
};

export default function SavatPage() {
  return (
    <>
      <SavatMobile />
      <div className="hidden lg:block">
        <CartBrowse />
      </div>
    </>
  );
}
