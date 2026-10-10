import { NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { UUID_RE, readJson, requireUser, str } from "@/lib/server/user";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const { id } = await params;
  const action = str((await readJson(request)).action, 12);
  if (!UUID_RE.test(id) || !["activate", "deactivate", "delete"].includes(action))
    return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  try {
    const res = await rpc<{ ok?: boolean; error?: string }>("sh_product_action", { p_user: guard.userId, p_product: id, p_action: action });
    if (!res.ok) return NextResponse.json({ ok: false, error: "Mahsulot topilmadi." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbErrorJson(e, "Bajarib bo‘lmadi.");
  }
}
