import { NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { rpc } from "@/lib/server/db";
import { readJson, str } from "@/lib/server/user";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mark a payout request paid (note = transaction reference) or reject it (note = reason; balance is released automatically). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request, ["admin", "finance"]);
  if (guard.error) return guard.error;
  const { id } = await params;
  const body = await readJson(request);
  const action = str(body.action, 10);
  if (!UUID_RE.test(id) || (action !== "paid" && action !== "reject"))
    return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  const note = str(body.note, 500);
  if (note.length < 3)
    return NextResponse.json(
      { ok: false, error: action === "paid" ? "Tranzaksiya izohini kiriting." : "Rad etish sababini kiriting." },
      { status: 400 },
    );
  try {
    const res = await rpc<{ payout?: unknown; error?: string }>("sh_admin_resolve_payout", {
      p_admin: guard.admin.id,
      p_id: id,
      p_action: action,
      p_note: note,
    });
    if (res.error === "not_found") return NextResponse.json({ ok: false, error: "So‘rov topilmadi." }, { status: 404 });
    if (res.error === "state") return NextResponse.json({ ok: false, error: "So‘rov allaqachon ko‘rib chiqilgan." }, { status: 409 });
    if (res.error) return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
    return NextResponse.json({ ok: true, payout: res.payout });
  } catch (e) {
    return adminRpcError(e);
  }
}
