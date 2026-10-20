import type { Metadata } from "next";
import { SpecialistMobileProfile } from "@/components/specialists/SpecialistMobileProfile";

type Params = { id: string };

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Mutaxassis" };
}

export default async function MutaxassisProfilePage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  return <SpecialistMobileProfile id={id} />;
}
