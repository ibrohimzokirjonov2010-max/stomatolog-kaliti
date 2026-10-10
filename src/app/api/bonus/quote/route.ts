import { NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { normalizeOrderItems } from "@/lib/server/order-items";
import { getSessionUserId } from "@/lib/server/session";
import { readJson } from "@/lib/server/user";

export const dynamic = "force-dynamic";

/** How much bonus applies to this cart. SQL decides (Marketplace lines only, balance, share cap); checkout re-checks atomically. */
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Avval tizimga kiring." }, { status: 401 });
  const body = await readJson(request);
  const raw = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  const normalized = normalizeOrderItems(raw);
  if (!normalized.ok) return NextResponse.json({ ok: false, error: normalized.error }, { status: 400 });
  try {
    const quote = await rpc<Record<string, unknown>>("sh_bonus_quote", { p_user: userId, p_items: normalized.items });
    return NextResponse.json({ ok: true, quote });
  } catch (e) {
    return dbErrorJson(e, "Bonusni hisoblab bo‘lmadi.");
  }
}
