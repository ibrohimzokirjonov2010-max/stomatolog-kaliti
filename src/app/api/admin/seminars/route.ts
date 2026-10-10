import { NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { rpc } from "@/lib/server/db";
import { readJson, str, UUID_RE } from "@/lib/server/user";

export const dynamic = "force-dynamic";

/** Admin: organizer applications + organizer-created seminars (pending first) + current organizer assignments. */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;
  try {
    const data = await rpc("sh_org_admin", { p_admin: guard.admin.id });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return adminRpcError(e);
  }
}

/** { action: "review_application", id, approve, reason? } | { action: "review_seminar", id, approve, reason? } */
export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const action = str(body.action, 24);
  const id = str(body.id, 60);
  const approve = body.approve === true;
  const reason = str(body.reason, 300);
  if (!approve && reason.length < 3) return NextResponse.json({ ok: false, error: "Rad etish sababini yozing." }, { status: 400 });
  try {
    if (action === "review_application" && UUID_RE.test(id)) {
      await rpc("sh_org_review", { p_admin: guard.admin.id, p_id: id, p_approve: approve, p_reason: reason });
    } else if (action === "review_seminar" && /^[a-z0-9-]{3,40}$/.test(id)) {
      await rpc("sh_sem_admin_review", { p_admin: guard.admin.id, p_id: id, p_approve: approve, p_reason: reason });
    } else {
      return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return adminRpcError(e);
  }
}
