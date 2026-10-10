import type { Metadata } from "next";
import { SeminarForm } from "@/components/organizer/seminar-form";

export const metadata: Metadata = { title: "Seminarni tahrirlash" };

export default async function EditSeminarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SeminarForm seminarId={id} />;
}
