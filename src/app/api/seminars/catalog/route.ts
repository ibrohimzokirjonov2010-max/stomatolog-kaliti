import { NextResponse } from "next/server";
import { readCache, rpc } from "@/lib/server/db";
import type { SeminarRow } from "@/lib/seminar-remote";

export const dynamic = "force-dynamic";

/** Public: organizer-created seminars that an admin has published (or the organizer closed). */
export async function GET() {
  try {
    const seminars = await rpc<SeminarRow[]>("sh_sem_catalog", {});
    return NextResponse.json({ ok: true, seminars: seminars ?? [] }, { headers: readCache(false) });
  } catch {
    return NextResponse.json({ ok: true, seminars: [] }, { headers: readCache(true) });
  }
}
