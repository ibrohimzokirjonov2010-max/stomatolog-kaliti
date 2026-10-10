import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { getSessionUserId, sameOrigin } from "@/lib/server/session";
import { UUID_RE, readJson, str } from "@/lib/server/user";

export const dynamic = "force-dynamic";

const PLACEMENTS = new Set(["home", "marketplace", "seminar", "community"]);

/** Log an ad impression/click (same-origin only; client dedupes per session). */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const body = await readJson(request);
  const ad = str(body.adId, 40);
  const kind = str(body.kind, 10);
  const placement = str(body.placement, 20);
  if (!UUID_RE.test(ad) || (kind !== "view" && kind !== "click") || !PLACEMENTS.has(placement)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const viewer = await getSessionUserId();
  try {
    await rpc("sh_log_ad_event", { p_ad: ad, p_kind: kind, p_placement: placement, p_viewer: viewer ?? null });
  } catch {
    /* analytics must never break the page */
  }
  return NextResponse.json({ ok: true });
}
