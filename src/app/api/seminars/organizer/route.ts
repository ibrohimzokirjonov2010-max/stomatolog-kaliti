import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { rpc, seminarDbError, seminarTitle, type ServerReg } from "@/lib/server/seminars";

export const dynamic = "force-dynamic";

/** Organizer cabinet data: seminars I manage (admins: all with registrations) + their registrants. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, auth: false, items: [] });
  try {
    const res = await rpc<{ admin: boolean; items: { seminarId: string; title?: string | null; regs: ServerReg[] }[] }>("sh_sem_organizer", { p_user: session.uid });
    const items = await Promise.all((res?.items ?? []).map(async (i) => ({ ...i, title: i.title ?? (await seminarTitle(i.seminarId)) })));
    return NextResponse.json({ ok: true, auth: true, admin: Boolean(res?.admin), items });
  } catch (e) {
    return seminarDbError(e);
  }
}
