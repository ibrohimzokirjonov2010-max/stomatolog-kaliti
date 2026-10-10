import { NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { getSessionUserId, jsonError, sameOrigin } from "@/lib/server/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return jsonError("Avval tizimga kiring.", 401);
  try {
    const places = await rpc<unknown[]>("sh_saved_addresses", { p_user: userId });
    return NextResponse.json({ ok: true, places: Array.isArray(places) ? places : [] });
  } catch (error) {
    return dbErrorJson(error, "Manzillarni yuklab bo‘lmadi.");
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Ruxsat yo‘q.", 403);
  const userId = await getSessionUserId();
  if (!userId) return jsonError("Avval tizimga kiring.", 401);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return jsonError("Noto‘g‘ri so‘rov.");
  const id = typeof body.id === "string" && UUID.test(body.id) ? body.id : null;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  try {
    if (body.action === "delete") {
      if (!id) return jsonError("Topilmadi.", 404);
      await rpc("sh_saved_address_delete", { p_user: userId, p_id: id });
      return NextResponse.json({ ok: true });
    }
    const place = await rpc<unknown>("sh_saved_address_save", {
      p_user: userId,
      p_id: id,
      p_data: {
        label: str(body.label, 40),
        address: str(body.address, 300),
        city: str(body.city, 60),
        district: str(body.district, 120),
        lat: num(body.lat),
        lng: num(body.lng),
      },
    });
    return NextResponse.json({ ok: true, place });
  } catch (error) {
    return dbErrorJson(error, "Manzilni saqlab bo‘lmadi.");
  }
}
