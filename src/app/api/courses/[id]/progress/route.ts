import { NextResponse } from "next/server";
import { privateCache, rpc } from "@/lib/server/db";
import { jsonError } from "@/lib/server/session";
import { UUID_RE, readJson, requireUser } from "@/lib/server/user";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return jsonError("Topilmadi.", 404);
  const guard = await requireUser(request);
  if ("error" in guard && guard.error) return guard.error;
  const body = await readJson(request);
  const lesson = typeof body.lessonId === "string" ? body.lessonId : "";
  if (!UUID_RE.test(lesson)) return jsonError("Dars topilmadi.", 404);
  try {
    const course = await rpc<Record<string, unknown> | null>("sh_course_progress", {
      p_user: guard.userId,
      p_lesson: lesson,
      p_done: body.done !== false,
    });
    if (course && course.error) return jsonError("Dars topilmadi.", 404);
    return NextResponse.json({ ok: true, course }, { headers: privateCache() });
  } catch {
    return jsonError("Jarayon saqlanmadi.", 502);
  }
}
