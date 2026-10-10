import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { readJson, requireUser, str } from "@/lib/server/user";
import { getRemoteSeminarRow, rpc, seminarDbError } from "@/lib/server/seminars";
import type { SeminarRow } from "@/lib/seminar-remote";

export const dynamic = "force-dynamic";

/** One of my seminars (owner/admin may also open it while pending/rejected). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Avval tizimga kiring." }, { status: 401 });
  const { id } = await params;
  const row = await getRemoteSeminarRow(id, session.uid);
  if (!row) {
    return NextResponse.json({ ok: false, error: "Topilmadi." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, seminar: row });
}

/** { action: "close" | "reopen" | "delete" } — delete cancels every active registration and notifies the registrants. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const { id } = await params;
  const body = await readJson(request);
  const action = str(body.action, 10);
  if (!/^[a-z0-9-]{3,40}$/.test(id) || !["close", "reopen", "delete"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  }
  try {
    const seminar = await rpc<SeminarRow>("sh_sem_set_state", { p_user: guard.userId, p_id: id, p_action: action });
    return NextResponse.json({ ok: true, seminar });
  } catch (e) {
    return seminarDbError(e);
  }
}
