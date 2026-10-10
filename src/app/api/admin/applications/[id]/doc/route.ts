import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { rpc, supabaseAnonKey, supabaseUrl } from "@/lib/server/db";
import { UUID_RE } from "@/lib/server/user";

export const dynamic = "force-dynamic";

/**
 * Streams a KYC document from the private `seller-docs` bucket to an admin.
 * The DB issues a 1-minute read ticket only for paths attached to this application (admin re-checked in SQL);
 * the storage select policy honours only ticketed paths.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;
  const { id } = await params;
  const path = new URL(request.url).searchParams.get("path") ?? "";
  if (!UUID_RE.test(id) || !/^apps\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(pdf|jpg|png|webp)$/i.test(path)) {
    return NextResponse.json({ ok: false, error: "Topilmadi." }, { status: 404 });
  }
  try {
    const ok = await rpc<boolean>("sh_admin_doc_ticket", { p_admin: guard.admin.id, p_app: id, p_path: path });
    if (!ok) return NextResponse.json({ ok: false, error: "Topilmadi." }, { status: 404 });
    const key = supabaseAnonKey();
    const res = await fetch(`${supabaseUrl()}/storage/v1/object/authenticated/seller-docs/${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok || !res.body) return NextResponse.json({ ok: false, error: "Fayl topilmadi." }, { status: 404 });
    return new Response(res.body, {
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Faylni ochib bo‘lmadi." }, { status: 502 });
  }
}
