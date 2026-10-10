import { NextResponse } from "next/server";
import { publicObjectUrl, rpc } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { invalidResponse, workError } from "@/lib/server/work";
import { validateMasterRequest } from "@/lib/work-validate";

export const dynamic = "force-dynamic";

/** My sent requests (master phone shown only after acceptance) + requests received by my master profile. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, auth: false, outgoing: [], incoming: [] });
  try {
    const data = await rpc<{ outgoing: unknown[]; incoming: unknown[] }>("sh_master_req_list", { p_user: session.uid });
    return NextResponse.json({ ok: true, auth: true, ...data });
  } catch (e) {
    return workError(e);
  }
}

export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const masterId = typeof body.masterId === "string" ? body.masterId : "";
  if (!UUID_RE.test(masterId)) return NextResponse.json({ ok: false, error: "Usta topilmadi." }, { status: 400 });
  const { errors, clean } = validateMasterRequest(body);
  // Attachments must be the requester's own uploads (ticketed requests/<uid>/ or listings/<uid>/ paths).
  const own = [publicObjectUrl(`requests/${guard.userId}/`), publicObjectUrl(`listings/${guard.userId}/`)];
  if (clean.media.some((url) => !own.some((prefix) => url.startsWith(prefix)))) errors.media = "Fayl manzili noto‘g‘ri. Qayta yuklang.";
  if (Object.keys(errors).length) return invalidResponse(errors);
  try {
    const result = await rpc("sh_master_req_create", { p_user: guard.userId, p_master: masterId, p_data: clean });
    return NextResponse.json({ ok: true, request: result });
  } catch (e) {
    return workError(e);
  }
}
