import { NextResponse } from "next/server";
import { readCache, rpc } from "@/lib/server/db";
import { jsonError } from "@/lib/server/session";
import { UUID_RE } from "@/lib/server/user";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return jsonError("Topilmadi.", 404);
  try {
    const article = await rpc<Record<string, unknown> | null>("sh_news_get", { p_id: id });
    if (!article) return jsonError("Yangilik topilmadi.", 404);
    return NextResponse.json({ ok: true, article }, { headers: readCache(false) });
  } catch {
    return jsonError("Yangilikni yuklab bo‘lmadi.", 502);
  }
}
