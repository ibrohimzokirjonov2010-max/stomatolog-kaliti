import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { invalidResponse, workError } from "@/lib/server/work";
import { validateContact } from "@/lib/work-validate";

export const dynamic = "force-dynamic";

/** Contact requests I sent (seller phone only after acceptance) + requests received for my listings. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, auth: false, outgoing: [], incoming: [] });
  try {
    const data = await rpc<{ outgoing: unknown[]; incoming: unknown[] }>("sh_surplus_int_list", { p_user: session.uid });
    return NextResponse.json({ ok: true, auth: true, ...data });
  } catch (e) {
    return workError(e);
  }
}

export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const listingId = typeof body.listingId === "string" ? body.listingId : "";
  if (!UUID_RE.test(listingId)) return NextResponse.json({ ok: false, error: "E’lon topilmadi." }, { status: 400 });
  const { errors, clean } = validateContact(body);
  if (Object.keys(errors).length) return invalidResponse(errors);
  try {
    const result = await rpc("sh_surplus_int_create", { p_user: guard.userId, p_listing: listingId, p_data: clean });
    return NextResponse.json({ ok: true, interest: result });
  } catch (e) {
    return workError(e);
  }
}
