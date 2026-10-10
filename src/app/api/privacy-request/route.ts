import { NextResponse } from "next/server";
import { DbError, rpc } from "@/lib/server/db";
import { getSession, sameOrigin } from "@/lib/server/session";
import { readJson, str } from "@/lib/server/user";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SCOPES = ["hisob", "malumot", "savol"];

/** Public (guests allowed): data deletion / data copy / privacy question. { name, phone?, email?, scope, message?, website(honeypot) } */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, error: "Ruxsat yo‘q." }, { status: 403 });
  const body = await readJson(request);
  if (str(body.website, 50)) return NextResponse.json({ ok: true }); // honeypot: bots only
  const session = await getSession();
  const scope = str(body.scope, 10);
  const name = str(body.name, 80);
  const phone = str(body.phone, 40);
  const email = str(body.email, 120);
  const message = str(body.message, 1000);
  const errors: Record<string, string> = {};
  if (!SCOPES.includes(scope)) errors.scope = "So‘rov turini tanlang.";
  if (name.length < 2 && !session) errors.name = "Ismingizni kiriting.";
  const digits = phone.replace(/\D/g, "");
  if (phone && digits.length < 9) errors.phone = "Telefon raqamini to‘liq kiriting (kamida 9 raqam).";
  if (email && !EMAIL_RE.test(email)) errors.email = "Email manzilini to‘g‘ri kiriting.";
  if (!session && !phone && !email) errors.phone = "Javob olish uchun telefon yoki email kiriting.";
  if (scope === "savol" && message.length < 5) errors.message = "Savolingizni yozing (kamida 5 belgi).";
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors, error: Object.values(errors)[0] }, { status: 400 });
  }
  try {
    await rpc("sh_privacy_create", { p_user: session?.uid ?? null, p_data: { name, phone, email, scope, message } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof DbError) return NextResponse.json({ ok: false, error: e.message }, { status: e.status === 403 ? 403 : e.status === 502 ? 502 : 400 });
    throw e;
  }
}
