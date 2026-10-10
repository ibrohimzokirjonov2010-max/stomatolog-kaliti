import { after, NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { readJson, requireUser, str, UUID_RE } from "@/lib/server/user";
import { rpc, seminarDbError, seminarTitle, type ServerReg } from "@/lib/server/seminars";
import { flushTelegramOutbox, telegramNotifyReady } from "@/lib/server/telegram-notify";

export const dynamic = "force-dynamic";

/** A ticket is visible to its owner only (anyone else gets the same "not found"). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, reason: "auth", error: "Avval tizimga kiring." }, { status: 401 });
  if (!UUID_RE.test(id)) return NextResponse.json({ ok: false, reason: "notfound", error: "Chipta topilmadi." }, { status: 404 });
  try {
    const registration = await rpc<ServerReg | null>("sh_sem_get", { p_user: session.uid, p_id: id });
    if (!registration) return NextResponse.json({ ok: false, reason: "notfound", error: "Chipta topilmadi." }, { status: 404 });
    return NextResponse.json({ ok: true, registration });
  } catch (e) {
    return seminarDbError(e);
  }
}

/** Owner: { action: "confirm" | "cancel" }. Organizer: { action: "paid" } (offline payment received). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ ok: false, reason: "notfound", error: "Topilmadi." }, { status: 404 });
  const body = await readJson(request);
  const action = str(body.action, 10);
  if (action !== "confirm" && action !== "cancel" && action !== "paid") return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  try {
    let registration: ServerReg;
    if (action === "paid") {
      const seminarId = str(body.seminarId, 80);
      registration = await rpc<ServerReg>("sh_sem_mark_paid", { p_user: guard.userId, p_id: id, p_title: await seminarTitle(seminarId) });
    } else {
      registration = await rpc<ServerReg>("sh_sem_act", { p_user: guard.userId, p_id: id, p_action: action, p_title: await seminarTitle(str(body.seminarId, 80)) });
    }
    if (telegramNotifyReady()) after(() => flushTelegramOutbox(10).catch(() => undefined));
    return NextResponse.json({ ok: true, registration });
  } catch (e) {
    return seminarDbError(e);
  }
}
