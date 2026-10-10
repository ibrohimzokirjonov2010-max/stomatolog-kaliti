import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeminarRegisterPage } from "@/components/seminar-register";
import { getSeminar } from "@/data/seminars";
import { rowToSeminar } from "@/lib/seminar-remote";
import { getRemoteSeminarRow } from "@/lib/server/seminars";
import { getSession } from "@/lib/server/session";

type Params = { id: string };

/** Rendered per request: organizer-created seminars live in the database and change (publish/close/delete). */
export const dynamic = "force-dynamic";

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
  const seminar = await resolve(id);
  if (!seminar) return { title: "Seminar topilmadi" };
  return { title: seminar.title, description: `${seminar.speaker} — ${seminar.city}.` };
}

export default async function SeminarDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const seminar = await resolve(id);
  if (!seminar) notFound();
  return <SeminarRegisterPage seminar={seminar} />;
}
