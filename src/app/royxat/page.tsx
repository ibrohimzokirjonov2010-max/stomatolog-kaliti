import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Ro‘yxatdan o‘tish",
  description: "StomaHub — yangi shifokor profilini yaratish",
};

export default function RoyxatPage() {
  return <RegisterForm />;
}
