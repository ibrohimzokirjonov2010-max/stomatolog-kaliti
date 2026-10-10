import "server-only";
import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import type { DbProfile } from "@/lib/server/profile";
import { withSession } from "@/lib/server/session";
import { withDeviceCookie } from "@/lib/server/origin";

/**
 * Phone verification via Telegram Gateway (https://core.telegram.org/gateway/api).
 * We generate the 6-digit code ourselves (crypto RNG), store only an HMAC of it, and ask Telegram to deliver it
 * with `code`. Verification is local (attempt counter reserved atomically in SQL, constant-time compare here),
 * so it does not depend on Gateway availability at verify time. checkSendAbility runs first (its request_id makes
 * the send free and tells us when the number has no Telegram).
 */
export const OTP = {
  length: 6,
  ttlSeconds: 300,
  resendSeconds: 60,
  maxAttempts: 5,
  phoneDaily: 5,
  ipHourly: 20,
} as const;

export type OtpPurpose = "register" | "verify" | "reset";

const GATEWAY = "https://gatewayapi.telegram.org";

export function gatewayToken() {
  return process.env.TELEGRAM_GATEWAY_TOKEN?.trim() || "";
}

function hmacKey() {
  const base = process.env.STOMAHUB_SESSION_SECRET?.trim();
  if (!base) throw new Error("STOMAHUB_SESSION_SECRET missing");
  return createHash("sha256").update(`otp:${base}`).digest();
}

/** Test-only mode: header `x-otp-test: <OTP_TEST_SECRET>` returns the code instead of sending it. */
export function isOtpTestRequest(request: Request) {
  const secret = process.env.OTP_TEST_SECRET?.trim();
  const got = request.headers.get("x-otp-test")?.trim();
  if (!secret || !got || secret.length < 24) return false;
  const a = createHash("sha256").update(secret).digest();
  const b = createHash("sha256").update(got).digest();
  return timingSafeEqual(a, b);
}

/** Verification is mandatory once the Gateway is connected (or for test-mode requests). */
export function verificationEnforced(request: Request) {
  return Boolean(gatewayToken()) || isOtpTestRequest(request);
}

export function generateCode() {
  return String(randomInt(0, 10 ** OTP.length)).padStart(OTP.length, "0");
}

export function hashCode(otpId: string, code: string) {
  return createHmac("sha256", hmacKey()).update(`${otpId}:${code}`).digest("hex");
}

export function codeMatches(otpId: string, code: string, storedHex: string) {
  const expected = Buffer.from(hashCode(otpId, code), "hex");
  const stored = Buffer.from(storedHex, "hex");
  return expected.length === stored.length && timingSafeEqual(expected, stored);
}

export function clientIpHash(request: Request) {
  const ip =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";
  if (!ip) return null;
  return createHmac("sha256", hmacKey()).update(`ip:${ip}`).digest("hex").slice(0, 32);
}

/** 9-digit national number (DB format) → E.164 for Telegram. */
export function toE164(phone9: string) {
  return `+998${phone9}`;
}

export function maskPhone(phone9: string) {
  return `+998 ${phone9.slice(0, 2)} *** ${phone9.slice(5, 7)} ${phone9.slice(7)}`;
}

export function isValidCode(code: unknown): code is string {
  return typeof code === "string" && new RegExp(`^\\d{${OTP.length}}$`).test(code);
}

type GatewayResult<T> = { ok: true; result: T } | { ok: false; error: string };
type RequestStatus = { request_id: string; phone_number: string; request_cost?: number; delivery_status?: { status: string } };

