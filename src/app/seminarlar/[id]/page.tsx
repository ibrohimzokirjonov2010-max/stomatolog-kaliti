import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeminarRegisterPage } from "@/components/seminar-register";
import { getMobileSeminar } from "@/data/mobile-seminars";
import { getSeminar } from "@/data/seminars";
import { getDesktopSeminar } from "@/data/desktop-seminars";
import { rowToSeminar } from "@/lib/seminar-remote";
import { getRemoteSeminarRow } from "@/lib/server/seminars";
import { getSession } from "@/lib/server/session";

type Params = { id: string };

/** Rendered per request: organizer-created seminars live in the database and change (publish/close/delete). */
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [];
}

async function resolve(id: string) {
  const seed = getSeminar(id);
  if (seed) return seed;
  const session = await getSession();
  const row = await getRemoteSeminarRow(id, session?.uid);
  return row ? rowToSeminar(row) : undefined;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  if (getMobileSeminar(id) || getDesktopSeminar(id)) return { title: "Seminar topilmadi" };
  const seminar = await resolve(id);
  if (!seminar) return { title: "Seminar topilmadi" };
  return { title: seminar.title, description: `${seminar.speaker} — ${seminar.city}.` };
}

export default async function SeminarDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  if (getMobileSeminar(id) || getDesktopSeminar(id)) notFound();
  const seminar = await resolve(id);
  if (!seminar) notFound();
  return <SeminarRegisterPage seminar={seminar} />;
}
