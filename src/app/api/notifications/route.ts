import { NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { readJson, requireUser } from "@/lib/server/user";

export const dynamic = "force-dynamic";

type ListResult = { unread: number; items: unknown[] };

/** My in-app notifications (newest first) + unread count. Anonymous → empty list. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, auth: false, unread: 0, items: [] });
  try {
    const res = await rpc<ListResult>("sh_notifs_list", { p_user: session.uid, p_limit: 40 });
    return NextResponse.json({ ok: true, auth: true, unread: res.unread, items: res.items });
  } catch (e) {
    return dbErrorJson(e, "Bildirishnomalarni yuklab bo‘lmadi.");
  }
}

/** Mark read: { ids: number[] } or { all: true }. State lives in the database (not per device). */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter((n) => Number.isSafeInteger(n) && n > 0).slice(0, 200) : null;
  if (!ids?.length && body.all !== true) return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  try {
    const res = await rpc<{ updated: number; unread: number }>("sh_notifs_read", { p_user: guard.userId, p_ids: body.all === true ? null : ids });
    return NextResponse.json({ ok: true, ...res });
  } catch (e) {
    return dbErrorJson(e, "Bajarib bo‘lmadi.");
  }
}
