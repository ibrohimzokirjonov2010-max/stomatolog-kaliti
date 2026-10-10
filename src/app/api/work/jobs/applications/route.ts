import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { invalidResponse, workError } from "@/lib/server/work";
import { validateJobApplication } from "@/lib/work-validate";

export const dynamic = "force-dynamic";

/** My sent applications (employer phone only after acceptance) + applications received for my vacancies. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, auth: false, outgoing: [], incoming: [] });
  try {
    const data = await rpc<{ outgoing: unknown[]; incoming: unknown[] }>("sh_job_app_list", { p_user: session.uid });
    return NextResponse.json({ ok: true, auth: true, ...data });
  } catch (e) {
    return workError(e);
  }
}

export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const jobId = typeof body.jobId === "string" ? body.jobId : "";
  if (!UUID_RE.test(jobId)) return NextResponse.json({ ok: false, error: "Vakansiya topilmadi." }, { status: 400 });
  const { errors, clean } = validateJobApplication(body);
  if (Object.keys(errors).length) return invalidResponse(errors);
  try {
    const result = await rpc("sh_job_app_create", { p_user: guard.userId, p_job: jobId, p_data: clean });
    return NextResponse.json({ ok: true, application: result });
  } catch (e) {
    return workError(e);
  }
}
