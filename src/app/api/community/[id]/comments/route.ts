import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { getSessionUserId, jsonError, sameOrigin } from "@/lib/server/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return jsonError("Ruxsat yo‘q.", 403);
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return jsonError("Izoh yozish uchun tizimga kiring.", 401);
  if (!UUID.test(id)) return jsonError("Topilmadi.", 404);
  const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 2000) : "";
  if (!text) return jsonError("Izoh matnini yozing.");
  try {
    const post = await rpc("sh_community_add_comment", { p_user: userId, p_post: id, p_body: text });
    return NextResponse.json({ ok: true, post });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Xato.", 502);
  }
}
