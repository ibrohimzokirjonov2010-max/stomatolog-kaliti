import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { viewerId, workError } from "@/lib/server/work";
import { UUID_RE } from "@/lib/server/user";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "E’lon topilmadi." }, { status: 404 });
  try {
    const item = await rpc("sh_classified_one", { p_id: id, p_viewer: await viewerId() });
    if (!item) return NextResponse.json({ ok: false, error: "E’lon topilmadi." }, { status: 404 });
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return workError(e);
  }
}
