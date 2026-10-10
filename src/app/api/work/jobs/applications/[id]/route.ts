import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { workError } from "@/lib/server/work";

export const dynamic = "force-dynamic";

const ALLOWED = ["korilmoqda", "qabul", "rad", "bekor"];

/** { status }: employer sets korilmoqda / qabul / rad; applicant withdraws (bekor). */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  const body = await readJson(request);
  const status = typeof body.status === "string" ? body.status : "";
  if (!UUID_RE.test(id) || !ALLOWED.includes(status)) return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  try {
    const application = await rpc("sh_job_app_set", { p_user: guard.userId, p_id: id, p_status: status });
    return NextResponse.json({ ok: true, application });
  } catch (e) {
    return workError(e);
  }
}
