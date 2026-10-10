import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Public: how many active registrations each seminar has (counts only, no personal data). */
export async function GET() {
  try {
    const occ = await rpc<Record<string, { registered: number; confirmed: number; attended: number }>>("sh_sem_occupancy", {});
    return NextResponse.json({ ok: true, occ: occ ?? {} });
  } catch {
    return NextResponse.json({ ok: true, occ: {} });
  }
}
