import { NextResponse } from "next/server";
import { MIN_CHANNEL_BID } from "@/data/channels";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { readJson, requireUser, str } from "@/lib/server/user";

export const dynamic = "force-dynamic";

type ChannelsData = { channels: { id: string; username: string }[]; bids: Record<string, number> };

/** Place an auction bid to take the #1 spot. Minimum is computed server-side from seed + DB bids. */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const key = str(body.channelId, 80);
  const amount = Math.floor(Number(body.amount));
  if (!key || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  try {
    const data = await rpc<ChannelsData>("sh_channels", { p_viewer: null });
    const bids = data.bids ?? {};
    const dbChannel = data.channels.find((c) => c.id === key);
    if (!dbChannel) return NextResponse.json({ ok: false, error: "not_found", minRequired: MIN_CHANNEL_BID }, { status: 404 });
    const sums = data.channels.map((c) => Math.max(MIN_CHANNEL_BID, Number(bids[c.id]) || 0));
    const min = Math.max(MIN_CHANNEL_BID, (sums.length ? Math.max(...sums) : 0) + 1);
    if (amount < min) return NextResponse.json({ ok: false, error: "too_low", minRequired: min }, { status: 400 });
    const res = await rpc<{ ok?: boolean; error?: string }>("sh_place_bid", {
      p_user: guard.userId,
      p_key: key,
      p_username: dbChannel.username,
      p_amount: amount,
      p_min: min,
    });
    if (res.error === "too_low") return NextResponse.json({ ok: false, error: "too_low", minRequired: min }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbErrorJson(e, "Taklifni saqlab bo‘lmadi.");
  }
}
