import type { Metadata } from "next";
import { MutaxassislarMobile } from "@/components/specialists/MutaxassislarMobile";
import { getSpecialist, specialists } from "@/data/desktop-specialists";

type Params = { id: string };

export function generateStaticParams() {
  return specialists.map((person) => ({ id: person.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const person = getSpecialist(id);
  return {
    title: person ? person.name : "Mutaxassis",
    description: person ? `${person.specialtyLabel} — ${person.city}.` : "Mutaxassis profili",
  };
}

export default async function MutaxassisProfilePage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  return <MutaxassislarMobile id={decodeURIComponent(id)} />;
}
