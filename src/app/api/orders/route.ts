import { after, NextResponse } from "next/server";
import { dbErrorJson, privateCache, rpc } from "@/lib/server/db";
import { normalizeOrderItems } from "@/lib/server/order-items";
import { readJson, requireUser, str } from "@/lib/server/user";
import { getSessionUserId } from "@/lib/server/session";
import { flushTelegramOutbox } from "@/lib/server/telegram-notify";

export const dynamic = "force-dynamic";

const PAYMENTS = new Set(["click", "payme", "naqd"]);

/** My orders as buyer, plus orders to my store as seller. */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: true, buyer: [], seller: [], shopId: null }, { headers: privateCache() });
  try {
    const data = await rpc<Record<string, unknown>>("sh_my_orders", { p_user: userId });
    return NextResponse.json({ ok: true, ...data }, { headers: privateCache() });
  } catch (e) {
    return dbErrorJson(e, "Buyurtmalarni yuklab bo‘lmadi.");
  }
}

/**
 * Create an order. Seller (DB) products are priced/stocked in SQL; platform catalog items are priced here from
 * the bundled catalog — client prices are never trusted. Unknown items are rejected.
 */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const order = (body.order ?? {}) as Record<string, unknown>;
  const name = str(order.name, 120);
  const phone = str(order.phone, 40);
  const address = str(order.address, 300);
  const payment = str(order.payment, 10);
  if (!name || phone.replace(/\D/g, "").length < 9 || !address) {
    return NextResponse.json({ ok: false, error: "Ism, telefon va manzil majburiy." }, { status: 400 });
  }
  if (!PAYMENTS.has(payment)) return NextResponse.json({ ok: false, error: "To‘lov usulini tanlang." }, { status: 400 });
  const rawItems = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  if (!rawItems.length) return NextResponse.json({ ok: false, error: "Savat bo‘sh." }, { status: 400 });

  const normalized = normalizeOrderItems(rawItems);
  if (!normalized.ok) return NextResponse.json({ ok: false, error: normalized.error }, { status: 400 });
  const items = normalized.items;

  try {
    const res = await rpc<{ order?: { id: string }; error?: string }>("sh_create_order", {
      p_user: guard.userId,
      p_order: { name, phone, city: str(order.city, 60), address, note: str(order.note, 500), payment },
      p_items: items,
      p_use_bonus: body.useBonus === true,
    });
    if (res.error || !res.order) return NextResponse.json({ ok: false, error: "Buyurtma yaratilmadi." }, { status: 400 });
    after(() => flushTelegramOutbox());
    return NextResponse.json({ ok: true, order: res.order });
  } catch (e) {
    return dbErrorJson(e, "Buyurtma yaratilmadi.");
  }
}
