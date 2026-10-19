import { NextResponse } from "next/server";
import { dbErrorJson, publicObjectUrl, readCache, rpc } from "@/lib/server/db";
import { getSessionUserId, jsonError, sameOrigin } from "@/lib/server/session";

export const dynamic = "force-dynamic";

const KINDS = new Set(["case", "savol", "yangilik"]);

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  const url = new URL(request.url);
  const before = url.searchParams.get("before");
  try {
    const posts = await rpc<unknown[]>("sh_community_feed", {
      p_viewer: userId,
      p_limit: 50,
      p_before: before && !Number.isNaN(Date.parse(before)) ? before : null,
    });
    return NextResponse.json({ ok: true, posts, viewerId: userId }, { headers: readCache(Boolean(userId)) });
  } catch {
    return jsonError("Postlarni yuklab bo‘lmadi.", 502);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Ruxsat yo‘q.", 403);
  const userId = await getSessionUserId();
  if (!userId) return jsonError("Post joylash uchun tizimga kiring.", 401);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 5000) : "";
  const kind = typeof body?.kind === "string" && KINDS.has(body.kind) ? body.kind : "case";
  const tags = Array.isArray(body?.tags)
    ? body.tags
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 6)
    : [];
  const prefix = publicObjectUrl(`posts/${userId}/`);
  const images = Array.isArray(body?.images)
    ? body.images.filter((u): u is string => typeof u === "string" && u.startsWith(prefix)).slice(0, 6)
    : [];
  if (!text) return jsonError("Post matnini yozing.");
  try {
    const post = await rpc("sh_community_create_post", {
      p_user: userId,
      p_kind: kind,
      p_body: text,
      p_tags: tags,
      p_images: images,
    });
    return NextResponse.json({ ok: true, post });
  } catch (error) {
    return dbErrorJson(error, "Postni saqlab bo‘lmadi.");
  }
}
