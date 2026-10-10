import { NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { rpc } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;
  const status = new URL(request.url).searchParams.get("status");
  try {
    const data = await rpc("sh_admin_applications", {
      p_admin: guard.admin.id,
      p_status: status === "approved" || status === "rejected" ? status : "pending",
    });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return adminRpcError(e);
  }
}
