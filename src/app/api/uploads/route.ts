import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { COMMUNITY_BUCKET, publicObjectUrl, rpc, supabaseUrl } from "@/lib/server/db";
import { getSessionUserId, jsonError, sameOrigin } from "@/lib/server/session";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };
/** Service-request attachments (Ustalar) may also be short videos (≤10 MB, bucket-enforced). */
const VIDEO_EXT: Record<string, string> = { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" };

/**
 * Issues a one-time, 15-minute upload ticket for a server-chosen path.
 * The browser then uploads straight to Supabase Storage (bucket policy only allows
 * inserts at ticketed paths; no overwrite/delete).
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Ruxsat yo‘q.", 403);
  const userId = await getSessionUserId();
  if (!userId) return jsonError("Avval tizimga kiring.", 401);
  const body = (await request.json().catch(() => null)) as { purpose?: unknown; contentType?: unknown } | null;
  const library = body?.purpose === "library";
  const purpose =
    body?.purpose === "avatar" ? "avatars" : body?.purpose === "product" ? "products" : body?.purpose === "logo" ? "logos" : body?.purpose === "seminar" ? "seminars" : body?.purpose === "listing" ? "listings" : body?.purpose === "request" ? "requests" : body?.purpose === "job" ? "jobs" : body?.purpose === "lab" ? "labs" : library ? "library" : "posts";
  const contentType = typeof body?.contentType === "string" ? body.contentType : "";
  const videoOk = library || purpose === "requests" || purpose === "jobs" || purpose === "labs" || purpose === "listings";
  const pdfOk = library;
  const ext = EXT[contentType] && (contentType !== "application/pdf" || pdfOk) ? EXT[contentType] : videoOk ? VIDEO_EXT[contentType] : undefined;
  if (!ext) return jsonError(videoOk ? "Faqat rasm (JPG, PNG, WEBP), PDF yoki video (MP4, MOV, WEBM)." : "Faqat JPG, PNG yoki WEBP rasm.");
  const path = `${purpose}/${userId}/${randomUUID()}.${ext}`;
  const bucket = library ? "library" : COMMUNITY_BUCKET;
  try {
    await rpc("sh_create_upload_ticket", { p_user: userId, p_path: path });
  } catch {
    return jsonError("Yuklashni boshlab bo‘lmadi.", 502);
  }
  return NextResponse.json({
    ok: true,
    path,
    uploadUrl: `${supabaseUrl()}/storage/v1/object/${bucket}/${path}`,
    publicUrl: publicObjectUrl(path, bucket),
  });
}
