import type { Metadata } from "next";
import { PhoneCategories } from "@/components/phone14/shop";

export const metadata: Metadata = {
  title: "Kategoriyalar",
  description: "Stomatologiya mahsulotlarini kategoriya bo‘yicha tanlang",
};

export default function Page() {
  return <PhoneCategories />;
}
