import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { viewerId, workError } from "@/lib/server/work";

export const dynamic = "force-dynamic";

/** Public catalog: moderated (published) labs only — never includes phone/telegram. */
export async function GET() {
  try {
    const data = await rpc<unknown[]>("sh_lab_catalog", { p_viewer: await viewerId() });
    return NextResponse.json({ ok: true, labs: data ?? [] });
  } catch (e) {
    return workError(e);
  }
}
