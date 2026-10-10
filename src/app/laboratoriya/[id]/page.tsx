import type { Metadata } from "next";
import { LabProfile } from "@/components/lab-profile";

export const metadata: Metadata = { title: "Laboratoriya profili" };

export default async function LabProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LabProfile id={id} />;
}
