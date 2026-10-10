import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { rpc, seminarDbError, type ServerReg } from "@/lib/server/seminars";

export const dynamic = "force-dynamic";

/** My own registrations/tickets. Guests → { auth: false }. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, auth: false, items: [] });
  try {
    const items = await rpc<ServerReg[]>("sh_sem_my", { p_user: session.uid });
    return NextResponse.json({ ok: true, auth: true, items: items ?? [] });
  } catch (e) {
    return seminarDbError(e);
  }
}
