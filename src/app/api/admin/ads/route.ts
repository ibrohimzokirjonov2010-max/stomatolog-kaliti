import { NextResponse } from "next/server";
import { adminRpcError, requireAdmin } from "@/lib/server/admin";
import { publicObjectUrl, rpc } from "@/lib/server/db";
import { readJson, str, UUID_RE } from "@/lib/server/user";

export const dynamic = "force-dynamic";
const PLACEMENTS = new Set(["home", "marketplace", "seminar", "community"]);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;
  try {
    const data = await rpc("sh_admin_ads", { p_admin: guard.admin.id });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return adminRpcError(e);
  }
}

/** Create (no id) or update an ad. */
export async function POST(request: Request) {
  const guard = await requireAdmin(request, ["admin", "finance"]);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const id = str(body.id, 40);
  if (id && !UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "Topilmadi." }, { status: 404 });
  const ad: Record<string, unknown> = id ? { id } : {};
  const bad = (error: string) => NextResponse.json({ ok: false, error }, { status: 400 });

  if (!id || "advertiser" in body) {
    const advertiser = str(body.advertiser, 160);
    if (!advertiser) return bad("Reklama beruvchini kiriting.");
    ad.advertiser = advertiser;
    ad.title = str(body.title, 160);
  }
  if (!id || "imageUrl" in body) {
    const imageUrl = str(body.imageUrl, 500);
    if (!imageUrl.startsWith(publicObjectUrl("ads/"))) return bad("Banner rasmini yuklang.");
    ad.imageUrl = imageUrl;
  }
  if (!id || "placements" in body) {
    const placements = Array.isArray(body.placements)
      ? [...new Set(body.placements.filter((p): p is string => typeof p === "string" && PLACEMENTS.has(p)))]
      : [];
    if (!placements.length) return bad("Kamida bitta joylashuvni tanlang.");
    ad.placements = placements;
  }
  if (!id || "startsOn" in body || "endsOn" in body) {
    const startsOn = str(body.startsOn, 10);
    const endsOn = str(body.endsOn, 10);
    if (!DATE.test(startsOn) || !DATE.test(endsOn) || endsOn < startsOn) return bad("Sanalarni to‘g‘ri kiriting.");
    ad.startsOn = startsOn;
    ad.endsOn = endsOn;
  }
  if (!id || "price" in body) {
    const price = Math.floor(Number(body.price));
    if (!Number.isFinite(price) || price < 0 || price > 1e12) return bad("Narxni to‘g‘ri kiriting.");
    ad.price = price;
    ad.pricing = body.pricing === "total" ? "total" : "monthly";
  }
  if (!id || "linkUrl" in body) {
    const link = str(body.linkUrl, 500);
    if (link && !/^https?:\/\//i.test(link) && !(link.startsWith("/") && !link.startsWith("//")))
      return bad("Havola http(s):// yoki / bilan boshlanishi kerak.");
    ad.linkUrl = link;
  }
  if ("status" in body) {
    const status = str(body.status, 10);
    if (!["draft", "active", "paused", "archived"].includes(status)) return bad("Noto‘g‘ri holat.");
    ad.status = status;
  }
  try {
    const res = await rpc<{ ok?: boolean; id?: string; error?: string }>("sh_admin_save_ad", { p_admin: guard.admin.id, p_ad: ad });
    if (res.error) return bad("Saqlab bo‘lmadi.");
    return NextResponse.json({ ok: true, id: res.id });
  } catch (e) {
    return adminRpcError(e);
  }
}
