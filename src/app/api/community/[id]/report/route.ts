import { NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { readJson, requireUser, str, UUID_RE } from "@/lib/server/user";

const REASONS = new Set(["spam", "reklama", "haqorat", "noto‘g‘ri ma’lumot", "boshqa"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "Topilmadi." }, { status: 404 });
  const body = await readJson(request);
  const reason = str(body.reason, 60);
  try {
    const res = await rpc<{ ok?: boolean; error?: string }>("sh_report_post", {
      p_user: auth.userId,
      p_post: id,
      p_reason: REASONS.has(reason) ? reason : "boshqa",
    });
    if (res.error) return NextResponse.json({ ok: false, error: "Post topilmadi." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return dbErrorJson(error, "Shikoyat yuborilmadi.");
  }
}
