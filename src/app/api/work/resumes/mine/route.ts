import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { readJson, requireUser } from "@/lib/server/user";
import { invalidResponse, workError } from "@/lib/server/work";
import { validateResume } from "@/lib/work-validate";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, auth: false, resume: null, offers: [] });
  try {
    const data = await rpc<{ resume: unknown; offers: unknown[] }>("sh_resume_mine", { p_user: session.uid });
    return NextResponse.json({ ok: true, auth: true, ...data });
  } catch (e) {
    return workError(e);
  }
}

export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const { errors, clean } = validateResume(await readJson(request));
  if (Object.keys(errors).length) return invalidResponse(errors);
  try {
    const resume = await rpc("sh_resume_save", { p_user: guard.userId, p_data: clean });
    return NextResponse.json({ ok: true, resume });
  } catch (e) {
    return workError(e);
  }
}

export async function DELETE(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  try {
    await rpc("sh_resume_delete", { p_user: guard.userId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return workError(e);
  }
}
