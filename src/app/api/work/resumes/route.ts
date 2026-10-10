import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { viewerId, workError } from "@/lib/server/work";

export const dynamic = "force-dynamic";

/** Public resumes (published only) — no phone/telegram. */
export async function GET() {
  try {
    const data = await rpc<unknown[]>("sh_resume_catalog", { p_viewer: await viewerId() });
    return NextResponse.json({ ok: true, resumes: data ?? [] });
  } catch (e) {
    return workError(e);
  }
}
