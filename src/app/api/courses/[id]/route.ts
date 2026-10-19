import { NextResponse } from "next/server";
import { readCache, rpc } from "@/lib/server/db";
import { getSessionUserId, jsonError } from "@/lib/server/session";
import { UUID_RE } from "@/lib/server/user";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return jsonError("Topilmadi.", 404);
  const userId = await getSessionUserId();
  try {
    const course = await rpc<Record<string, unknown> | null>("sh_course_get", { p_id: id, p_user: userId });
    if (!course) return jsonError("Kurs topilmadi.", 404);
    return NextResponse.json({ ok: true, course }, { headers: readCache(Boolean(userId)) });
  } catch {
    return jsonError("Kursni yuklab bo‘lmadi.", 502);
  }
}
