import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { workError } from "@/lib/server/work";

export const dynamic = "force-dynamic";

/** Published classifieds. Phone and Telegram are part of a public ad. */
export async function GET() {
  try {
    const items = await rpc("sh_classified_public", {});
    return NextResponse.json({ ok: true, items: items ?? [] });
  } catch (e) {
    return workError(e);
  }
}
