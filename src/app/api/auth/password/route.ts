import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { getSessionUserId, hashPassword, jsonError, sameOrigin, verifyPassword } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** POST { current, next } — change the password of a phone+password account (current password required). */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Ruxsat yo‘q.", 403);
  const userId = await getSessionUserId();
  if (!userId) return jsonError("Avval tizimga kiring.", 401);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const current = typeof body?.current === "string" ? body.current : "";
  const next = typeof body?.next === "string" ? body.next : "";
  if (next.length < 6 || next.length > 200) return jsonError("Yangi parol kamida 6 belgidan iborat bo‘lishi kerak.");
  try {
    const cred = await rpc<{ passwordHash: string | null } | null>("sh_user_credentials", { p_user: userId });
    if (!cred?.passwordHash) return jsonError("Bu akkaunt ijtimoiy tarmoq orqali kirgan — parol o‘rnatilmagan.");
    if (!(await verifyPassword(current, cred.passwordHash))) return jsonError("Joriy parol noto‘g‘ri.", 401);
    const res = await rpc<{ ok?: boolean; error?: string }>("sh_change_password", { p_user: userId, p_hash: await hashPassword(next) });
    if (!res.ok) return jsonError("Parolni o‘zgartirib bo‘lmadi.");
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Parolni o‘zgartirib bo‘lmadi.", 502);
  }
}
