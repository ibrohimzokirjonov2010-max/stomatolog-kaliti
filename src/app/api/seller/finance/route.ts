import { NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { readJson, requireUser, str } from "@/lib/server/user";

export const dynamic = "force-dynamic";

/** Seller finance summary computed from escrow_ledger / orders (read-only) + payout requests. */
export async function GET(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  if (new URL(request.url).searchParams.get("unseen") === "1") {
    try {
      const res = await rpc<{ count: number }>("sh_payouts_unseen", { p_user: guard.userId });
      return NextResponse.json({ ok: true, count: res.count ?? 0 });
    } catch {
      return NextResponse.json({ ok: true, count: 0 });
    }
  }
  try {
    const res = await rpc<Record<string, unknown>>("sh_seller_finance", { p_user: guard.userId });
    if (res.error) return NextResponse.json({ ok: false, error: "Do‘kon topilmadi." }, { status: 404 });
    return NextResponse.json({ ok: true, finance: res });
  } catch (e) {
    return dbErrorJson(e, "To‘lov ma’lumotini yuklab bo‘lmadi.");
  }
}

/** Create a payout REQUEST (no real transfer happens). */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  if (body.action === "seen") {
    try {
      await rpc("sh_payouts_mark_seen", { p_user: guard.userId });
      return NextResponse.json({ ok: true });
    } catch (e) {
      return dbErrorJson(e, "Bajarib bo‘lmadi.");
    }
  }
  // Only masked requisites are accepted: last 4 digits + holder + bank/brand. A full card number is never stored.
  const cardIn = (body.card ?? {}) as Record<string, unknown>;
  const last4 = String(cardIn.last4 ?? "").replace(/\D/g, "");
  const holder = str(cardIn.holder, 60);
  if (last4.length !== 4 || holder.length < 2) {
    return NextResponse.json({ ok: false, error: "Avval to‘lov kartasini qo‘shing (oxirgi 4 raqam va karta egasi)." }, { status: 400 });
  }
  const card = { last4, holder, bank: str(cardIn.bank, 60), brand: str(cardIn.brand, 20) };
  const amount = Math.floor(Number(body.amount));
  if (!Number.isFinite(amount) || amount < 1000 || amount > 1_000_000_000) {
    return NextResponse.json({ ok: false, error: "Summani to‘g‘ri kiriting." }, { status: 400 });
  }
  try {
    const res = await rpc<{ ok?: boolean; error?: string }>("sh_request_payout", { p_user: guard.userId, p_amount: amount, p_card: card });
    if (res.error === "card") return NextResponse.json({ ok: false, error: "Karta rekvizitlari noto‘g‘ri." }, { status: 400 });
    if (res.error === "insufficient") return NextResponse.json({ ok: false, error: "Hisobdagi mablag‘ yetarli emas." }, { status: 400 });
    if (res.error) return NextResponse.json({ ok: false, error: "Do‘kon topilmadi yoki tasdiqlanmagan." }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbErrorJson(e, "So‘rovni yuborib bo‘lmadi.");
  }
}
