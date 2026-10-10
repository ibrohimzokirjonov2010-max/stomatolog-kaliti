import { NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { rpc } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;
  const filter = new URL(request.url).searchParams.get("filter");
  try {
    const data = await rpc("sh_admin_content", {
      p_admin: guard.admin.id,
      p_filter: filter === "all" || filter === "hidden" ? filter : "reported",
    });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return adminRpcError(e);
  }
}
