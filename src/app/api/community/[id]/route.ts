import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { getSessionUserId, jsonError, sameOrigin } from "@/lib/server/session";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ ok: true, post: null });
  const userId = await getSessionUserId();
  try {
    const post = await rpc("sh_community_post", { p_viewer: userId, p_post: id });
    return NextResponse.json({ ok: true, post, viewerId: userId });
  } catch {
    return jsonError("Postni yuklab bo‘lmadi.", 502);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return jsonError("Ruxsat yo‘q.", 403);
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return jsonError("Avval tizimga kiring.", 401);
  if (!UUID.test(id)) return jsonError("Topilmadi.", 404);
  try {
    const deleted = await rpc<boolean>("sh_community_delete_post", { p_user: userId, p_post: id });
    if (!deleted) return jsonError("Faqat o‘z postingizni o‘chira olasiz.", 403);
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("O‘chirib bo‘lmadi.", 502);
  }
}
