import { NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { readJson, requireUser } from "@/lib/server/user";
import { getSessionUserId } from "@/lib/server/session";

export const dynamic = "force-dynamic";

const KINDS = { patients: "patient", appointments: "appointment" } as const;

function kindOf(value: string) {
  return KINDS[value as keyof typeof KINDS];
}

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind: raw } = await params;
  const kind = kindOf(raw);
  if (!kind) return NextResponse.json({ ok: false, error: "Topilmadi." }, { status: 404 });
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: true, items: [] });
  try {
    const items = await rpc<unknown[]>("sh_crm_list", { p_user: userId, p_kind: kind });
    return NextResponse.json({ ok: true, items: Array.isArray(items) ? items : [] });
  } catch (error) {
    return dbErrorJson(error, "Klinika ma’lumotlarini yuklab bo‘lmadi.");
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind: raw } = await params;
  const kind = kindOf(raw);
  if (!kind) return NextResponse.json({ ok: false, error: "Topilmadi." }, { status: 404 });
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const items = Array.isArray(body.items) ? body.items.slice(0, 400) : null;
  if (!items) return NextResponse.json({ ok: false, error: "Ro‘yxat yuborilmadi." }, { status: 400 });
  try {
    const saved = await rpc<unknown[] | { error: string }>("sh_crm_replace", {
      p_user: guard.userId,
      p_kind: kind,
      p_items: items,
    });
    if (saved && typeof saved === "object" && !Array.isArray(saved) && "error" in saved) {
      return NextResponse.json({ ok: false, error: "Saqlab bo‘lmadi." }, { status: 400 });
    }
    return NextResponse.json({ ok: true, items: saved });
  } catch (error) {
    return dbErrorJson(error, "Saqlab bo‘lmadi.");
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind: raw } = await params;
  const kind = kindOf(raw);
  if (!kind) return NextResponse.json({ ok: false, error: "Topilmadi." }, { status: 404 });
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const item = body.item;
  if (!item || typeof item !== "object") return NextResponse.json({ ok: false, error: "Yozuv yuborilmadi." }, { status: 400 });
  try {
    const saved = await rpc<Record<string, unknown>>("sh_crm_upsert", {
      p_user: guard.userId,
      p_kind: kind,
      p_item: item,
    });
    if (saved && typeof saved.error === "string") return NextResponse.json({ ok: false, error: "Saqlab bo‘lmadi." }, { status: 400 });
    return NextResponse.json({ ok: true, item: saved });
  } catch (error) {
    return dbErrorJson(error, "Saqlab bo‘lmadi.");
  }
}