async function gatewayCall<T>(method: string, body: Record<string, unknown>): Promise<GatewayResult<T>> {
  const token = gatewayToken();
  if (!token) return { ok: false, error: "NOT_CONFIGURED" };
  try {
    const res = await fetch(`${GATEWAY}/${method}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; result?: T; error?: string } | null;
    if (json?.ok && json.result) return { ok: true, result: json.result };
    return { ok: false, error: json?.error || `HTTP_${res.status}` };
  } catch {
    return { ok: false, error: "NETWORK" };
  }
}

export function checkSendAbility(phone9: string) {
  return gatewayCall<RequestStatus>("checkSendAbility", { phone_number: toE164(phone9) });
}

export function sendVerificationMessage(input: { phone9: string; code: string; requestId?: string; payload: string; callbackUrl?: string }) {
  return gatewayCall<RequestStatus>("sendVerificationMessage", {
    phone_number: toE164(input.phone9),
    code: input.code,
    ttl: OTP.ttlSeconds,
    payload: input.payload.slice(0, 128),
    ...(input.requestId ? { request_id: input.requestId } : {}),
    ...(input.callbackUrl ? { callback_url: input.callbackUrl } : {}),
  });
}

/** Conversion tracking recommended by Telegram when the code is set by us (fire-and-forget). */
export function reportCodeEntered(requestId: string | null | undefined, code: string) {
  if (!requestId || !gatewayToken()) return;
  void gatewayCall("checkVerificationStatus", { request_id: requestId, code });
}

/** Verifies X-Request-Signature of a Gateway delivery report. */
export function verifyGatewaySignature(timestamp: string, body: string, signature: string) {
  const token = gatewayToken();
  if (!token || !timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 600) return false;
  const secret = createHash("sha256").update(token).digest();
  const expected = Buffer.from(createHmac("sha256", secret).update(`${timestamp}\n${body}`).digest("hex"));
  const got = Buffer.from(signature.toLowerCase());
  return expected.length === got.length && timingSafeEqual(expected, got);
}

/** Maps Gateway error codes to user-facing Uzbek messages. */
export function gatewayErrorResponse(error: string) {
  const e = error.toUpperCase();
  if (e === "NOT_CONFIGURED")
    return NextResponse.json({ ok: false, reason: "not_configured", error: "Tasdiqlash xizmati hali ulanmagan." }, { status: 503 });
  if (e.includes("PHONE_NUMBER_INVALID"))
    return NextResponse.json({ ok: false, reason: "invalid", error: "Telefon raqami noto‘g‘ri." }, { status: 400 });
  if (e.includes("FLOOD") || e.includes("TOO_MANY"))
    return NextResponse.json({ ok: false, reason: "rate_limited", error: "Juda ko‘p urinish. Birozdan keyin qayta urinib ko‘ring." }, { status: 429 });
  if (e.includes("ACCESS_TOKEN") || e.includes("BALANCE") || e.includes("NETWORK") || e.startsWith("HTTP_5"))
    return NextResponse.json({ ok: false, reason: "unavailable", error: "Tasdiqlash xizmati vaqtincha ishlamayapti. Birozdan keyin urinib ko‘ring." }, { status: 503 });
  // PHONE_NUMBER_NOT_FOUND / cannot send → number has no Telegram account
  return NextResponse.json({ ok: false, reason: "no_telegram", error: "Bu raqamda Telegram topilmadi." }, { status: 422 });
}

type AttemptRow = { id?: string; codeHash?: string; attemptsLeft?: number; requestId?: string | null; error?: string };

export type CodeCheck =
  | { ok: true; otpId: string }
  | { ok: false; response: NextResponse };

const ATTEMPT_ERRORS: Record<string, [string, string, number]> = {
  no_code: ["no_code", "Avval kod so‘rang.", 400],
  expired: ["expired", "Kod muddati tugadi. Yangi kod so‘rang.", 400],
  locked: ["locked", "Urinishlar tugadi. Yangi kod so‘rang.", 429],
};

/** Reserves one attempt atomically (SQL row lock) and compares the code in constant time. */
export async function checkCode(phone9: string, purpose: OtpPurpose, code: string, userId: string | null): Promise<CodeCheck> {
  const row = await rpc<AttemptRow>("sh_otp_attempt", { p_phone: phone9, p_purpose: purpose, p_user: userId });
  if (row.error || !row.id || !row.codeHash) {
    const [reason, error, status] = ATTEMPT_ERRORS[row.error ?? "no_code"] ?? ATTEMPT_ERRORS.no_code;
    return { ok: false, response: NextResponse.json({ ok: false, reason, error }, { status }) };
  }
  if (!codeMatches(row.id, code, row.codeHash)) {
    const left = Math.max(0, row.attemptsLeft ?? 0);
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          reason: left > 0 ? "wrong_code" : "locked",
          attemptsLeft: left,
          error: left > 0 ? `Kod noto‘g‘ri. ${left} ta urinish qoldi` : "Kod noto‘g‘ri. Urinishlar tugadi — yangi kod so‘rang.",
        },
        { status: left > 0 ? 400 : 429 },
      ),
    };
  }
  reportCodeEntered(row.requestId, code);
  return { ok: true, otpId: row.id };
}

/** Profile as returned to the browser: adds whether this session must verify its phone now. */
export function clientProfile(profile: DbProfile, request: Request) {
  return { ...profile, needsPhoneVerification: verificationEnforced(request) && !profile.phoneVerified };
}

/** JSON response with a fresh session cookie that carries the phone-verified flag. */
export function sessionJson(profile: DbProfile, request: Request, extra: Record<string, unknown> = {}) {
  return withDeviceCookie(
    withSession(
      NextResponse.json({ ok: true, ...extra, profile: clientProfile(profile, request) }),
      profile.id,
      Boolean(profile.phoneVerified),
    ),
    request,
  );
}
