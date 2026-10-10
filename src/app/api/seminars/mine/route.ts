import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { readJson, requireUser, str } from "@/lib/server/user";
import { rpc, seminarDbError } from "@/lib/server/seminars";
import { publicObjectUrl } from "@/lib/server/db";
import { validateSeminar, type SeminarInput } from "@/lib/seminar-validate";
import type { SeminarRow } from "@/lib/seminar-remote";

export const dynamic = "force-dynamic";

/** My seminars (all statuses except deleted). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, auth: false, seminars: [] });
  try {
    const seminars = await rpc<SeminarRow[]>("sh_sem_mine", { p_user: session.uid });
    return NextResponse.json({ ok: true, auth: true, seminars: seminars ?? [] });
  } catch (e) {
    return seminarDbError(e);
  }
}

/** Create ({…fields}) or update ({ id, …fields }) a seminar. Authoritative validation; new ones go to admin approval. */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const id = str(body.id, 40);
  const input: SeminarInput = {
    title: str(body.title, 400),
    description: str(body.description, 8000),
    speakers: Array.isArray(body.speakers) ? body.speakers.slice(0, 8).map((s) => ({ name: str((s as Record<string, unknown>)?.name, 200), role: str((s as Record<string, unknown>)?.role, 200) })) : [],
    date: str(body.date, 10),
    startTime: str(body.startTime, 5),
    endTime: str(body.endTime, 5),
    city: str(body.city, 20),
    venue: str(body.venue, 400),
    price: str(String(body.price ?? ""), 20),
    seats: str(String(body.seats ?? ""), 10),
    specialty: str(body.specialty, 20),
    image: str(body.image, 700),
    tags: str(body.tags, 600),
    program: Array.isArray(body.program) ? body.program.slice(0, 20).map((p) => ({ time: str((p as Record<string, unknown>)?.time, 60), title: str((p as Record<string, unknown>)?.title, 300) })) : [],
    learnings: str(body.learnings, 3000),
  };
  const { errors, clean } = validateSeminar(input, { isNew: !id });
  // Images must come from our own Storage upload mechanism (seminars/ folder).
  if (!errors.image && !clean.image.startsWith(publicObjectUrl("seminars/"))) errors.image = "Rasm manzili noto‘g‘ri — qayta yuklang.";
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors, error: "Maydonlarni tekshiring." }, { status: 400 });
  try {
    const seminar = await rpc<SeminarRow>("sh_sem_save", { p_user: guard.userId, p_id: id || null, p_data: clean });
    return NextResponse.json({ ok: true, seminar });
  } catch (e) {
    return seminarDbError(e);
  }
}
