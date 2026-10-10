import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { invalidResponse, workError } from "@/lib/server/work";
import { validateLabOrder } from "@/lib/work-validate";

export const dynamic = "force-dynamic";

/** My orders as a doctor (lab phone shown only after the lab accepts) + orders received by my lab. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, auth: false, outgoing: [], incoming: [] });
  try {
    const data = await rpc<{ outgoing: unknown[]; incoming: unknown[] }>("sh_lab_order_list", { p_user: session.uid });
    return NextResponse.json({ ok: true, auth: true, ...data });
  } catch (e) {
    return workError(e);
  }
}

export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const labId = typeof body.labId === "string" ? body.labId : "";
  if (!UUID_RE.test(labId)) return NextResponse.json({ ok: false, error: "Laboratoriyani tanlang." }, { status: 400 });
  const { errors, clean } = validateLabOrder(body);
  if (Object.keys(errors).length) return invalidResponse(errors);
  try {
    const result = await rpc("sh_lab_order_create", { p_user: guard.userId, p_lab: labId, p_data: clean });
    return NextResponse.json({ ok: true, order: result });
  } catch (e) {
    return workError(e);
  }
}
