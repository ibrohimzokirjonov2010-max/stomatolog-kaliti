import { after, NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { readJson, requireUser, str } from "@/lib/server/user";
import { buildCourierTrack } from "@/lib/server/courier";
import { flushTelegramOutbox, telegramNotifyReady } from "@/lib/server/telegram-notify";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  not_found: "Buyurtma topilmadi.",
  forbidden: "Bu buyurtma sizning do‘koningizga tegishli emas.",
  refunded: "Buyurtma bekor qilingan.",
  done: "Buyurtma allaqachon yetkazilgan.",
  not_delivered: "Buyurtma hali yetkazilmagan.",
  already: "Buyurtma allaqachon yakunlangan.",
  closed: "Buyurtma yopilgan — nizo ochib bo‘lmaydi.",
  exists: "Bu buyurtma bo‘yicha nizo allaqachon ochilgan.",
};

/** Seller: advance | track. Buyer: confirm | dispute. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const { id } = await params;
  if (!/^SK-\d{1,12}$/.test(id)) return NextResponse.json({ ok: false, error: ERRORS.not_found }, { status: 404 });
  const body = await readJson(request);
  const action = str(body.action, 10);
  try {
    let res: { order?: unknown; error?: string };
    if (action === "advance" || action === "track") {
      const built = buildCourierTrack(body.track);
      if ("error" in built) return NextResponse.json({ ok: false, error: built.error }, { status: 400 });
      res = await rpc("sh_seller_order_update", {
        p_user: guard.userId,
        p_order: id,
        p_action: action,
        p_track: built.track,
      });
    } else if (action === "confirm") {
      res = await rpc("sh_confirm_order", { p_user: guard.userId, p_order: id });
    } else if (action === "dispute") {
      const reason = str(body.reason, 1000);
      if (reason.length < 5) return NextResponse.json({ ok: false, error: "Muammoni qisqacha yozing." }, { status: 400 });
      res = await rpc("sh_open_dispute", { p_user: guard.userId, p_order: id, p_reason: reason });
    } else {
      return NextResponse.json({ ok: false, error: "Noma’lum amal." }, { status: 400 });
    }
    if (res.error) return NextResponse.json({ ok: false, error: ERRORS[res.error] ?? "Bajarib bo‘lmadi." }, { status: 400 });
    after(() => flushTelegramOutbox());
    let buyerTelegram = false;
    if ((action === "advance" || action === "track") && telegramNotifyReady()) {
      buyerTelegram = await rpc<boolean>("sh_order_buyer_tg", { p_user: guard.userId, p_order: id }).catch(() => false);
    }
    return NextResponse.json({ ok: true, order: res.order, buyerTelegram });
  } catch (e) {
    return dbErrorJson(e, "Bajarib bo‘lmadi.");
  }
}
