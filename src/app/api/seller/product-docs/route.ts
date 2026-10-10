import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { rpc, supabaseUrl } from "@/lib/server/db";
import { PRODUCT_DOCS_BUCKET } from "@/lib/server/seller";
import { readJson, requireUser } from "@/lib/server/user";

const EXT: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** One-time upload ticket for a product certificate / instruction (public `product-docs` bucket, shown on the product page). */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const ext = EXT[typeof body.contentType === "string" ? body.contentType : ""];
  if (!ext) return NextResponse.json({ ok: false, error: "Faqat PDF, JPG, PNG yoki WebP fayl." }, { status: 400 });
  if ((Number(body.size) || 0) > 10 * 1024 * 1024) return NextResponse.json({ ok: false, error: "Fayl 10 MB dan oshmasin." }, { status: 400 });
  const path = `docs/${guard.userId}/${randomUUID()}.${ext}`;
  try {
    await rpc("sh_create_upload_ticket", { p_user: guard.userId, p_path: path });
  } catch {
    return NextResponse.json({ ok: false, error: "Yuklashni boshlab bo‘lmadi." }, { status: 502 });
  }
  return NextResponse.json({
    ok: true,
    path,
    uploadUrl: `${supabaseUrl()}/storage/v1/object/${PRODUCT_DOCS_BUCKET}/${path}`,
    publicUrl: `${supabaseUrl()}/storage/v1/object/public/${PRODUCT_DOCS_BUCKET}/${path}`,
  });
}
