import { NextResponse } from "next/server";
import { readCache, rpc } from "@/lib/server/db";
import { publicizeProduct } from "@/lib/media-url";

export const dynamic = "force-dynamic";

/** Public marketplace data from the DB: active shops and their active products. */
export async function GET() {
  try {
    const data = await rpc<{ shops: unknown[]; products: unknown[] }>("sh_public_catalog", {});
    const products = Array.isArray(data.products)
      ? data.products.map((row) => (row && typeof row === "object" ? publicizeProduct(row as Record<string, unknown>) : row))
      : [];
    return NextResponse.json({ ok: true, ...data, products }, { headers: readCache(false) });
  } catch {
    return NextResponse.json({ ok: false, shops: [], products: [] }, { status: 502 });
  }
}
