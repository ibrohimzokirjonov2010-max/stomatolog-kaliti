import { after, NextResponse } from "next/server";
import { readJson, requireUser, str } from "@/lib/server/user";
import { rpc, seminarDbError, seminarTitle, type ServerReg } from "@/lib/server/seminars";
import { flushTelegramOutbox, telegramNotifyReady } from "@/lib/server/telegram-notify";

export const dynamic = "force-dynamic";

/** Organizer: mark the ticket owner as "kirdi" by ticket code. */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const code = str(body.code, 40).toUpperCase();
  if (!/^SK-[0-9A-F]{10}$/.test(code)) return NextResponse.json({ ok: true, result: "notfound" });
  try {
    // title is only used for the notification text → looked up from the registration's seminar after the check
    const first = await rpc<{ result: string; reg?: ServerReg }>("sh_sem_checkin", { p_user: guard.userId, p_code: code, p_title: "" });
    if (first.result === "ok" && first.reg && telegramNotifyReady()) after(() => flushTelegramOutbox(10).catch(() => undefined));
    return NextResponse.json({ ok: true, result: first.result, reg: first.reg ? { ...first.reg, seminarTitle: await seminarTitle(first.reg.seminarId) } : undefined });
  } catch (e) {
    return seminarDbError(e);
  }
}
