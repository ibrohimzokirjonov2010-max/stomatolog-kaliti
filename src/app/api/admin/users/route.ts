import { NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { rpc } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;
  const sp = new URL(request.url).searchParams;
  try {
    const data = await rpc("sh_admin_users", {
      p_admin: guard.admin.id,
      p_query: (sp.get("q") ?? "").slice(0, 80),
      p_filter: sp.get("filter") ?? "all",
      p_city: (sp.get("city") ?? "").slice(0, 60),
      p_limit: Math.min(Number(sp.get("limit")) || 50, 200),
      p_offset: Math.max(Number(sp.get("offset")) || 0, 0),
    });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return adminRpcError(e);
  }
}
