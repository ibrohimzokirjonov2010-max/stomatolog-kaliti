import { NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { rpc } from "@/lib/server/db";
import { UUID_RE } from "@/lib/server/user";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request, ["admin", "finance"]);
  if (guard.error) return guard.error;
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "Topilmadi." }, { status: 404 });
  try {
    const res = await rpc<{ error?: string }>("sh_admin_delete_ad", { p_admin: guard.admin.id, p_ad: id });
    if (res.error) return NextResponse.json({ ok: false, error: "Topilmadi." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return adminRpcError(e);
  }
}
