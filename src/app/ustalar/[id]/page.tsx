import type { Metadata } from "next";
import { UstaProfile } from "@/components/usta-profile";
import { UstalarMobileProfile } from "@/components/ustalar/mobile/UstalarMobileProfile";
import { desktopUstaSlugs, getDesktopUsta, type DesktopUsta } from "@/data/desktop-ustalar";
import { getMobileUsta, mobileUstalar, type MobileUsta } from "@/data/mobile-ustalar";

type Params = { id: string };

export function generateStaticParams() {
  const ids = new Set<string>([...desktopUstaSlugs(), ...mobileUstalar.map((item) => item.id)]);
  return [...ids].map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const mobile = getMobileUsta(id);
  if (mobile) return { title: mobile.name, description: `${mobile.role} — ${mobile.city}.` };
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

function MobileUstaWide({ item }: { item: MobileUsta }) {
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
  const mobile = getMobileUsta(id);
  const person = getDesktopUsta(id);
  if (mobile) {
    return (
      <>
        <UstalarMobileProfile item={mobile} />
        <div className="hidden lg:block">
          {person ? <DesktopUstaFallback item={person} /> : <MobileUstaWide item={mobile} />}
        </div>
      </>
    );
  }
  if (person) return <DesktopUstaFallback item={person} />;
  return <UstaProfile id={id} />;
}
