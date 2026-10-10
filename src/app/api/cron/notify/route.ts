import { NextResponse } from "next/server";
import { botUsername, ensureTelegramWebhook, flushTelegramOutbox, telegramNotifyReady, tgCall } from "@/lib/server/telegram-notify";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Vercel cron (every minute): delivers pending Telegram notifications; silently does nothing without a bot token. */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!telegramNotifyReady()) return NextResponse.json({ ok: true, skipped: true });
  const webhook = await ensureTelegramWebhook().catch(() => "skipped" as const);
  const sent = await flushTelegramOutbox(50);
  const me = (await tgCall("getMe", {}).catch(() => null))?.result as { username?: string } | undefined;
  return NextResponse.json({ ok: true, sent, webhook, bot: me?.username ?? null, usernameMatches: me?.username?.toLowerCase() === botUsername().toLowerCase() });
}
