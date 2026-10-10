import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { invalidResponse, workError } from "@/lib/server/work";
import { validateClinicOp } from "@/lib/work-validate";

export const dynamic = "force-dynamic";

/** Private: only the signed-in owner's own clinic data (patients, visits, staff). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, auth: false });
  try {
    const state = await rpc("sh_clinic_get", { p_user: session.uid });
    return NextResponse.json({ ok: true, auth: true, state });
  } catch (e) {
    return workError(e);
  }
}

/** { op, id?, data } — clinic_save | patient_save/delete | visit_save/status/delete | staff_save/delete. Returns the fresh state. */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const op = typeof body.op === "string" ? body.op : "";
  const id = typeof body.id === "string" && body.id ? body.id : null;
  if (id && !UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "Yozuv topilmadi." }, { status: 400 });
  const data = body.data && typeof body.data === "object" ? (body.data as Record<string, unknown>) : {};
  const { errors, clean } = validateClinicOp(op, data);
  if (Object.keys(errors).length) return invalidResponse(errors);
  if (clean.patientId && !UUID_RE.test(String(clean.patientId))) return NextResponse.json({ ok: false, error: "Bemor topilmadi." }, { status: 400 });
  try {
    const state = await rpc("sh_clinic_op", { p_user: guard.userId, p_op: op, p_id: id, p_data: clean });
    return NextResponse.json({ ok: true, state });
  } catch (e) {
    return workError(e);
  }
}
