import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";

export const dynamic = "force-dynamic";

const PLACEMENTS = new Set(["home", "marketplace", "seminar", "community"]);

/** Active ads for a placement (public). */
export async function GET(request: Request) {
  const placement = new URL(request.url).searchParams.get("placement") ?? "";
  if (!PLACEMENTS.has(placement)) return NextResponse.json({ ok: false, ads: [] }, { status: 400 });
  try {
    const ads = await rpc<unknown[]>("sh_active_ads", { p_placement: placement });
    return NextResponse.json({ ok: true, ads }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
  } catch {
    return NextResponse.json({ ok: false, ads: [] }, { status: 502 });
  }
}
