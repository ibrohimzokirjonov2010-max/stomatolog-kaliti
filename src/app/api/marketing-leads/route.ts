import { NextResponse } from "next/server";
import { DbError, rpc } from "@/lib/server/db";
import { getSessionUserId, sameOrigin } from "@/lib/server/session";
import { readJson, str } from "@/lib/server/user";

export const dynamic = "force-dynamic";

/** Store a marketing lead. Guests are allowed. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, error: "Ruxsat yo‘q." }, { status: 403 });
  const body = await readJson(request);
  if (str(body.website, 80)) return NextResponse.json({ ok: true });
  const userId = await getSessionUserId();
  const needs = Array.isArray(body.needs) ? body.needs.map((item) => str(item, 40)).filter(Boolean).slice(0, 12) : [];
  try {
    const res = await rpc<{ ok?: boolean; error?: string; id?: string }>("sh_marketing_lead", {
      p_user: userId,
      p_data: {
        name: str(body.name, 80),
        clinic: str(body.clinic, 120),
        contact: str(body.contact, 80),
        notes: str(body.notes, 1000),
        needs,
      },
    });
    if (res.error === "limit") return NextResponse.json({ ok: false, error: "Juda ko‘p so‘rov. Birozdan keyin yuboring." }, { status: 429 });
    if (res.error === "needs") return NextResponse.json({ ok: false, error: "Kerakli xizmatlardan kamida bittasini belgilang." }, { status: 400 });
    if (res.error) return NextResponse.json({ ok: false, error: "Ism, klinika va telefon yoki Telegramni yozing." }, { status: 400 });
    return NextResponse.json({ ok: true, id: res.id });
  } catch (error) {
    if (error instanceof DbError) return NextResponse.json({ ok: false, error: "So‘rovni saqlab bo‘lmadi." }, { status: 503 });
    return NextResponse.json({ ok: false, error: "So‘rovni saqlab bo‘lmadi." }, { status: 503 });
  }
}
