import type { Metadata } from "next";
import { UstaProfile } from "@/components/usta-profile";

export const metadata: Metadata = { title: "Usta profili" };

export default async function UstaProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UstaProfile id={id} />;
}
