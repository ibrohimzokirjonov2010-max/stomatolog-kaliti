import { NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { rpc } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireAdmin(request, ["admin", "moderator", "finance"]);
  if (guard.error) return guard.error;
  try {
    const data = await rpc("sh_admin_leads", { p_admin: guard.admin.id });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return adminRpcError(e);
  }
}
