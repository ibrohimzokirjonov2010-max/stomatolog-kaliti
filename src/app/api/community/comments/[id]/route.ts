import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { getSessionUserId, jsonError, sameOrigin } from "@/lib/server/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return jsonError("Ruxsat yo‘q.", 403);
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) return jsonError("Avval tizimga kiring.", 401);
  if (!UUID.test(id)) return jsonError("Topilmadi.", 404);
  try {
    const post = await rpc("sh_community_delete_comment", { p_user: userId, p_comment: id });
    if (!post) return jsonError("Faqat o‘z izohingizni o‘chira olasiz.", 403);
    return NextResponse.json({ ok: true, post });
  } catch {
    return jsonError("O‘chirib bo‘lmadi.", 502);
  }
}
