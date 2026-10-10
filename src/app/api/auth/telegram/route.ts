import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sessionPing } from "@/lib/server/admin";
import { upsertSocialProfile } from "@/lib/server/profile";
import { sessionJson } from "@/lib/server/otp";

type TelegramLoginPayload = {
  id?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  username?: unknown;
  photo_url?: unknown;
  auth_date?: unknown;
  hash?: unknown;
};

function isString(value: unknown): value is string {
  return typeof value === "string";
}

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ ok: false, error: "Telegram sozlanmagan." }, { status: 500 });
  }

  let payload: TelegramLoginPayload;
  try {
    payload = (await request.json()) as TelegramLoginPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  }

  const id = typeof payload.id === "number" || typeof payload.id === "string"
    ? String(payload.id)
    : "";
  const authDate = typeof payload.auth_date === "number" || typeof payload.auth_date === "string"
    ? Number(payload.auth_date)
    : NaN;
  const telegramId = Number(id);
  const firstName = isString(payload.first_name) ? payload.first_name.trim() : "";
  const receivedHash = isString(payload.hash) ? payload.hash.toLowerCase() : "";

  if (
    !Number.isSafeInteger(telegramId) ||
    !firstName ||
    !Number.isSafeInteger(authDate) ||
    !/^[a-f0-9]{64}$/.test(receivedHash)
  ) {
    return NextResponse.json({ ok: false, error: "Telegram ma’lumoti yaroqsiz." }, { status: 401 });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 60 * 60 * 24) {
    return NextResponse.json({ ok: false, error: "Telegram tasdiqlash muddati tugagan." }, { status: 401 });
  }

  const dataCheckString = Object.entries(payload)
    .filter(([key, value]) => key !== "hash" && value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${String(value)}`)
    .sort()
    .join("\n");
  const secretKey = createHash("sha256").update(botToken).digest();
  const expectedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");
  const receivedHashBuffer = Buffer.from(receivedHash, "hex");
  const expectedHashBuffer = Buffer.from(expectedHash, "hex");

  if (
    receivedHashBuffer.length !== expectedHashBuffer.length ||
    !timingSafeEqual(receivedHashBuffer, expectedHashBuffer)
  ) {
    return NextResponse.json({ ok: false, error: "Telegram tasdiqlanmadi." }, { status: 401 });
  }

  const user = {
    id: telegramId,
    first_name: firstName,
    ...(isString(payload.last_name) ? { last_name: payload.last_name } : {}),
    ...(isString(payload.username) ? { username: payload.username } : {}),
    ...(isString(payload.photo_url) ? { photo_url: payload.photo_url } : {}),
  };
  try {
    const profile = await upsertSocialProfile({
      provider: "telegram",
      uid: String(telegramId),
      fullName: [firstName, user.last_name].filter(Boolean).join(" ") || user.username || "Telegram",
      telegramUsername: user.username,
      avatarUrl: user.photo_url,
    });
    if (profile.blocked) {
      return NextResponse.json({ ok: false, error: "Akkauntingiz bloklangan." }, { status: 403 });
    }
    const fresh = (await sessionPing(profile.id, request)) ?? profile;
    return sessionJson(fresh, request, { user });
  } catch {
    return NextResponse.json({ ok: false, error: "Profilni yaratib bo‘lmadi." }, { status: 502 });
  }
}
