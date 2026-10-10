import { NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { requireUser } from "@/lib/server/user";
import { botUsername, ensureTelegramWebhook, telegramNotifyReady } from "@/lib/server/telegram-notify";

export const dynamic = "force-dynamic";

/** Link status for the profile page. `configured` is false until the bot env vars exist ("Tez orada"). */
export async function GET() {
  const configured = telegramNotifyReady();
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, configured, linked: false });
  try {
    const st = await rpc<{ linked: boolean; linkedAt: string | null }>("sh_tg_status", { p_user: session.uid });
    return NextResponse.json({ ok: true, configured, linked: st.linked, linkedAt: st.linkedAt, bot: configured ? botUsername() : undefined });
  } catch (e) {
    return dbErrorJson(e, "Holatni yuklab bo‘lmadi.");
  }
}

/** Creates a one-time link token (15 min) and returns the t.me deep link. */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  if (!telegramNotifyReady()) return NextResponse.json({ ok: false, reason: "not_configured", error: "Telegram bot hali sozlanmagan." }, { status: 503 });
  const hook = await ensureTelegramWebhook().catch(() => "skipped" as const);
  if (hook === "foreign") return NextResponse.json({ ok: false, reason: "webhook_busy", error: "Bot boshqa xizmatga ulangan. Administrator bilan bog‘laning." }, { status: 503 });
  try {
    const { token } = await rpc<{ token: string }>("sh_tg_link_token", { p_user: guard.userId });
    return NextResponse.json({ ok: true, url: `https://t.me/${botUsername()}?start=${token}` });
  } catch (e) {
    return dbErrorJson(e, "Havola yaratib bo‘lmadi.");
  }
}

export async function DELETE(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  try {
    await rpc("sh_tg_unlink", { p_user: guard.userId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbErrorJson(e, "Bajarib bo‘lmadi.");
  }
}
