import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { invalidResponse, workError } from "@/lib/server/work";
import { validateContact } from "@/lib/work-validate";

export const dynamic = "force-dynamic";

/** Employer sends an offer to a candidate (their phone is shared only with this candidate). */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "Rezyume topilmadi." }, { status: 400 });
  const { errors, clean } = validateContact(await readJson(request));
  if (Object.keys(errors).length) return invalidResponse(errors);
  try {
    const result = await rpc("sh_resume_offer", { p_user: guard.userId, p_resume: id, p_data: clean });
    return NextResponse.json({ ok: true, ...(result as object) });
  } catch (e) {
    return workError(e);
  }
}
