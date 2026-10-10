import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { readJson, requireUser, str } from "@/lib/server/user";
import { rpc, seminarDbError } from "@/lib/server/seminars";

export const dynamic = "force-dynamic";

type Me = { admin: boolean; canCreate: boolean; application: { status: "pending" | "approved" | "rejected"; orgName: string; phone: string; city: string | null; bio: string | null; telegram: string | null; rejectReason: string | null; createdAt: string } | null };

/** My organizer status: admin / approved organizer / pending or rejected application / none. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, auth: false });
  try {
    const me = await rpc<Me>("sh_org_me", { p_user: session.uid });
    return NextResponse.json({ ok: true, auth: true, ...me });
  } catch (e) {
    return seminarDbError(e);
  }
}

/** Apply (or re-apply after a rejection) to become a seminar organizer; an admin approves. */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const errors: Record<string, string> = {};
  const orgName = str(body.orgName, 120);
  const phone = str(body.phone, 40);
  const digits = phone.replace(/\D/g, "");
  if (orgName.length < 2) errors.orgName = "Tashkilot yoki ismingizni kiriting.";
  if (digits.length < 9) errors.phone = "Telefon raqamini to‘liq kiriting (kamida 9 raqam).";
  if (str(body.bio, 1000).length > 0 && str(body.bio, 1000).length < 10) errors.bio = "Qisqa tavsif kamida 10 ta belgi bo‘lsin yoki bo‘sh qoldiring.";
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors, error: "Maydonlarni tekshiring." }, { status: 400 });
  try {
    await rpc("sh_org_apply", { p_user: guard.userId, p_org: orgName, p_phone: phone, p_city: str(body.city, 80), p_bio: str(body.bio, 1000), p_telegram: str(body.telegram, 80) });
    const me = await rpc<Me>("sh_org_me", { p_user: guard.userId });
    return NextResponse.json({ ok: true, ...me });
  } catch (e) {
    return seminarDbError(e);
  }
}
