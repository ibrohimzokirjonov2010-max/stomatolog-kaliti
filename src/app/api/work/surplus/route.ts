import { NextResponse } from "next/server";
import { readCache, rpc } from "@/lib/server/db";
import { viewerId, workError } from "@/lib/server/work";

export const dynamic = "force-dynamic";

/** Public feed: moderated (published) listings only — never includes phone/telegram. */
export async function GET() {
  try {
    const viewer = await viewerId();
    const data = await rpc<unknown[]>("sh_surplus_catalog", { p_viewer: viewer });
    return NextResponse.json({ ok: true, listings: data ?? [] }, { headers: readCache(Boolean(viewer)) });
  } catch (e) {
    return workError(e);
  }
}
