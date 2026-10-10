import { NextResponse } from "next/server";
import { sessionPing } from "@/lib/server/admin";
import { DbError, rpc } from "@/lib/server/db";
import { clean, normalizePhone, type DbProfile } from "@/lib/server/profile";
import { checkCode, isValidCode, sessionJson } from "@/lib/server/otp";
import { hashPassword, jsonError, sameOrigin } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** POST { phone, code, password } — password reset with a Telegram code; signs the user in. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Ruxsat yo‘q.", 403);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const phone = normalizePhone(clean(body?.phone, 40) ?? "");
  const code = clean(body?.code, 12) ?? "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (phone.length !== 9 || !isValidCode(code)) {
    return NextResponse.json({ ok: false, reason: "invalid", error: "Telefon va 6 xonali kodni kiriting." }, { status: 400 });
  }
  if (password.length < 6 || password.length > 200) {
    return NextResponse.json({ ok: false, reason: "short_password", error: "Parol kamida 6 belgidan iborat bo‘lishi kerak." }, { status: 400 });
  }
  try {
    const check = await checkCode(phone, "reset", code, null);
    if (!check.ok) return check.response;
    const res = await rpc<{ profile?: DbProfile; blocked?: boolean; bonus?: unknown; error?: string }>("sh_reset_password", {
      p_otp: check.otpId,
      p_phone: phone,
      p_password_hash: await hashPassword(password),
    });
    if (res.error || !res.profile) {
      return NextResponse.json({ ok: false, reason: "not_found", error: "Bu raqam bilan akkaunt topilmadi." }, { status: 404 });
    }
    if (res.blocked) {
      return NextResponse.json({ ok: true, reset: true, blocked: true, error: "Parol yangilandi, lekin akkaunt bloklangan." });
    }
    const profile = (await sessionPing(res.profile.id, request)) ?? res.profile;
    return sessionJson(profile, request, { reset: true, bonus: res.bonus ?? null });
  } catch (e) {
    if (e instanceof DbError && e.status === 400) return jsonError("Kod eskirgan. Yangi kod so‘rang.", 400);
    return jsonError("Parolni tiklab bo‘lmadi. Qayta urinib ko‘ring.", 502);
  }
}
