import { NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { rpc } from "@/lib/server/db";
import { readJson, str, UUID_RE } from "@/lib/server/user";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "Topilmadi." }, { status: 404 });
  try {
    const data = await rpc("sh_admin_store_detail", { p_admin: guard.admin.id, p_store: id });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return adminRpcError(e);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await readJson(request);
  const action = str(body.action, 20);
  const guard = await requireAdmin(request, action === "commission" ? ["admin", "finance"] : ["admin", "moderator"]);
  if (guard.error) return guard.error;
  const { id } = await params;
  if (!UUID_RE.test(id) || !["suspend", "activate", "commission"].includes(action))
    return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  const rate = Number(body.value);
  if (action === "commission" && (!Number.isFinite(rate) || rate < 0 || rate > 50))
    return NextResponse.json({ ok: false, error: "Komissiya 0–50% oralig‘ida bo‘lishi kerak." }, { status: 400 });
  const value = action === "commission" ? String(Math.round(rate * 100) / 100) : str(body.value, 300);
  try {
    const res = await rpc<{ ok?: boolean; error?: string }>("sh_admin_store_action", {
      p_admin: guard.admin.id,
      p_store: id,
      p_action: action,
      p_value: value,
    });
    if (res.error) return NextResponse.json({ ok: false, error: "Bajarib bo‘lmadi." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return adminRpcError(e);
  }
}
