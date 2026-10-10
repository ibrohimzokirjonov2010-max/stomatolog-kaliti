import { NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { readJson, requireUser } from "@/lib/server/user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  try {
    const settings = await rpc<Record<string, unknown>>("sh_get_settings", { p_user: guard.userId });
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    return dbErrorJson(e, "Sozlamalarni yuklab bo‘lmadi.");
  }
}

const NOTIFY_KEYS = ["newOrders", "orderStatus", "messages", "reviews", "marketing"];

export async function PATCH(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const patch: Record<string, unknown> = {};
  if ("minOrder" in body) {
    const n = Math.floor(Number(body.minOrder));
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000_000) return NextResponse.json({ ok: false, error: "Summa noto‘g‘ri." }, { status: 400 });
    patch.minOrder = n;
  }
  if ("closed" in body) patch.closed = body.closed === true;
  if (body.notify && typeof body.notify === "object") {
    const n: Record<string, boolean> = {};
    for (const k of NOTIFY_KEYS) if (k in (body.notify as object)) n[k] = (body.notify as Record<string, unknown>)[k] === true;
    patch.notify = n;
  }
  try {
    const res = await rpc<Record<string, unknown>>("sh_save_settings", { p_user: guard.userId, p_patch: patch });
    if (res.error) return NextResponse.json({ ok: false, error: "Do‘kon topilmadi." }, { status: 404 });
    return NextResponse.json({ ok: true, settings: res });
  } catch (e) {
    return dbErrorJson(e, "Saqlab bo‘lmadi.");
  }
}
