import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { workError } from "@/lib/server/work";

export const dynamic = "force-dynamic";

/** { action: "close" | "open" | "delete" } — owner only. */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  const body = await readJson(request);
  const action = typeof body.action === "string" ? body.action : "";
  if (!UUID_RE.test(id) || !["close", "open", "delete"].includes(action)) return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  try {
    const job = await rpc("sh_job_set", { p_user: guard.userId, p_id: id, p_action: action });
    return NextResponse.json({ ok: true, job });
  } catch (e) {
    return workError(e);
  }
}
