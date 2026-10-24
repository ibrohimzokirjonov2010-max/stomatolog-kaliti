import type { Metadata } from "next";
import { PhoneCompletion } from "@/components/auth/phone-completion";

export const metadata: Metadata = {
  title: "Telefon raqam",
  description: "Hisobni ochish uchun ism, telefon va rol",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PhoneCompletion />;
}
