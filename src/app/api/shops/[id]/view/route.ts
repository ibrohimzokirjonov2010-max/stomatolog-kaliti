import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { UUID_RE } from "@/lib/server/user";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ ok: false }, { status: 400 });
  await rpc("sh_bump_store_view", { p_store: id }).catch(() => null);
  return NextResponse.json({ ok: true });
}
