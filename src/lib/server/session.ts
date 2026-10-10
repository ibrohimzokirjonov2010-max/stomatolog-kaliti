import "server-only";
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = "sh_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const value = process.env.STOMAHUB_SESSION_SECRET?.trim();
  if (!value) throw new Error("STOMAHUB_SESSION_SECRET missing");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/**
 * Session payload: uid + exp, plus `pv` (phone verified: 1 / 0) so proxy.ts and API guards can gate
 * unverified accounts without a DB round-trip. `pv` is refreshed from the DB by /api/auth/me.
 */
export function createSessionToken(userId: string, phoneVerified?: boolean) {
  const payload = Buffer.from(
    JSON.stringify({
      uid: userId,
      exp: Math.floor(Date.now() / 1000) + MAX_AGE,
      ...(phoneVerified === undefined ? {} : { pv: phoneVerified ? 1 : 0 }),
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export type SessionData = { uid: string; pv?: 0 | 1 };

export function readSessionToken(token: string | undefined | null): SessionData | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(sig);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { uid?: string; exp?: number; pv?: number };
    if (!data.uid || !data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    if (!/^[0-9a-f-]{36}$/i.test(data.uid)) return null;
    return { uid: data.uid, ...(data.pv === 0 || data.pv === 1 ? { pv: data.pv } : {}) };
  } catch {
    return null;
  }
}

export function verifySessionToken(token: string | undefined | null): string | null {
  return readSessionToken(token)?.uid ?? null;
}

export async function getSession() {
  const store = await cookies();
  return readSessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function getSessionUserId() {
  return (await getSession())?.uid ?? null;
}

export function withSession<T>(res: NextResponse<T>, userId: string, phoneVerified?: boolean) {
  res.cookies.set(SESSION_COOKIE, createSessionToken(userId, phoneVerified), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}

export function clearSession<T>(res: NextResponse<T>) {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, saltB64, keyB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const key = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length);
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/** Basic CSRF guard for cookie-authenticated mutations. */
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
