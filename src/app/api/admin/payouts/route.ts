import { NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { rpc } from "@/lib/server/db";

export const dynamic = "force-dynamic";

const FILTERS = new Set(["all", "pending", "paid", "rejected"]);

export async function GET(request: Request) {
  const guard = await requireAdmin(request, ["admin", "finance"]);
  if (guard.error) return guard.error;
  const f = new URL(request.url).searchParams.get("filter") ?? "all";
  try {
    const data = await rpc("sh_admin_payouts", { p_admin: guard.admin.id, p_filter: FILTERS.has(f) ? f : "all" });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return adminRpcError(e);
  }
}
