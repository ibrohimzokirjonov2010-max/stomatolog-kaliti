import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeminarRegisterPage } from "@/components/seminar-register";
import { getSeminar } from "@/data/seminars";
import { desktopSeminarIds, getDesktopSeminar, type DesktopSeminar } from "@/data/desktop-seminars";
import { rowToSeminar } from "@/lib/seminar-remote";
import { getRemoteSeminarRow } from "@/lib/server/seminars";
import { getSession } from "@/lib/server/session";

type Params = { id: string };

/** Rendered per request: organizer-created seminars live in the database and change (publish/close/delete). */
export const dynamic = "force-dynamic";

/** Desktop mock slugs are known even when they are absent from the mobile seed catalog. */
export function generateStaticParams() {
  return desktopSeminarIds().map((id) => ({ id }));
}

/** Static seed first; otherwise an organizer-created seminar from the database (published, or visible to its owner/admin). */
async function resolve(id: string) {
  const seed = getSeminar(id);
  if (seed) return seed;
  const session = await getSession();
  const row = await getRemoteSeminarRow(id, session?.uid);
  return row ? rowToSeminar(row) : undefined;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const desktop = getDesktopSeminar(id);
  if (desktop) return { title: desktop.detailTitle, description: `${desktop.speaker} — ${desktop.city}.` };
  const seminar = await resolve(id);
  if (!seminar) return { title: "Seminar topilmadi" };
  return { title: seminar.title, description: `${seminar.speaker} — ${seminar.city}.` };
}

/** Mobile body for a desktop-known seminar. The desktop shell overlays this at lg+. */
function DesktopSeminarFallback({ seminar }: { seminar: DesktopSeminar }) {
  return (
    <article className="rounded-2xl border border-[#eceff5] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#1497a8]">{seminar.category}</p>
      <h1 className="mt-1 text-[22px] font-bold tracking-tight text-[#1a1d26]">{seminar.detailTitle}</h1>
      <p className="mt-2 text-sm text-[#52637c]">
        {seminar.speaker} — {seminar.city}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-[#3d4d66]">{seminar.summary}</p>
    </article>
  );
}

export default async function SeminarDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const desktop = getDesktopSeminar(id);
  if (desktop) return <DesktopSeminarFallback seminar={desktop} />;
  const seminar = await resolve(id);
  if (!seminar) notFound();
  return <SeminarRegisterPage seminar={seminar} />;
}
