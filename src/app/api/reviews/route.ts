import { NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { safeImage } from "@/lib/server/seller";
import { readJson, requireUser, str } from "@/lib/server/user";

export const dynamic = "force-dynamic";
const ORDER_RE = /^SK-\d{3,12}$/;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Public: real reviews of a product (?product=uuid). Buyer: which items of my order can be / already were reviewed (?order=). */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const product = sp.get("product");
  if (product !== null) {
    // static (bundled) catalog ids are not UUIDs → they have no reviews yet
    if (!UUID_RE.test(product)) return NextResponse.json({ ok: true, count: 0, avg: null, reviews: [] });
    try {
      const res = await rpc<{ count: number; avg: number | null; reviews: unknown[] }>("sh_product_reviews", { p_product: product });
      return NextResponse.json({ ok: true, ...res });
    } catch (e) {
      return dbErrorJson(e, "Sharhlarni yuklab bo‘lmadi.");
    }
  }
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const order = sp.get("order") ?? "";
  if (!ORDER_RE.test(order)) return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  try {
    const res = await rpc<{ eligible: boolean; reviewed: { productId: string; rating: number; body?: string; createdAt?: string; reply?: string; replyAt?: string }[] }>("sh_review_order_state", {
      p_user: guard.userId,
      p_order: order,
    });
    return NextResponse.json({ ok: true, ...res });
  } catch (e) {
    return dbErrorJson(e, "Yuklab bo‘lmadi.");
  }
}

const star = (v: unknown) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
};

/** Buyer: leave a review. Only the owner of a DELIVERED order, once per item (enforced in SQL). */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const order = str(body.orderId, 24);
  const product = str(body.productId, 60);
  const rating = star(body.rating);
  if (!ORDER_RE.test(order) || !product || !rating) return NextResponse.json({ ok: false, error: "Baho (1–5) ni tanlang." }, { status: 400 });
  const catsIn = (body.cats ?? {}) as Record<string, unknown>;
  const cats: Record<string, number> = {};
  for (const k of ["quality", "delivery", "packaging", "service", "value"]) {
    const v = star(catsIn[k]);
    if (v) cats[k] = v;
  }
  const images = Array.isArray(body.images) ? body.images.map((x) => safeImage(x)).filter(Boolean).slice(0, 4) : [];
  try {
    const res = await rpc<{ review?: unknown; error?: string }>("sh_review_create", {
      p_user: guard.userId,
      p_order: order,
      p_product: product,
      p_rating: rating,
      p_cats: cats,
      p_body: str(body.body, 2000),
      p_images: images,
    });
    if (res.error === "already") return NextResponse.json({ ok: false, error: "Bu mahsulotga sharh qoldirgansiz." }, { status: 409 });
    if (res.error === "not_delivered") return NextResponse.json({ ok: false, error: "Sharh faqat yetkazilgan buyurtmaga qoldiriladi." }, { status: 400 });
    if (res.error) return NextResponse.json({ ok: false, error: "Buyurtma yoki mahsulot topilmadi." }, { status: 404 });
    return NextResponse.json({ ok: true, review: res.review });
  } catch (e) {
    return dbErrorJson(e, "Sharhni saqlab bo‘lmadi.");
  }
}
