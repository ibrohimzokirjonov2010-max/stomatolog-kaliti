import { NextResponse } from "next/server";
import { privateCache, rpc } from "@/lib/server/db";
import { jsonError } from "@/lib/server/session";
import { UUID_RE, requireUser } from "@/lib/server/user";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return jsonError("Topilmadi.", 404);
  const guard = await requireUser(request);
  if ("error" in guard && guard.error) return guard.error;
  try {
    const course = await rpc<Record<string, unknown> | null>("sh_course_enroll", { p_user: guard.userId, p_id: id });
    if (course && course.error) return jsonError("Kurs topilmadi.", 404);
    return NextResponse.json({ ok: true, course }, { headers: privateCache() });
  } catch {
    return jsonError("Yozilish saqlanmadi.", 502);
  }
}
