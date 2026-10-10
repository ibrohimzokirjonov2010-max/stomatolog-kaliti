import { NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { validateProduct } from "@/lib/server/seller";
import { UUID_RE, readJson, requireUser, str } from "@/lib/server/user";

export const dynamic = "force-dynamic";

/** Create or update a product (client supplies a UUID so optimistic UI can reference it). Only active stores. */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const id = str(body.id, 40);
  if (!UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  const v = validateProduct(body, id);
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
  try {
    const res = await rpc<{ product?: unknown; error?: string }>("sh_save_product", { p_user: guard.userId, p_product: v.value });
    if (res.error === "session") return NextResponse.json({ ok: false, error: "Do‘koningiz hali tasdiqlanmagan." }, { status: 403 });
    if (res.error) return NextResponse.json({ ok: false, error: "Ruxsat yo‘q." }, { status: 403 });
    return NextResponse.json({ ok: true, product: res.product });
  } catch (e) {
    return dbErrorJson(e, "Mahsulotni saqlab bo‘lmadi.");
  }
}
