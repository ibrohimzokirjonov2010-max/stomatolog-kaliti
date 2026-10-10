import { NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { rpc } from "@/lib/server/db";
import { readJson, str, UUID_RE } from "@/lib/server/user";

const ERRORS: Record<string, string> = {
  already: "Ariza allaqachon ko‘rib chiqilgan.",
  reason: "Rad etish sababini yozing.",
  not_found: "Ariza topilmadi.",
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request, ["admin", "moderator"]);
  if (guard.error) return guard.error;
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "Topilmadi." }, { status: 404 });
  const body = await readJson(request);
  try {
    const res = await rpc<{ ok?: boolean; error?: string }>("sh_admin_review_application", {
      p_admin: guard.admin.id,
      p_app: id,
      p_approve: body.approve === true,
      p_reason: str(body.reason, 500),
    });
    if (res.error) return NextResponse.json({ ok: false, error: ERRORS[res.error] ?? "Bajarib bo‘lmadi." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return adminRpcError(e);
  }
}
