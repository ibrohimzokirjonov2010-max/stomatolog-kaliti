import { after, NextResponse } from "next/server";
import { readJson, requireUser, str } from "@/lib/server/user";
import { rpc, seminarDbError, seminarTerms, type ServerReg } from "@/lib/server/seminars";
import { flushTelegramOutbox, telegramNotifyReady } from "@/lib/server/telegram-notify";

export const dynamic = "force-dynamic";

/** Register the signed-in doctor for a seminar → ticket + notifications (doctor and organizer). No payment is taken. */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const seminarId = str(body.seminarId, 80);
  const terms = await seminarTerms(seminarId);
  if (!terms) return NextResponse.json({ ok: false, reason: "notfound", error: "Seminar topilmadi." }, { status: 404 });
  try {
    const registration = await rpc<ServerReg>("sh_sem_register", {
      p_user: guard.userId,
      p_seminar: seminarId,
      p_title: terms.title,
      p_name: str(body.name, 120),
      p_phone: str(body.phone, 40),
      p_telegram: str(body.telegram, 80),
      p_clinic: str(body.clinic, 120),
      p_free: terms.free,
      p_price: terms.price,
      p_closed: terms.closed,
    });
    if (telegramNotifyReady()) after(() => flushTelegramOutbox(10).catch(() => undefined));
    return NextResponse.json({ ok: true, registration });
  } catch (e) {
    return seminarDbError(e);
  }
}
