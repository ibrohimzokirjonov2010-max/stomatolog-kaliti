import { NextResponse } from "next/server";
import { sessionPing } from "@/lib/server/admin";
import { DbError, rpc } from "@/lib/server/db";
import { clean, normalizePhone, type DbProfile } from "@/lib/server/profile";
import { checkCode, isValidCode, sessionJson, verificationEnforced } from "@/lib/server/otp";
import { recordRegistrationLead } from "@/lib/server/leads";
import { hashPassword, jsonError, sameOrigin } from "@/lib/server/session";
import { signupRole } from "@/lib/signup-roles";

export const dynamic = "force-dynamic";

/**
 * POST { fullName, phone, password, code } — the account is created only with a valid Telegram code.
 * Before TELEGRAM_GATEWAY_TOKEN is configured (and without the test header) the legacy code-less path stays
 * available so sign-ups keep working; such accounts are unverified and get no bonus until they verify.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Ruxsat yo‘q.", 403);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const fullName = clean(body?.fullName, 120) ?? "";
  const phone = normalizePhone(clean(body?.phone, 40) ?? "");
  const password = typeof body?.password === "string" ? body.password : "";
  const code = clean(body?.code, 12) ?? "";
  const specialty = signupRole(clean(body?.specialty, 80));
  const attribution = body?.attribution;
  if (!fullName || phone.length !== 9) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  if (password.length < 6 || password.length > 200)
    return NextResponse.json({ ok: false, reason: "short_password" }, { status: 400 });

  const enforced = verificationEnforced(request);
  try {
    if (!code) {
      if (enforced) {
        return NextResponse.json({ ok: false, reason: "code_required", error: "Telegramga yuborilgan kodni kiriting." }, { status: 400 });
      }
      const result = await rpc<DbProfile | { error: string }>("sh_register_phone", {
        p_full_name: fullName,
        p_phone: phone,
        p_password_hash: await hashPassword(password),
      });
      if ("error" in result) return NextResponse.json({ ok: false, reason: "exists" }, { status: 409 });
      const profile = (await sessionPing(result.id, request)) ?? result;
      const lead = await recordRegistrationLead(profile, { method: "phone", role: specialty, attribution });
      return sessionJson(profile, request, { leadCreated: lead.created });
    }

    if (!isValidCode(code)) return NextResponse.json({ ok: false, reason: "invalid", error: "6 xonali kodni kiriting." }, { status: 400 });
    const check = await checkCode(phone, "register", code, null);
    if (!check.ok) return check.response;
    const res = await rpc<{ profile?: DbProfile; bonus?: unknown; error?: string }>("sh_register_verified", {
      p_otp: check.otpId,
      p_full_name: fullName,
      p_phone: phone,
      p_password_hash: await hashPassword(password),
    });
    if (res.error || !res.profile) return NextResponse.json({ ok: false, reason: "exists" }, { status: 409 });
    const profile = (await sessionPing(res.profile.id, request)) ?? res.profile;
    const lead = await recordRegistrationLead(profile, { method: "phone", role: specialty, attribution });
    return sessionJson(profile, request, { bonus: res.bonus ?? null, leadCreated: lead.created });
  } catch (e) {
    if (e instanceof DbError && e.status === 400) return jsonError("Kod eskirgan. Yangi kod so‘rang.", 400);
    return jsonError("Ro‘yxatdan o‘tib bo‘lmadi. Qayta urinib ko‘ring.", 502);
  }
}
