import "server-only";
import { NextResponse } from "next/server";
import { verificationEnforced } from "@/lib/server/otp";
import { getSession, jsonError, sameOrigin } from "@/lib/server/session";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function phoneUnverifiedResponse() {
  return NextResponse.json(
    { ok: false, reason: "phone_unverified", error: "Avval telefon raqamingizni tasdiqlang." },
    { status: 403 },
  );
}

/**
 * Cookie-authenticated user for mutations (CSRF guard + session). Blocked users are rejected in SQL (assert_active).
 * Once phone verification is enforced, sessions flagged unverified (pv=0) cannot mutate anything.
 */
export async function requireUser(request: Request) {
  if (request.method !== "GET" && !sameOrigin(request)) return { error: jsonError("Ruxsat yo‘q.", 403) } as const;
  const session = await getSession();
  if (!session) return { error: jsonError("Avval tizimga kiring.", 401) } as const;
  if (session.pv === 0 && verificationEnforced(request)) return { error: phoneUnverifiedResponse() } as const;
  return { userId: session.uid } as const;
}

export async function readJson(request: Request) {
  return ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
}

export function str(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
