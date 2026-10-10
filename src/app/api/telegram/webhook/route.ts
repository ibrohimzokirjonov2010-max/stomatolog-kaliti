import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { tgCall, webhookSecret } from "@/lib/server/telegram-notify";

export const dynamic = "force-dynamic";

type Update = { message?: { text?: string; chat?: { id?: number; type?: string }; from?: { first_name?: string } } };

/** Telegram → us. `/start <token>` links the chat to the profile that created the token. */
export async function POST(request: Request) {
  const secret = webhookSecret();
  if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const update = (await request.json().catch(() => null)) as Update | null;
  const msg = update?.message;
  const chat = msg?.chat;
  if (!msg?.text || !chat?.id || chat.type !== "private") return NextResponse.json({ ok: true });
  const m = msg.text.trim().match(/^\/start(?:@\w+)?(?:\s+([a-f0-9]{16,64}))?$/i);
  if (!m) return NextResponse.json({ ok: true });
  const token = m[1];
  let reply = "Salom! Bildirishnomalarni ulash uchun saytdagi profil → “Telegram xabarnomalar” bo‘limidan “Telegramni ulash” tugmasini bosing.";
  if (token) {
    try {
      const res = await rpc<{ ok: boolean; name?: string }>("sh_tg_link", { p_token: token, p_chat: chat.id });
      reply = res.ok
        ? `✅ Ulandi${res.name ? `, ${res.name}` : ""}! Endi buyurtma holatlari shu yerga ham keladi.`
        : "Havola eskirgan. Saytdan “Telegramni ulash” tugmasini qayta bosing.";
    } catch {
      reply = "Hozir ulab bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.";
    }
  }
  await tgCall("sendMessage", { chat_id: chat.id, text: reply });
  return NextResponse.json({ ok: true });
}
