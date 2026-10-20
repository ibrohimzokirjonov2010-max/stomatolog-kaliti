import { NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { rpc } from "@/lib/server/db";
import { readJson, str, UUID_RE } from "@/lib/server/user";

export const dynamic = "force-dynamic";

/** Admin product list. Approve shows a product; hide takes it off the catalog. Nothing is deleted. */
export async function GET(request: Request) {
  const guard = await requireAdmin(request, ["admin", "moderator"]);
  if (guard.error) return guard.error;
  try {
    const data = await rpc("sh_admin_products", { p_admin: guard.admin.id });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return adminRpcError(e);
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin(request, ["admin", "moderator"]);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const id = str(body.id, 40);
  const action = str(body.action, 10);
  if (!UUID_RE.test(id) || (action !== "approve" && action !== "hide")) {
    return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  }
  try {
    const res = await rpc<{ ok?: boolean; error?: string }>("sh_admin_product_set", {
      p_admin: guard.admin.id,
      p_id: id,
      p_action: action,
    });
    if (res.error) return NextResponse.json({ ok: false, error: "Mahsulot topilmadi." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return adminRpcError(e);
  }
}
