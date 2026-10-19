import { NextResponse } from "next/server";
import { readCache, rpc } from "@/lib/server/db";
import { getSessionUserId, jsonError } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  try {
    const books = await rpc<unknown[]>("sh_books_list", { p_user: userId });
    return NextResponse.json({ ok: true, books: books ?? [] }, { headers: readCache(Boolean(userId)) });
  } catch {
    return jsonError("Kitoblarni yuklab bo‘lmadi.", 502);
  }
}
