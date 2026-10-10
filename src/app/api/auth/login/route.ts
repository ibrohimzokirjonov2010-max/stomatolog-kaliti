import { NextResponse } from "next/server";
import { sessionPing } from "@/lib/server/admin";
import { rpc } from "@/lib/server/db";
import { clean, normalizePhone, type DbProfile } from "@/lib/server/profile";
import { sessionJson } from "@/lib/server/otp";
import { jsonError, sameOrigin, verifyPassword } from "@/lib/server/session";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Ruxsat yo‘q.", 403);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const phone = normalizePhone(clean(body?.phone, 40) ?? "");
  const password = typeof body?.password === "string" ? body.password : "";
  if (phone.length !== 9 || !password) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  try {
    const row = await rpc<{ passwordHash: string; blocked?: boolean; profile: DbProfile } | null>("sh_phone_credentials", {
      p_phone: phone,
    });
    if (!row) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
    if (!(await verifyPassword(password, row.passwordHash)))
      return NextResponse.json({ ok: false, reason: "wrong_password" }, { status: 401 });
    if (row.blocked)
      return NextResponse.json({ ok: false, reason: "blocked", error: "Akkauntingiz bloklangan." }, { status: 403 });
    const profile = (await sessionPing(row.profile.id, request)) ?? row.profile;
    return sessionJson(profile, request);
  } catch {
    return jsonError("Kirib bo‘lmadi. Qayta urinib ko‘ring.", 502);
  }
}
