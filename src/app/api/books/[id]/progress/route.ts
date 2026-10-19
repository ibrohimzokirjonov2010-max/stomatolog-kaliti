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
  const chapter = Math.max(0, Math.floor(Number(body.chapter) || 0));
  const percent = Math.min(100, Math.max(0, Math.floor(Number(body.percent) || 0)));
  try {
    const book = await rpc<Record<string, unknown> | null>("sh_book_progress", {
      p_user: guard.userId,
      p_id: id,
      p_chapter: chapter,
      p_percent: percent,
    });
    if (book && book.error) return jsonError("Kitob topilmadi.", 404);
    return NextResponse.json({ ok: true, book }, { headers: privateCache() });
  } catch {
    return jsonError("Jarayon saqlanmadi.", 502);
  }
}
