import { NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { requireUser } from "@/lib/server/user";

export const dynamic = "force-dynamic";

/** Reviews of my store; ?summary=1 → just count / average / unanswered. */
export async function GET(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  try {
    if (new URL(request.url).searchParams.get("summary")) {
      const s = await rpc<{ count: number; avg: number | null; unanswered: number }>("sh_review_summary", { p_user: guard.userId });
      return NextResponse.json({ ok: true, ...s });
    }
    const res = await rpc<{ storeId?: string; reviews?: unknown[]; error?: string }>("sh_seller_reviews", { p_user: guard.userId });
    if (res.error) return NextResponse.json({ ok: false, error: "Do‘kon topilmadi." }, { status: 404 });
    return NextResponse.json({ ok: true, reviews: res.reviews ?? [] });
  } catch (e) {
    return dbErrorJson(e, "Sharhlarni yuklab bo‘lmadi.");
  }
}
