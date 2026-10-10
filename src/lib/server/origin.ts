import "server-only";
import { createHash, createHmac, randomUUID } from "node:crypto";
import type { NextResponse } from "next/server";

/**
 * Sign-up abuse limits: server-side IP hash + a random device cookie (`sk_dev`, HMAC-hashed before it reaches the DB).
 * Raw IPs / cookie ids are never stored.
 */
const DEVICE_COOKIE = "sk_dev";
const pendingDevice = new WeakMap<Request, string>();

function key() {
  const base = process.env.STOMAHUB_SESSION_SECRET?.trim();
  if (!base) throw new Error("STOMAHUB_SESSION_SECRET missing");
  return createHash("sha256").update(`device:${base}`).digest();
}

function ipHash(request: Request) {
  const ip =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";
  return ip ? createHmac("sha256", key()).update(`ip:${ip}`).digest("hex").slice(0, 32) : null;
}

function cookieId(request: Request) {
  const raw = request.headers.get("cookie") ?? "";
  const m = raw.match(/(?:^|;\s*)sk_dev=([0-9a-f-]{36})/i);
  return m ? m[1] : null;
}

export function originOf(request?: Request): { ipHash: string | null; deviceHash: string | null } {
  if (!request) return { ipHash: null, deviceHash: null };
  let id = cookieId(request) ?? pendingDevice.get(request) ?? null;
  if (!id) {
    id = randomUUID();
    pendingDevice.set(request, id);
  }
  return {
    ipHash: ipHash(request),
    deviceHash: createHmac("sha256", key()).update(`dev:${id}`).digest("hex").slice(0, 32),
  };
}

/** Sets the device cookie when this request had none (call on responses of routes that ping). */
export function withDeviceCookie<T>(res: NextResponse<T>, request: Request) {
  const id = pendingDevice.get(request);
  if (id && !cookieId(request)) {
    res.cookies.set(DEVICE_COOKIE, id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}
