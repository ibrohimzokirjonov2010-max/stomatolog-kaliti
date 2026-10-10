import { NextResponse } from "next/server";
import { publicObjectUrl, rpc } from "@/lib/server/db";
import { clean, normalizePhone, type DbProfile } from "@/lib/server/profile";
import { getSessionUserId, jsonError, sameOrigin } from "@/lib/server/session";

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return jsonError("Ruxsat yo‘q.", 403);
  const userId = await getSessionUserId();
  if (!userId) return jsonError("Avval tizimga kiring.", 401);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return jsonError("Noto‘g‘ri so‘rov.");

  const patch: Record<string, string> = {};
  const fullName = clean(body.fullName, 120);
  if (fullName !== undefined) {
    if (!fullName) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
    patch.fullName = fullName;
  }
  if (typeof body.phone === "string") {
    const phone = normalizePhone(body.phone);
    if (phone && phone.length !== 9) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
    patch.phone = phone;
  }
  for (const [key, max] of [["clinic", 120], ["city", 80], ["specialty", 80], ["bio", 1000]] as const) {
    const value = clean(body[key], max);
    if (value !== undefined) patch[key] = value;
  }
  if (typeof body.avatarUrl === "string") {
    const url = body.avatarUrl.trim();
    const prefix = publicObjectUrl(`avatars/${userId}/`);
    if (url && !url.startsWith(prefix)) return jsonError("Rasm manzili yaroqsiz.");
    patch.avatarUrl = url;
  }

  try {
    const result = await rpc<DbProfile | { error: string }>("sh_update_profile", {
      p_user: userId,
      p_patch: patch,
    });
    if ("error" in result) {
      if (result.error === "phone_locked") {
        return NextResponse.json(
          { ok: false, reason: "phone_locked", error: "Tasdiqlangan raqamni faqat Telegram kodi orqali o‘zgartirish mumkin." },
          { status: 409 },
        );
      }
      return NextResponse.json({ ok: false, reason: result.error }, { status: result.error === "exists" ? 409 : 404 });
    }
    return NextResponse.json({ ok: true, profile: result });
  } catch {
    return jsonError("Profilni saqlab bo‘lmadi.", 502);
  }
}
