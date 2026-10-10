import type { Metadata } from "next";
import { CartBrowse } from "@/components/cart-browse";

export const metadata: Metadata = {
  title: "Savat",
  description: "Buyurtma savati. Namuna to‘lov.",
};

export default function SavatPage() {
  return <CartBrowse />;
}
