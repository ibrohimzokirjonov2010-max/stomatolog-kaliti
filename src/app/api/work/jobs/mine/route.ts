import { NextResponse } from "next/server";
import { publicObjectUrl, rpc } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { invalidResponse, workError } from "@/lib/server/work";
import { validateJob } from "@/lib/work-validate";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, auth: false, jobs: [] });
  try {
    const jobs = await rpc("sh_job_mine", { p_user: session.uid });
    return NextResponse.json({ ok: true, auth: true, jobs });
  } catch (e) {
    return workError(e);
  }
}

/** Create (no id) or edit (id) a vacancy. New vacancies wait for admin approval. */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const id = typeof body.id === "string" && body.id ? body.id : null;
  if (id && !UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "Vakansiya topilmadi." }, { status: 400 });
  const { errors, clean } = validateJob(body);
  // Media must be the poster's own uploads (listings/<uid>/ or jobs/<uid>/).
  const own = [publicObjectUrl(`listings/${guard.userId}/`), publicObjectUrl(`jobs/${guard.userId}/`)];
  const isOwn = (url: string) => !url || own.some((p) => url.startsWith(p));
  if (!clean.photos.every(isOwn)) errors.photos = "Rasm manzili noto‘g‘ri. Rasmlarni qayta yuklang.";
  if (!isOwn(clean.video)) errors.video = "Video manzili noto‘g‘ri. Qayta yuklang.";
  if (!isOwn(clean.logo)) errors.logo = "Logo manzili noto‘g‘ri. Qayta yuklang.";
  if (Object.keys(errors).length) return invalidResponse(errors);
  try {
    const job = await rpc("sh_job_save", { p_user: guard.userId, p_id: id, p_data: clean });
    return NextResponse.json({ ok: true, job });
  } catch (e) {
    return workError(e);
  }
}
