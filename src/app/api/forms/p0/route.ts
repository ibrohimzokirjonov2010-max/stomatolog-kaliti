import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { workError } from "@/lib/server/work";

export const dynamic = "force-dynamic";

const KINDS = new Set(["master", "lab", "job", "classified", "surplus", "case"]);

/** Stores optional P0 fields after the main save. Missing migration returns pending, not a hard failure. */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const kind = typeof body.kind === "string" ? body.kind : "";
  const id = typeof body.id === "string" ? body.id : "";
  const extra = body.extra;
  if (!KINDS.has(kind) || !UUID_RE.test(id) || !extra || typeof extra !== "object" || Array.isArray(extra)) {
    return NextResponse.json({ ok: false, error: "Qo‘shimcha maydon noto‘g‘ri." }, { status: 400 });
  }
  try {
    await rpc("sh_form_p0_set", { p_user: guard.userId, p_kind: kind, p_id: id, p_extra: extra });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/sh_form_p0_set|PGRST202|schema cache|function/i.test(message)) {
      return NextResponse.json({ ok: false, pending: true });
    }
    return workError(error);
  }
}
