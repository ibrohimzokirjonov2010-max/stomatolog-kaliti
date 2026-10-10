import { after, NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { rpc } from "@/lib/server/db";
import { readJson, str } from "@/lib/server/user";
import { buildCourierTrack } from "@/lib/server/courier";
import { flushTelegramOutbox } from "@/lib/server/telegram-notify";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request, ["admin", "finance"]);
  if (guard.error) return guard.error;
  const { id } = await params;
  const body = await readJson(request);
  if (body.action === "courier") {
    if (!/^SK-\d{1,12}$/.test(id)) return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
    const built = buildCourierTrack(body.track);
    if ("error" in built) return NextResponse.json({ ok: false, error: built.error }, { status: 400 });
    try {
      const res = await rpc<{ order?: unknown; error?: string }>("sh_admin_order_courier", { p_admin: guard.admin.id, p_order: id, p_track: built.track });
      if (res.error) return NextResponse.json({ ok: false, error: res.error === "refunded" ? "Buyurtma bekor qilingan." : "Buyurtma topilmadi." }, { status: 400 });
      after(() => flushTelegramOutbox());
      return NextResponse.json({ ok: true, order: res.order });
    } catch (e) {
      return adminRpcError(e);
    }
  }
  const resolution = str(body.resolution, 10);
  if (!/^SK-\d{1,12}$/.test(id) || (resolution !== "release" && resolution !== "refund"))
    return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  try {
    const res = await rpc<{ order?: unknown; error?: string }>("sh_admin_resolve_order", {
      p_admin: guard.admin.id,
      p_order: id,
      p_resolution: resolution,
      p_note: str(body.note, 500),
    });
    if (res.error) return NextResponse.json({ ok: false, error: "Buyurtma holati bu amalga mos emas." }, { status: 400 });
    after(() => flushTelegramOutbox());
    return NextResponse.json({ ok: true, order: res.order });
  } catch (e) {
    return adminRpcError(e);
  }
}
