import { NextResponse } from "next/server";
import { readCache, rpc } from "@/lib/server/db";
import { getSessionUserId, jsonError } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  try {
    const courses = await rpc<unknown[]>("sh_courses_list", { p_user: userId });
    return NextResponse.json({ ok: true, courses: courses ?? [] }, { headers: readCache(Boolean(userId)) });
  } catch {
    return jsonError("Kurslarni yuklab bo‘lmadi.", 502);
  }
}
