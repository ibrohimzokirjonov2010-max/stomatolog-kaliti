import { NextResponse } from "next/server";
import { readCache, rpc } from "@/lib/server/db";
import { viewerId, workError } from "@/lib/server/work";

export const dynamic = "force-dynamic";

/** Public catalog: moderated (published) labs only — never includes phone/telegram. */
export async function GET() {
  try {
    const viewer = await viewerId();
    const data = await rpc<unknown[]>("sh_lab_catalog", { p_viewer: viewer });
    return NextResponse.json({ ok: true, labs: data ?? [] }, { headers: readCache(Boolean(viewer)) });
  } catch (e) {
    return workError(e);
  }
}
