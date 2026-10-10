import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { clean, normalizePhone } from "@/lib/server/profile";
import {
  OTP,
  checkSendAbility,
  clientIpHash,
  gatewayErrorResponse,
  gatewayToken,
  generateCode,
  hashCode,
  isOtpTestRequest,
  maskPhone,
  sendVerificationMessage,
  type OtpPurpose,
} from "@/lib/server/otp";
import { getSessionUserId, jsonError, sameOrigin } from "@/lib/server/session";

export const dynamic = "force-dynamic";

const PURPOSES = new Set<OtpPurpose>(["register", "verify", "reset"]);

const CREATE_ERRORS: Record<string, [string, number]> = {
  exists: ["Bu raqam ro‘yxatdan o‘tgan. Kiring yoki parolni tiklang.", 409],
  taken: ["Bu raqam boshqa akkauntga bog‘langan. Shu raqam bilan kiring yoki boshqa raqam kiriting.", 409],
  already: ["Bu raqam allaqachon tasdiqlangan.", 409],
  not_found: ["Bu raqam bilan akkaunt topilmadi.", 404],
  daily_limit: ["Bugun bu raqamga juda ko‘p kod yuborildi. Ertaga qayta urinib ko‘ring.", 429],
  ip_limit: ["Juda ko‘p so‘rov. Birozdan keyin qayta urinib ko‘ring.", 429],
  invalid: ["Telefon raqamini to‘g‘ri kiriting.", 400],
};

/** POST { phone, purpose } → sends a 6-digit code to the number's Telegram (Gateway). */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Ruxsat yo‘q.", 403);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const phone = normalizePhone(clean(body?.phone, 40) ?? "");
  const purpose = (clean(body?.purpose, 20) ?? "") as OtpPurpose;
  if (phone.length !== 9 || !/^\d{9}$/.test(phone)) {
    return NextResponse.json({ ok: false, reason: "invalid", error: "Telefon raqamini to‘g‘ri kiriting." }, { status: 400 });
  }
  if (!PURPOSES.has(purpose)) return jsonError("Noto‘g‘ri so‘rov.");

  const testMode = isOtpTestRequest(request);
  if (!testMode && !gatewayToken()) return gatewayErrorResponse("NOT_CONFIGURED");

  let userId: string | null = null;
  if (purpose === "verify") {
    userId = await getSessionUserId();
    if (!userId) return jsonError("Avval tizimga kiring.", 401);
  }

  const otpId = randomUUID();
  const code = generateCode();
  try {
    const created = await rpc<{ id?: string; expiresAt?: string; resendAt?: string; error?: string; retryAfter?: number }>(
      "sh_otp_create",
      {
        p_id: otpId,
        p_phone: phone,
        p_purpose: purpose,
        p_user: userId,
        p_code_hash: hashCode(otpId, code),
        p_ip_hash: clientIpHash(request),
        p_channel: testMode ? "test" : "telegram",
        p_ttl: OTP.ttlSeconds,
        p_resend: OTP.resendSeconds,
        p_phone_daily: OTP.phoneDaily,
        p_ip_hourly: testMode ? 0 : OTP.ipHourly,
      },
    );
    if (created.error === "too_soon") {
      const retryAfter = Math.max(1, Number(created.retryAfter) || OTP.resendSeconds);
      return NextResponse.json(
        { ok: false, reason: "too_soon", retryAfter, error: `Kodni qayta yuborish uchun ${retryAfter} soniya kuting.` },
        { status: 429 },
      );
    }
    if (created.error || !created.id) {
      const [error, status] = CREATE_ERRORS[created.error ?? "invalid"] ?? CREATE_ERRORS.invalid;
      return NextResponse.json({ ok: false, reason: created.error ?? "invalid", error }, { status });
    }

    const meta = {
      phoneMasked: maskPhone(phone),
      expiresAt: created.expiresAt,
      resendAt: created.resendAt,
      ttl: OTP.ttlSeconds,
      resendIn: OTP.resendSeconds,
      attempts: OTP.maxAttempts,
    };

    if (testMode) {
      await rpc("sh_otp_set_delivery", { p_id: otpId, p_request_id: null, p_status: "test", p_failed: false });
      return NextResponse.json({ ok: true, ...meta, channel: "test", testCode: code });
    }

    const ability = await checkSendAbility(phone);
    if (!ability.ok) {
      await rpc("sh_otp_set_delivery", { p_id: otpId, p_request_id: null, p_status: `fail:${ability.error}`, p_failed: true });
      console.warn("[otp] checkSendAbility", ability.error);
      return gatewayErrorResponse(ability.error);
    }
    const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin;
    const sent = await sendVerificationMessage({
      phone9: phone,
      code,
      requestId: ability.result.request_id,
      payload: `${purpose}:${otpId}`,
      callbackUrl: origin.startsWith("https://") ? `${origin}/api/auth/otp/callback` : undefined,
    });
    if (!sent.ok) {
      await rpc("sh_otp_set_delivery", { p_id: otpId, p_request_id: ability.result.request_id, p_status: `fail:${sent.error}`, p_failed: true });
      console.warn("[otp] sendVerificationMessage", sent.error);
      return gatewayErrorResponse(sent.error);
    }
    await rpc("sh_otp_set_delivery", {
      p_id: otpId,
      p_request_id: sent.result.request_id,
      p_status: sent.result.delivery_status?.status ?? "sent",
      p_failed: false,
    });
    return NextResponse.json({ ok: true, ...meta, channel: "telegram" });
  } catch (e) {
    console.error("[otp] send", e instanceof Error ? e.message : e);
    return jsonError("Kod yuborib bo‘lmadi. Qayta urinib ko‘ring.", 502);
  }
}
