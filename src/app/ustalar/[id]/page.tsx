import type { Metadata } from "next";
import { UstaProfile } from "@/components/usta-profile";
import { desktopUstaSlugs, getDesktopUsta, type DesktopUsta } from "@/data/desktop-ustalar";

type Params = { id: string };

export function generateStaticParams() {
  return desktopUstaSlugs().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const person = getDesktopUsta(id);
  if (person) return { title: person.name, description: `${person.role} — ${person.city}.` };
  return { title: "Usta profili" };
}

function DesktopUstaFallback({ item }: { item: DesktopUsta }) {
  return (
    <article className="rounded-2xl border border-[#eceff5] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#1497a8]">{item.city}</p>
      <h1 className="mt-1 text-[22px] font-bold tracking-tight text-[#1a1d26]">{item.name}</h1>
      <p className="mt-2 text-sm text-[#52637c]">{item.role}</p>
    </article>
  );
}

export default async function UstaProfilePage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const person = getDesktopUsta(id);
  if (person) return <DesktopUstaFallback item={person} />;
  return <UstaProfile id={id} />;
}
