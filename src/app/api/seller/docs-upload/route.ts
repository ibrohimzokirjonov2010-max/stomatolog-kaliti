import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { rpc, supabaseUrl } from "@/lib/server/db";
import { readJson, requireUser } from "@/lib/server/user";

const EXT: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/**
 * One-time upload ticket for a KYC document (guvohnoma, pasport…) into the PRIVATE `seller-docs` bucket.
 * Path is server-chosen under the caller's folder; only admins can read it back (via /api/admin/applications/[id]/doc).
 */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const ext = EXT[typeof body.contentType === "string" ? body.contentType : ""];
  if (!ext) return NextResponse.json({ ok: false, error: "Faqat PDF, JPG, PNG yoki WEBP." }, { status: 400 });
  const size = Number(body.size) || 0;
  if (size > 8 * 1024 * 1024) return NextResponse.json({ ok: false, error: "Fayl 8 MB dan oshmasin." }, { status: 400 });
  const path = `apps/${guard.userId}/${randomUUID()}.${ext}`;
  try {
    await rpc("sh_create_upload_ticket", { p_user: guard.userId, p_path: path });
  } catch {
    return NextResponse.json({ ok: false, error: "Yuklashni boshlab bo‘lmadi." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, path, uploadUrl: `${supabaseUrl()}/storage/v1/object/seller-docs/${path}` });
}
