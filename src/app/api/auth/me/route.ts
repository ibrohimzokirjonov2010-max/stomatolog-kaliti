import { NextResponse } from "next/server";
import { sessionPing } from "@/lib/server/admin";
import { clientProfile, sessionJson } from "@/lib/server/otp";
import { withDeviceCookie } from "@/lib/server/origin";
import { clearSession, getSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, profile: null });
  try {
    // touches last_seen (throttled) and grants owner role to ADMIN_* env accounts
    const profile = await sessionPing(session.uid, request);
    if (!profile) return clearSession(NextResponse.json({ ok: true, profile: null }));
    if (profile.blocked) return clearSession(NextResponse.json({ ok: true, profile: null, blocked: true }));
    const pv = profile.phoneVerified ? 1 : 0;
    // keep the cookie's phone-verified flag in sync with the DB (used by proxy.ts / API guards)
    if (session.pv !== pv) return sessionJson(profile, request);
    return withDeviceCookie(NextResponse.json({ ok: true, profile: clientProfile(profile, request) }), request);
  } catch {
    return NextResponse.json({ ok: false, error: "Profilni yuklab bo‘lmadi." }, { status: 502 });
  }
}
