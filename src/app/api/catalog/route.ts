import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Public marketplace data from the DB: approved shops and their active products. */
export async function GET() {
  try {
    const data = await rpc<{ shops: unknown[]; products: unknown[] }>("sh_public_catalog", {});
    return NextResponse.json({ ok: true, ...data }, { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" } });
  } catch {
    return NextResponse.json({ ok: false, shops: [], products: [] }, { status: 502 });
  }
}
