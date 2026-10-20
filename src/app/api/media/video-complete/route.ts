import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { workError } from "@/lib/server/work";
import { videoMetaProblem, type SurplusVideoMeta } from "@/lib/forms/p0";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const tokenId = typeof body.tokenId === "string" ? body.tokenId : "";
  if (!UUID_RE.test(tokenId)) return NextResponse.json({ ok: false, error: "Video tokeni yo‘q." }, { status: 400 });
  const meta: SurplusVideoMeta = {
    tokenId,
    code: typeof body.code === "string" ? body.code : "",
    captureSource: body.captureSource === "live_camera" || body.captureSource === "capture_input" || body.captureSource === "desktop_file" ? body.captureSource : "desktop_file",
    durationMs: Number(body.durationMs) || 0,
    sizeBytes: Number(body.sizeBytes) || 0,
    sha256: typeof body.sha256 === "string" ? body.sha256 : "",
    mobile: body.mobile === true,
  };
  const problem = videoMetaProblem(meta);
  if (problem) return NextResponse.json({ ok: false, error: problem }, { status: 400 });
  try {
    const result = await rpc<Record<string, unknown>>("sh_video_token_complete", {
      p_user: guard.userId,
      p_id: tokenId,
      p_meta: { ...meta, videoUrl: typeof body.videoUrl === "string" ? body.videoUrl : "" },
    });
    return NextResponse.json({ ok: true, ...(result ?? {}) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/sh_video_token_complete|PGRST202|schema cache|function/i.test(message)) {
      return NextResponse.json(
        { ok: false, pending: true, error: "Video tekshiruvi hali yoqilmagan. Migratsiya 20261020e ni qo‘llang." },
        { status: 503 },
      );
    }
    return workError(error);
  }
}
