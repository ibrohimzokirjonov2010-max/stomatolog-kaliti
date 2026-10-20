import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { workError } from "@/lib/server/work";

export const dynamic = "force-dynamic";

const KINDS = new Set(["master", "lab", "job", "classified", "surplus"]);

export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const kind = typeof body.kind === "string" ? body.kind : "";
  const id = typeof body.id === "string" ? body.id : "";
  if (!KINDS.has(kind) || !UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "Topilmadi." }, { status: 400 });
  try {
    const data = await rpc<{ phone?: string | null }>("sh_reveal_phone", { p_user: guard.userId, p_kind: kind, p_id: id });
    if (!data?.phone) return NextResponse.json({ ok: false, error: "Raqam ko‘rsatilmagan." }, { status: 404 });
    return NextResponse.json({ ok: true, phone: data.phone });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/sh_reveal_phone|PGRST202|schema cache|function/i.test(message)) {
      return NextResponse.json({ ok: false, pending: true, error: "Raqamni ochish hali yoqilmagan. Migratsiyani qo‘llang." }, { status: 503 });
    }
    return workError(error);
  }
}
