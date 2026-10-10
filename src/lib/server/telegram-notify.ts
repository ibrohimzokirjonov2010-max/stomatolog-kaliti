import "server-only";
import { rpc } from "@/lib/server/db";

/**
 * Telegram delivery of in-app notifications. Everything here is optional: without TELEGRAM_BOT_TOKEN every
 * function is a silent no-op (never throws), so a missing bot never breaks an order flow.
 */
const API = "https://api.telegram.org";

export function botToken() {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
}

export function botUsername() {
  return (process.env.TELEGRAM_BOT_USERNAME?.trim() || process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim() || "").replace(/^@/, "");
}

export function webhookSecret() {
  return process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || "";
}

/** The bot can deliver notifications and be linked from the profile. */
export function telegramNotifyReady() {
  return Boolean(botToken() && botUsername() && webhookSecret());
}

export function siteOrigin() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  return "https://stomatolog-kaliti-lake.vercel.app";
}

type TgResult = { ok: boolean; error_code?: number; description?: string; result?: unknown };

export async function tgCall(method: string, payload: Record<string, unknown>): Promise<TgResult> {
  const token = botToken();
  if (!token) return { ok: false, description: "no_token" };
  try {
    const res = await fetch(`${API}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return (await res.json().catch(() => ({ ok: false }))) as TgResult;
  } catch {
    return { ok: false, description: "network" };
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type OutboxRow = { id: number; chat: number; title: string; body: string; link: string | null };

let flushing: Promise<number> | null = null;

/** Sends notifications of users who linked their Telegram. Returns how many were delivered. */
export function flushTelegramOutbox(limit = 25): Promise<number> {
  if (!botToken()) return Promise.resolve(0);
  if (flushing) return flushing;
  flushing = (async () => {
    let sent = 0;
    try {
      const rows = await rpc<OutboxRow[]>("sh_notif_outbox", { p_limit: limit });
      for (const r of rows ?? []) {
        const url = r.link ? `${siteOrigin()}${r.link}` : "";
        const text = `<b>${esc(r.title)}</b>\n${esc(r.body)}${url ? `\n\n${esc(url)}` : ""}`;
        const res = await tgCall("sendMessage", { chat_id: r.chat, text, parse_mode: "HTML", disable_web_page_preview: true });
        const blocked = !res.ok && (res.error_code === 403 || res.error_code === 400) && /blocked|deactivated|chat not found/i.test(res.description ?? "");
        await rpc("sh_notif_tg_done", { p_id: r.id, p_ok: res.ok, p_unlink: blocked }).catch(() => undefined);
        if (res.ok) sent += 1;
      }
    } catch (e) {
      console.error("[telegram-notify]", e instanceof Error ? e.message : e);
    }
    return sent;
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

/** Registers the webhook once, only when the bot has none yet (never overrides another integration's webhook). */
export async function ensureTelegramWebhook(): Promise<"set" | "ok" | "foreign" | "skipped"> {
  if (!telegramNotifyReady()) return "skipped";
  const want = `${siteOrigin()}/api/telegram/webhook`;
  const info = await tgCall("getWebhookInfo", {});
  const url = (info.result as { url?: string } | undefined)?.url ?? "";
  if (url === want) return "ok";
  if (url) return "foreign";
  const res = await tgCall("setWebhook", { url: want, secret_token: webhookSecret(), allowed_updates: ["message"], drop_pending_updates: false });
  return res.ok ? "set" : "skipped";
}
