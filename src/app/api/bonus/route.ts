import { NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { gatewayToken } from "@/lib/server/otp";
import { getSessionUserId } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** My bonus balance, expiry and history (computed server-side from the bonus ledger). */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Avval tizimga kiring." }, { status: 401 });
  try {
    const bonus = await rpc<Record<string, unknown>>("sh_my_bonus", { p_user: userId });
    return NextResponse.json({ ok: true, bonus: { ...bonus, verificationEnabled: Boolean(gatewayToken()) } });
  } catch (e) {
    return dbErrorJson(e, "Bonusni yuklab bo‘lmadi.");
  }
}
