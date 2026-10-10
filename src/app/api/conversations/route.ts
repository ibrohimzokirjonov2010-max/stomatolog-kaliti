import { NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { UUID_RE, readJson, requireUser, str } from "@/lib/server/user";

export const dynamic = "force-dynamic";

/** GET ?role=seller → the seller's inbox. GET ?role=buyer&store=&product=&order= → the buyer's own conversations. */
export async function GET(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const url = new URL(request.url);
  const role = url.searchParams.get("role") === "seller" ? "seller" : "buyer";
  const store = url.searchParams.get("store") ?? "";
  const product = url.searchParams.get("product") ?? "";
  const order = url.searchParams.get("order") ?? "";
  try {
    const list = await rpc<unknown[]>("sh_conv_list", {
      p_user: guard.userId,
      p_role: role,
      p_store: UUID_RE.test(store) ? store : null,
      p_product: UUID_RE.test(product) ? product : null,
      p_order: /^SK-\d{3,12}$/.test(order) ? order : null,
    });
    return NextResponse.json({ ok: true, conversations: list });
  } catch (e) {
    return dbErrorJson(e, "Xabarlarni yuklab bo‘lmadi.");
  }
}

/** Start (or continue) a conversation with a store. Optional context: product / own order. */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const storeId = str(body.storeId, 40);
  const productId = str(body.productId, 40);
  const orderId = str(body.orderId, 24);
  const text = str(body.body, 2000);
  if (!UUID_RE.test(storeId) || (productId && !UUID_RE.test(productId)) || (orderId && !/^SK-\d{3,12}$/.test(orderId))) {
    return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  }
  if (!text) return NextResponse.json({ ok: false, error: "Xabar matnini kiriting." }, { status: 400 });
  try {
    const res = await rpc<{ ok?: boolean; id?: string; error?: string }>("sh_conv_start", {
      p_user: guard.userId,
      p_store: storeId,
      p_product: productId || null,
      p_order: orderId || null,
      p_body: text,
    });
    if (res.error === "own_store") return NextResponse.json({ ok: false, error: "O‘z do‘koningizga yoza olmaysiz." }, { status: 400 });
    if (res.error) return NextResponse.json({ ok: false, error: "Do‘kon yoki mahsulot topilmadi." }, { status: 404 });
    return NextResponse.json({ ok: true, id: res.id });
  } catch (e) {
    return dbErrorJson(e, "Xabarni yuborib bo‘lmadi.");
  }
}
