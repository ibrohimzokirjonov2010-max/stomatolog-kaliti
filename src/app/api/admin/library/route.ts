import { NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { privateCache, rpc } from "@/lib/server/db";
import { UUID_RE, readJson, str } from "@/lib/server/user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireAdmin(request, ["owner", "admin", "moderator"]);
  if (guard.error) return guard.error;
  try {
    const data = await rpc("sh_admin_library", { p_admin: guard.admin.id });
    return NextResponse.json({ ok: true, data }, { headers: privateCache() });
  } catch (error) {
    return adminRpcError(error);
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin(request, ["owner", "admin", "moderator"]);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const kind = str(body.kind, 16);
  const action = str(body.action, 16) || "save";
  const id = str(body.id, 60);
  try {
    if (action === "delete") {
      if (!UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "Topilmadi." }, { status: 404 });
      const fn = kind === "book" ? "sh_admin_book_delete" : kind === "course" ? "sh_admin_course_delete" : kind === "news" ? "sh_admin_news_delete" : "";
      if (!fn) return NextResponse.json({ ok: false, error: "Noto‘g‘ri tur." }, { status: 400 });
      await rpc(fn, { p_admin: guard.admin.id, p_id: id });
      return NextResponse.json({ ok: true }, { headers: privateCache() });
    }
    const row = body.row;
    if (!row || typeof row !== "object") return NextResponse.json({ ok: false, error: "Maydonlar yetishmayapti." }, { status: 400 });
    const fn = kind === "book" ? "sh_admin_book_save" : kind === "course" ? "sh_admin_course_save" : kind === "news" ? "sh_admin_news_save" : "";
    if (!fn) return NextResponse.json({ ok: false, error: "Noto‘g‘ri tur." }, { status: 400 });
    const saved = await rpc<Record<string, unknown>>(fn, { p_admin: guard.admin.id, p_row: row });
    if (saved?.error) return NextResponse.json({ ok: false, error: "Sarlavha va muallif majburiy." }, { status: 400 });
    return NextResponse.json({ ok: true, saved }, { headers: privateCache() });
  } catch (error) {
    return adminRpcError(error);
  }
}
