import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { workError } from "@/lib/server/work";

export const dynamic = "force-dynamic";

const KINDS = new Set(["master", "lab", "job", "classified", "surplus", "post"]);
const SERIOUS = new Set(["firibgarlik", "bemor", "qalbaki", "muddat"]);

export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const kind = typeof body.kind === "string" ? body.kind : "";
  const id = typeof body.id === "string" ? body.id : "";
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 80) : "boshqa";
  if (!KINDS.has(kind) || !UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "Topilmadi." }, { status: 400 });
  try {
    const data = await rpc<Record<string, unknown>>("sh_content_report", {
      p_user: guard.userId,
      p_kind: kind,
      p_id: id,
      p_reason: reason || "boshqa",
      p_serious: SERIOUS.has(reason),
    });
    return NextResponse.json({ ok: true, ...(data ?? {}) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/sh_content_report|PGRST202|schema cache|function/i.test(message)) {
      return NextResponse.json({ ok: false, pending: true, error: "Shikoyat hali yoqilmagan. Migratsiyani qo‘llang." }, { status: 503 });
    }
    return workError(error);
  }
}
