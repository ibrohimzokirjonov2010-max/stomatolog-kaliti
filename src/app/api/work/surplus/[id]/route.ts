import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { viewerId, workError } from "@/lib/server/work";

export const dynamic = "force-dynamic";

/** Single listing for the product page: published for everyone, any state for its owner. Phone/telegram only for the owner. */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "E’lon topilmadi." }, { status: 404 });
  try {
    const listing = await rpc("sh_surplus_get", { p_id: id, p_viewer: await viewerId() });
    if (!listing) return NextResponse.json({ ok: false, error: "E’lon topilmadi yoki hali tasdiqlanmagan." }, { status: 404 });
    return NextResponse.json({ ok: true, listing });
  } catch (e) {
    return workError(e);
  }
}

/** { action: "close" | "open" | "delete" } — owner only. */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  const body = await readJson(request);
  const action = typeof body.action === "string" ? body.action : "";
  if (!UUID_RE.test(id) || !["close", "open", "delete"].includes(action)) return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  try {
    const listing = await rpc("sh_surplus_set", { p_user: guard.userId, p_id: id, p_action: action });
    return NextResponse.json({ ok: true, listing });
  } catch (e) {
    return workError(e);
  }
}
