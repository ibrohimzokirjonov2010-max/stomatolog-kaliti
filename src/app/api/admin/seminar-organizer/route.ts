import { NextResponse } from "next/server";
import { requireAdmin, adminRpcError } from "@/lib/server/admin";
import { getSeminar } from "@/data/seminars";
import { getRemoteSeminarRow } from "@/lib/server/seminars";
import { rpc } from "@/lib/server/db";
import { readJson, str } from "@/lib/server/user";

export const dynamic = "force-dynamic";

/** Admin: assign the organizer of a catalog seminar by phone ({ seminarId, phone }); empty phone clears it. */
export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const seminarId = str(body.seminarId, 80);
  if (!getSeminar(seminarId) && !(await getRemoteSeminarRow(seminarId, guard.admin.id))) return NextResponse.json({ ok: false, error: "Seminar topilmadi." }, { status: 404 });
  try {
    const res = await rpc("sh_sem_set_organizer", { p_admin: guard.admin.id, p_seminar: seminarId, p_phone: str(body.phone, 40) });
    return NextResponse.json({ ok: true, ...(res as object) });
  } catch (e) {
    return adminRpcError(e);
  }
}
