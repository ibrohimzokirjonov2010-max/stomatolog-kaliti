import { NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { rpc } from "@/lib/server/db";
import { readJson, str, UUID_RE } from "@/lib/server/user";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  self: "O‘zingizga bu amalni qo‘llab bo‘lmaydi.",
  owner: "Egasi (owner) akkauntini o‘zgartirib bo‘lmaydi.",
  forbidden: "Bu amal uchun ruxsatingiz yo‘q.",
  not_found: "Foydalanuvchi topilmadi.",
  invalid: "Noto‘g‘ri rol.",
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "Topilmadi." }, { status: 404 });
  try {
    const data = await rpc("sh_admin_user_detail", { p_admin: guard.admin.id, p_user: id });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return adminRpcError(e);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await readJson(request);
  const action = str(body.action, 20);
  const guard = await requireAdmin(request, action === "role" ? [] : ["admin", "moderator"]);
  if (guard.error) return guard.error;
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "Topilmadi." }, { status: 404 });
  try {
    let res: { ok?: boolean; error?: string };
    if (action === "block" || action === "unblock") {
      res = await rpc("sh_admin_set_block", {
        p_admin: guard.admin.id,
        p_user: id,
        p_blocked: action === "block",
        p_reason: str(body.reason, 300),
      });
    } else if (action === "role") {
      res = await rpc("sh_admin_set_role", { p_admin: guard.admin.id, p_user: id, p_role: str(body.role, 20) });
    } else {
      return NextResponse.json({ ok: false, error: "Noma’lum amal." }, { status: 400 });
    }
    if (res.error) return NextResponse.json({ ok: false, error: ERRORS[res.error] ?? "Bajarib bo‘lmadi." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return adminRpcError(e);
  }
}
