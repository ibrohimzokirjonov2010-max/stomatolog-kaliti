import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Kirish",
  description: "StomaHub — telefon va parol bilan kirish",
};

export default function KirishPage() {
  return <LoginForm />;
}
