import { NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { rpc } from "@/lib/server/db";
import { readJson, str, UUID_RE } from "@/lib/server/user";

export const dynamic = "force-dynamic";

/** Admin: moderation queue for user-created listings (ustalar, laboratoriyalar, vakansiyalar, ortiqcha material). */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;
  try {
    const data = await rpc("sh_mod_list", { p_admin: guard.admin.id });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return adminRpcError(e);
  }
}

/** { kind, id, action: approve | reject | hide, reason? } */
export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const kind = str(body.kind, 20);
  const id = str(body.id, 60);
  const action = str(body.action, 10);
  const reason = str(body.reason, 300);
  if (!["master", "lab", "job", "surplus"].includes(kind) || !UUID_RE.test(id) || !["approve", "reject", "hide"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  }
  if (action !== "approve" && reason.length < 3) return NextResponse.json({ ok: false, error: "Sababini yozing." }, { status: 400 });
  try {
    await rpc("sh_mod_review", { p_admin: guard.admin.id, p_kind: kind, p_id: id, p_action: action, p_reason: reason });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return adminRpcError(e);
  }
}
