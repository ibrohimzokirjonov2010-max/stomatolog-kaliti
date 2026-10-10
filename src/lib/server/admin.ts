import { originOf } from "@/lib/server/origin";
import "server-only";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { verificationEnforced } from "@/lib/server/otp";
import type { DbProfile } from "@/lib/server/profile";
import { getSessionUserId, sameOrigin } from "@/lib/server/session";

export type AdminRole = "owner" | "admin" | "moderator" | "finance";

export type AdminProfile = DbProfile & {
  isAdmin: true;
  adminRole: AdminRole;
  badges: { applications: number; disputes: number; reports: number; payouts: number };
};

function list(name: string) {
  return (process.env[name] ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** ADMIN_PHONES entries normalized to the 9-digit national number used in profiles (+998 99 188 73 30 → 991887330). */
export function adminPhones() {
  return list("ADMIN_PHONES")
    .map((v) => v.replace(/\D/g, ""))
    .filter((d) => d.length >= 9)
    .map((d) => d.slice(-9));
}

export function adminEmails() {
  return list("ADMIN_EMAILS").map((v) => v.toLowerCase());
}

export function adminTelegramIds() {
  return list("ADMIN_TELEGRAM_IDS").map((v) => v.replace(/\D/g, "")).filter(Boolean);
}

/** Touch last_seen (throttled in SQL) and promote owner accounts listed in ADMIN_* env. Returns fresh profile. */
export async function sessionPing(userId: string, request?: Request) {
  const origin = originOf(request);
  return rpc<(DbProfile & { blocked?: boolean; isAdmin?: boolean }) | null>("sh_session_ping", {
    p_user: userId,
    p_ip_hash: origin.ipHash,
    p_device_hash: origin.deviceHash,
    p_phones: adminPhones(),
    p_emails: adminEmails(),
    p_telegram: adminTelegramIds(),
  });
}

/** Loads the current admin (cookie → DB role re-check). Returns null for guests / non-admins / blocked. */
export async function getAdmin(): Promise<AdminProfile | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  try {
    return await rpc<AdminProfile | null>("sh_admin_whoami", { p_admin: userId });
  } catch {
    return null;
  }
}

/** For server components/layouts: 404 unless admin. */
export async function requireAdminPage(): Promise<AdminProfile> {
  const admin = await getAdmin();
  if (!admin) notFound();
  return admin;
}

type Guard = { admin: AdminProfile; error?: undefined } | { admin?: undefined; error: NextResponse };

/** For /api/admin/* routes: 404 (not 403) for anyone who is not an admin, so the panel is not discoverable. */
export async function requireAdmin(request?: Request, roles?: AdminRole[]): Promise<Guard> {
  if (request && request.method !== "GET" && !sameOrigin(request)) {
    return { error: NextResponse.json({ ok: false, error: "Ruxsat yo‘q." }, { status: 403 }) };
  }
  const admin = await getAdmin();
  if (!admin) return { error: NextResponse.json({ ok: false, error: "Topilmadi." }, { status: 404 }) };
  if (request && !admin.phoneVerified && verificationEnforced(request)) {
    return { error: NextResponse.json({ ok: false, reason: "phone_unverified", error: "Avval telefon raqamingizni tasdiqlang." }, { status: 403 }) };
  }
  if (roles && admin.adminRole !== "owner" && !roles.includes(admin.adminRole)) {
    return { error: NextResponse.json({ ok: false, error: "Bu amal uchun ruxsatingiz yo‘q." }, { status: 403 }) };
  }
  return { admin };
}

export function adminRpcError(error: unknown) {
  const status = error && typeof error === "object" && "status" in error ? Number((error as { status: number }).status) : 502;
  return NextResponse.json({ ok: false, error: "Amalni bajarib bo‘lmadi." }, { status: status === 400 ? 400 : 502 });
}
