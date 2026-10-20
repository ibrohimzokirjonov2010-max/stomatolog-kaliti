import { randomInt, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { requireUser } from "@/lib/server/user";
import { workError } from "@/lib/server/work";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const id = randomUUID();
  const code = String(randomInt(0, 10000)).padStart(4, "0");
  try {
    const token = await rpc<Record<string, unknown>>("sh_video_token_create", { p_user: guard.userId, p_id: id, p_code: code });
    return NextResponse.json({ ok: true, id, code, ...(token ?? {}) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/sh_video_token_create|PGRST202|schema cache|function/i.test(message)) {
      return NextResponse.json(
        { ok: false, pending: true, error: "Video tekshiruv kodi hali yoqilmagan. Migratsiya 20261020e ni qo‘llang." },
        { status: 503 },
      );
    }
    return workError(error);
  }
}
