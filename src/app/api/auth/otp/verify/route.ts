import { NextResponse } from "next/server";
import { sessionPing } from "@/lib/server/admin";
import { DbError, rpc } from "@/lib/server/db";
import { clean, normalizePhone, type DbProfile } from "@/lib/server/profile";
import { checkCode, isValidCode, sessionJson } from "@/lib/server/otp";
import { getSessionUserId, jsonError, sameOrigin } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** POST { phone, code } — logged-in user (Google / Telegram / legacy phone) proves a phone number. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Ruxsat yo‘q.", 403);
  const userId = await getSessionUserId();
  if (!userId) return jsonError("Avval tizimga kiring.", 401);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const phone = normalizePhone(clean(body?.phone, 40) ?? "");
  const code = clean(body?.code, 12) ?? "";
  if (phone.length !== 9 || !isValidCode(code)) {
    return NextResponse.json({ ok: false, reason: "invalid", error: "6 xonali kodni kiriting." }, { status: 400 });
  }
  try {
    const check = await checkCode(phone, "verify", code, userId);
    if (!check.ok) return check.response;
    const res = await rpc<{ profile?: DbProfile; bonus?: unknown; error?: string }>("sh_verify_phone", {
      p_otp: check.otpId,
      p_user: userId,
      p_phone: phone,
    });
    if (res.error === "taken") {
      return NextResponse.json(
        { ok: false, reason: "taken", error: "Bu raqam boshqa akkauntga bog‘langan. Shu raqam bilan kiring yoki boshqa raqam kiriting." },
        { status: 409 },
      );
    }
    if (!res.profile) return jsonError("Tasdiqlab bo‘lmadi.", 400);
    const profile = (await sessionPing(userId, request)) ?? res.profile;
    return sessionJson(profile, request, { bonus: res.bonus ?? null });
  } catch (e) {
    if (e instanceof DbError && e.status === 403) return jsonError(e.message, 403);
    if (e instanceof DbError && e.status === 400) return jsonError("Kod eskirgan. Yangi kod so‘rang.", 400);
    return jsonError("Tasdiqlab bo‘lmadi. Qayta urinib ko‘ring.", 502);
  }
}
