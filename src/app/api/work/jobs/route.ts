import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { viewerId, workError } from "@/lib/server/work";

export const dynamic = "force-dynamic";

/** Public catalog: moderated (published) vacancies only — never includes the employer phone. */
export async function GET() {
  try {
    const data = await rpc<unknown[]>("sh_job_catalog", { p_viewer: await viewerId() });
    return NextResponse.json({ ok: true, jobs: data ?? [] });
  } catch (e) {
    return workError(e);
  }
}
