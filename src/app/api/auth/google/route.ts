import { NextResponse } from "next/server";
import { sessionPing } from "@/lib/server/admin";
import { upsertSocialProfile } from "@/lib/server/profile";
import { sessionJson } from "@/lib/server/otp";
import { recordRegistrationLead } from "@/lib/server/leads";
import { jsonError, sameOrigin } from "@/lib/server/session";

type TokenInfo = {
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  exp?: string;
  iss?: string;
};

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Ruxsat yo‘q.", 403);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  if (!clientId) return jsonError("Google sozlanmagan.", 500);
  const body = (await request.json().catch(() => null)) as { credential?: unknown; attribution?: unknown } | null;
  const credential = typeof body?.credential === "string" ? body.credential : "";
  if (!credential) return jsonError("Google ma’lumoti yo‘q.", 400);

  // Google verifies signature + expiry; we check audience and issuer.
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return jsonError("Google tasdiqlanmadi.", 401);
  const info = (await res.json()) as TokenInfo;
  if (
    info.aud !== clientId ||
    !info.sub ||
    (info.iss !== "accounts.google.com" && info.iss !== "https://accounts.google.com")
  ) {
    return jsonError("Google tasdiqlanmadi.", 401);
  }
  try {
    const profile = await upsertSocialProfile({
      provider: "google",
      uid: info.sub,
      fullName: info.name || info.email || "Google foydalanuvchi",
      // only a Google-verified email is stored, so ADMIN_EMAILS matching can trust it
      email: info.email_verified === true || info.email_verified === "true" ? info.email : undefined,
      avatarUrl: info.picture,
    });
    if (profile.blocked) return jsonError("Akkauntingiz bloklangan.", 403);
    const fresh = (await sessionPing(profile.id, request)) ?? profile;
    const lead = await recordRegistrationLead(fresh, { method: "google", role: fresh.specialty, attribution: body?.attribution });
    return sessionJson(fresh, request, { leadCreated: lead.created });
  } catch {
    return jsonError("Profilni yaratib bo‘lmadi.", 502);
  }
}
