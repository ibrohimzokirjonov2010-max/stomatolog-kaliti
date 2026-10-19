import { NextResponse } from "next/server";
import { readCache, rpc } from "@/lib/server/db";
import { jsonError } from "@/lib/server/session";
import { UUID_RE } from "@/lib/server/user";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return jsonError("Topilmadi.", 404);
  try {
    const product = await rpc<Record<string, unknown> | null>("sh_product_public", { p_id: id });
    if (!product) return jsonError("Mahsulot topilmadi.", 404);
    return NextResponse.json({ ok: true, product }, { headers: readCache(false) });
  } catch {
    return jsonError("Mahsulotni yuklab bo‘lmadi.", 502);
  }
}
