import type { Metadata } from "next";
import { SeminarForm } from "@/components/organizer/seminar-form";

export const metadata: Metadata = { title: "Yangi seminar" };

export default function NewSeminarPage() {
  return <SeminarForm />;
}
