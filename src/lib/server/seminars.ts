import "server-only";
import { NextResponse } from "next/server";
import { DbError, rpc } from "@/lib/server/db";
import { getSeminar, isSeminarUpcoming } from "@/data/seminars";
import { rowToSeminar, type SeminarRow } from "@/lib/seminar-remote";

export type ServerReg = {
  id: string;
  seminarId: string;
  name: string;
  phone: string;
  telegram: string | null;
  clinic: string | null;
  status: "registered" | "confirmed" | "attended" | "cancelled";
  paymentStatus: "free" | "awaiting" | "paid";
  price: number;
  ticketCode: string;
  createdAt: string;
  confirmedAt: string | null;
  attendedAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
};

/** Published/closed DB seminar (organizer-created), or null. `viewer` additionally lets owners/admins see pending ones. */
export async function getRemoteSeminarRow(id: string, viewer?: string | null): Promise<SeminarRow | null> {
  if (!/^[a-z0-9-]{3,40}$/.test(id)) return null;
  try {
    return (await rpc<SeminarRow | null>("sh_sem_get_one", { p_id: id, p_user: viewer ?? null })) ?? null;
  } catch (e) {
    // Only swallow DB failures — Next's dynamic-rendering bail-out errors must propagate.
    if (e instanceof DbError) return null;
    throw e;
  }
}

export async function seminarTitle(id: string) {
  const s = getSeminar(id);
  if (s) return s.title;
  return (await getRemoteSeminarRow(id))?.title ?? id;
}

/** Free seats / price / closed flag come from the server-side catalog or DB row, never from the client. */
export async function seminarTerms(id: string) {
  const s = getSeminar(id);
  if (s) return { title: s.title, free: Math.max(0, s.seatsTotal - s.seatsTaken), price: s.price, closed: !isSeminarUpcoming(s) };
  const row = await getRemoteSeminarRow(id);
  if (!row) return null;
  const d = rowToSeminar(row);
  return { title: d.title, free: d.seatsTotal, price: d.price, closed: row.status !== "published" || !isSeminarUpcoming(d) };
}

const REASONS: Record<string, string> = {
  "Allaqachon yozilgansiz.": "duplicate",
  "Joy qolmadi.": "full",
  "Bu seminar o‘tib ketgan — yozilish yopiq.": "closed",
  "Ism va telefon majburiy (kamida 9 raqam).": "invalid",
  "Topilmadi.": "notfound",
};

export function seminarDbError(e: unknown) {
  if (e instanceof DbError) {
    return NextResponse.json({ ok: false, reason: REASONS[e.message] ?? "error", error: e.message }, { status: e.status === 502 ? 502 : e.status === 403 ? 403 : 400 });
  }
  return NextResponse.json({ ok: false, reason: "error", error: "Amalni bajarib bo‘lmadi." }, { status: 502 });
}

export { rpc };
