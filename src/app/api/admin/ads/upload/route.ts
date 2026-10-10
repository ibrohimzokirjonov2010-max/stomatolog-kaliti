import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { COMMUNITY_BUCKET, publicObjectUrl, rpc, supabaseUrl } from "@/lib/server/db";
import { readJson } from "@/lib/server/user";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** One-time upload ticket for an ad banner (public bucket, server-chosen path under ads/). */
export async function POST(request: Request) {
  const guard = await requireAdmin(request, ["admin", "finance"]);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const ext = EXT[typeof body.contentType === "string" ? body.contentType : ""];
  if (!ext) return NextResponse.json({ ok: false, error: "Faqat JPG, PNG yoki WEBP rasm." }, { status: 400 });
  const path = `ads/${guard.admin.id}/${randomUUID()}.${ext}`;
  try {
    await rpc("sh_create_upload_ticket", { p_user: guard.admin.id, p_path: path });
  } catch {
    return NextResponse.json({ ok: false, error: "Yuklashni boshlab bo‘lmadi." }, { status: 502 });
  }
  return NextResponse.json({
    ok: true,
    path,
    uploadUrl: `${supabaseUrl()}/storage/v1/object/${COMMUNITY_BUCKET}/${path}`,
    publicUrl: publicObjectUrl(path),
  });
}
