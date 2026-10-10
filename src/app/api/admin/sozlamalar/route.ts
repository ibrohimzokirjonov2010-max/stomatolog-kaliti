import { NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { DbError, rpc } from "@/lib/server/db";
import { readJson, str, UUID_RE } from "@/lib/server/user";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function fail(e: unknown) {
  if (e instanceof DbError && e.status !== 403 && e.status !== 502) return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  return adminRpcError(e);
}

/** Admin: public contact details (used on /maxfiylik, /shartlar) + privacy / deletion requests queue. */
export async function GET(request: Request) {
  const guard = await requireAdmin(request, ["admin"]);
  if (guard.error) return guard.error;
  try {
    const [contact, requests] = await Promise.all([
      rpc("sh_site_contact_get", {}),
      rpc("sh_privacy_list", { p_admin: guard.admin.id }),
    ]);
    return NextResponse.json({ ok: true, data: { contact, requests } });
  } catch (e) {
    return fail(e);
  }
}

/** { action: "contact", email, phone, telegram } | { action: "status", id, status: jarayonda|bajarildi|rad, note } */
export async function POST(request: Request) {
  const guard = await requireAdmin(request, ["admin"]);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const action = str(body.action, 10);
  try {
    if (action === "contact") {
      const email = str(body.email, 120);
      const phone = str(body.phone, 40);
      const telegram = str(body.telegram, 80);
      const errors: Record<string, string> = {};
      if (email && !EMAIL_RE.test(email)) errors.email = "Email manzilini to‘g‘ri kiriting.";
      if (phone && phone.replace(/\D/g, "").length < 9) errors.phone = "Telefon raqamini to‘liq kiriting (kamida 9 raqam).";
      if (telegram && !/^(https?:\/\/t\.me\/|@)?[A-Za-z0-9_]{4,32}$/.test(telegram)) errors.telegram = "Telegram username noto‘g‘ri (masalan @nom).";
      if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors, error: Object.values(errors)[0] }, { status: 400 });
      const contact = await rpc("sh_site_contact_set", { p_admin: guard.admin.id, p_data: { email, phone, telegram } });
      return NextResponse.json({ ok: true, contact });
    }
    if (action === "status") {
      const id = str(body.id, 60);
      const status = str(body.status, 12);
      const note = str(body.note, 500);
      if (!UUID_RE.test(id) || !["jarayonda", "bajarildi", "rad"].includes(status)) return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
      if (status === "rad" && note.length < 3) return NextResponse.json({ ok: false, error: "Rad etish sababini yozing." }, { status: 400 });
      await rpc("sh_privacy_set", { p_admin: guard.admin.id, p_id: id, p_status: status, p_note: note });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  } catch (e) {
    return fail(e);
  }
}
