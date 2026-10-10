import { NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { rpc } from "@/lib/server/db";
import { readJson, str } from "@/lib/server/user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;
  try {
    const data = await rpc("sh_admin_channels", { p_admin: guard.admin.id });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return adminRpcError(e);
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin(request, ["admin", "moderator", "finance"]);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const action = str(body.action, 20);
  const target = str(body.target, 40);
  const valid =
    ((action === "hide_channel" || action === "show_channel") && /^[0-9a-f-]{36}$/i.test(target)) ||
    (action === "cancel_bid" && /^\d{1,12}$/.test(target));
  if (!valid) return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  try {
    await rpc("sh_admin_channel_action", { p_admin: guard.admin.id, p_action: action, p_target: target });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return adminRpcError(e);
  }
}
