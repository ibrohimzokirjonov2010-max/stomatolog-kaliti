import { NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { getSessionUserId } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Number of seller conversations with unread buyer messages (sidebar badge). */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: true, count: 0 });
  try {
    const res = await rpc<{ count?: number }>("sh_conv_unread", { p_user: userId });
    return NextResponse.json({ ok: true, count: res.count ?? 0 });
  } catch (e) {
    return dbErrorJson(e, "Yuklab bo‘lmadi.");
  }
}
