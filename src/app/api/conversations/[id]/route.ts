import { NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { UUID_RE, readJson, requireUser, str } from "@/lib/server/user";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Messages of one conversation (participants only). Marks the other side's messages as read. */
export async function GET(request: Request, { params }: Ctx) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  try {
    const res = await rpc<{ role?: string; messages?: unknown[]; error?: string }>("sh_conv_messages", { p_user: guard.userId, p_conv: id });
    if (res.error) return NextResponse.json({ ok: false, error: "Muloqot topilmadi." }, { status: 404 });
    return NextResponse.json({ ok: true, role: res.role, messages: res.messages });
  } catch (e) {
    return dbErrorJson(e, "Xabarlarni yuklab bo‘lmadi.");
  }
}

export async function POST(request: Request, { params }: Ctx) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const { id } = await params;
  const text = str((await readJson(request)).body, 2000);
  if (!UUID_RE.test(id) || !text) return NextResponse.json({ ok: false, error: "Xabar matnini kiriting." }, { status: 400 });
  try {
    const res = await rpc<{ ok?: boolean; error?: string }>("sh_conv_send", { p_user: guard.userId, p_conv: id, p_body: text });
    if (res.error) return NextResponse.json({ ok: false, error: "Muloqot topilmadi." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbErrorJson(e, "Xabarni yuborib bo‘lmadi.");
  }
}

/** Seller: archive / restore. */
export async function PATCH(request: Request, { params }: Ctx) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const { id } = await params;
  const body = await readJson(request);
  if (!UUID_RE.test(id) || typeof body.archived !== "boolean") return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  try {
    const res = await rpc<{ ok?: boolean; error?: string }>("sh_conv_archive", { p_user: guard.userId, p_conv: id, p_archived: body.archived });
    if (res.error) return NextResponse.json({ ok: false, error: "Muloqot topilmadi." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbErrorJson(e, "Bajarib bo‘lmadi.");
  }
}
