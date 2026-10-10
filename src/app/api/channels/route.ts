import { NextResponse } from "next/server";
import { channelCategories } from "@/data/channels";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { getSessionUserId } from "@/lib/server/session";
import { readJson, requireUser, str } from "@/lib/server/user";

export const dynamic = "force-dynamic";

const PALETTE = ["#0066FF", "#0d9488", "#7c3aed", "#ea580c", "#db2777", "#2563eb", "#059669", "#4f46e5"];

/** Community-added Telegram channels + current auction bids (seed channels live in code). */
export async function GET() {
  const viewer = await getSessionUserId();
  try {
    const data = await rpc<Record<string, unknown>>("sh_channels", { p_viewer: viewer ?? null });
    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json({ ok: false, channels: [], bids: {}, myBidKeys: [] }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const clean = str(body.username, 64).replace(/^@+/, "").replace(/[^a-zA-Z0-9_]/g, "");
  const category = str(body.category, 40);
  if (clean.length < 3 || clean.length > 32 || !channelCategories.some((c) => c.id === category)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const username = `@${clean}`;
  const name = str(body.name, 120) || clean;
  try {
    const res = await rpc<{ channel?: unknown; error?: string }>("sh_add_channel", {
      p_user: guard.userId,
      p_username: username,
      p_name: name,
      p_category: category,
      p_color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    });
    if (res.error === "duplicate") return NextResponse.json({ ok: false, error: "duplicate" }, { status: 409 });
    return NextResponse.json({ ok: true, channel: res.channel });
  } catch (e) {
    return dbErrorJson(e, "Kanalni qo‘shib bo‘lmadi.");
  }
}
