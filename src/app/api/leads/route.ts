import { NextResponse } from "next/server";
import { DbError, rpc } from "@/lib/server/db";
import { getSessionUserId, sameOrigin } from "@/lib/server/session";
import { readJson, str } from "@/lib/server/user";

export const dynamic = "force-dynamic";

const ROLES = new Set(["stomatolog", "klinika_egasi", "talaba", "tish_texnigi", "sotuvchi"]);

/** Homepage lead: name, +998 phone, role. Guests are allowed. `website` is a honeypot. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, error: "Ruxsat yo‘q." }, { status: 403 });
  const body = await readJson(request);
  if (str(body.website, 80)) return NextResponse.json({ ok: true, ignored: true });

  const name = str(body.name, 80);
  const phone = str(body.phone, 40);
  const role = str(body.role, 40);
  const digits = phone.replace(/\D/g, "");
  const national = digits.startsWith("998") ? digits.slice(3) : digits;
  if (name.length < 2 || national.length !== 9 || !ROLES.has(role)) {
    return NextResponse.json({ ok: false, error: "Ism, telefon (+998) va lavozimni to‘ldiring." }, { status: 400 });
  }

  let userId: string | null = null;
  try {
    userId = await getSessionUserId();
  } catch {
    userId = null;
  }

  try {
    const res = await rpc<{ ok?: boolean; error?: string; id?: string; duplicate?: boolean }>("sh_lead_create", {
      p_user: userId,
      p_data: { name, phone: national, role, source: "home" },
    });
    if (res.error === "limit") {
      return NextResponse.json({ ok: false, error: "Juda ko‘p so‘rov. Birozdan keyin yuboring." }, { status: 429 });
    }
    if (res.error || !res.ok) {
      return NextResponse.json({ ok: false, error: "Ism, telefon (+998) va lavozimni to‘ldiring." }, { status: 400 });
    }
    return NextResponse.json({ ok: true, id: res.id, duplicate: Boolean(res.duplicate) });
  } catch (error) {
    if (error instanceof DbError) return NextResponse.json({ ok: false, error: "So‘rovni saqlab bo‘lmadi." }, { status: 503 });
    return NextResponse.json({ ok: false, error: "So‘rovni saqlab bo‘lmadi." }, { status: 503 });
  }
}
