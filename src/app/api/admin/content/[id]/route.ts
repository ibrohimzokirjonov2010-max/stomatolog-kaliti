import { NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { rpc } from "@/lib/server/db";
import { readJson, str, UUID_RE } from "@/lib/server/user";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request, ["admin", "moderator"]);
  if (guard.error) return guard.error;
  const { id } = await params;
  const action = str((await readJson(request)).action, 10);
  if (!UUID_RE.test(id) || !["hide", "unhide", "delete", "dismiss"].includes(action))
    return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  try {
    const res = await rpc<{ error?: string }>("sh_admin_moderate_post", { p_admin: guard.admin.id, p_post: id, p_action: action });
    if (res.error) return NextResponse.json({ ok: false, error: "Post topilmadi." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return adminRpcError(e);
  }
}
