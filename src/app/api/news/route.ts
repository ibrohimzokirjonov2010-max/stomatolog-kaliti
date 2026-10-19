import { NextResponse } from "next/server";
import { readCache, rpc } from "@/lib/server/db";
import { jsonError } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const news = await rpc<unknown[]>("sh_news_list", {});
    return NextResponse.json({ ok: true, news: news ?? [] }, { headers: readCache(false) });
  } catch {
    return jsonError("Yangiliklarni yuklab bo‘lmadi.", 502);
  }
}
