import { NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { UUID_RE, readJson, requireUser, str } from "@/lib/server/user";

export const dynamic = "force-dynamic";

/** Seller writes / edits the public reply to a review of their own store. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const { id } = await params;
  const text = str((await readJson(request)).reply, 1500);
  if (!UUID_RE.test(id) || !text) return NextResponse.json({ ok: false, error: "Javob matnini kiriting." }, { status: 400 });
  try {
    const res = await rpc<{ review?: unknown; error?: string }>("sh_review_reply", { p_user: guard.userId, p_review: id, p_text: text });
    if (res.error) return NextResponse.json({ ok: false, error: "Sharh topilmadi." }, { status: 404 });
    return NextResponse.json({ ok: true, review: res.review });
  } catch (e) {
    return dbErrorJson(e, "Javobni saqlab bo‘lmadi.");
  }
}
