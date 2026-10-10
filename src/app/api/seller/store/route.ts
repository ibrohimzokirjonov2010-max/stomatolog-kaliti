import { NextResponse } from "next/server";
import { dbErrorJson, rpc } from "@/lib/server/db";
import { docsOwnedBy, safeImage, slugify, validateApplication } from "@/lib/server/seller";
import { readJson, requireUser, str } from "@/lib/server/user";
import { getSessionUserId } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Current user's store + latest application + all own products (incl. inactive). Guests get { shop: null }. */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: true, shop: null, application: null, products: [] });
  try {
    const data = await rpc<Record<string, unknown>>("sh_my_store", { p_user: userId });
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    return dbErrorJson(e, "Do‘kon ma’lumotini yuklab bo‘lmadi.");
  }
}

/** Submit a seller application: mode new | update (edit pending/rejected) | reapply. */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const mode = str(body.mode, 10);
  if (!["new", "update", "reapply"].includes(mode)) return NextResponse.json({ ok: false, error: "Noto‘g‘ri so‘rov." }, { status: 400 });
  const v = validateApplication((body.payload ?? {}) as Record<string, unknown>);
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
  if (!docsOwnedBy(v.value.docs, guard.userId)) return NextResponse.json({ ok: false, error: "Hujjat topilmadi." }, { status: 400 });
  try {
    const res = await rpc<{ shop?: unknown; existing?: boolean; error?: string }>("sh_submit_application", {
      p_user: guard.userId,
      p_mode: mode,
      p_payload: v.value,
    });
    if (res.error) return NextResponse.json({ ok: false, error: "Arizani saqlab bo‘lmadi." }, { status: 400 });
    return NextResponse.json({ ok: true, shop: res.shop, existing: Boolean(res.existing) });
  } catch (e) {
    return dbErrorJson(e, "Arizani yuborib bo‘lmadi.");
  }
}

/** Edit own store profile (any status). */
export async function PATCH(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const patch: Record<string, unknown> = {};
  const name = str(body.name, 120);
  if (name) {
    patch.name = name;
    patch.slug = slugify(name);
  }
  for (const [k, max] of [["city", 60], ["bio", 2000], ["phone", 40], ["telegram", 120], ["instagram", 120], ["facebook", 200], ["website", 200], ["address", 200]] as const) {
    if (k in body) patch[k] = str(body[k], max);
  }
  if ("yearsInBusiness" in body) {
    const y = Number(body.yearsInBusiness);
    patch.yearsInBusiness = Number.isFinite(y) && y >= 0 && y < 200 && body.yearsInBusiness !== "" && body.yearsInBusiness != null ? String(Math.floor(y)) : "";
  }
  if ("logo" in body) patch.logo = safeImage(body.logo);
  try {
    const res = await rpc<{ shop?: unknown; error?: string }>("sh_update_store", { p_user: guard.userId, p_patch: patch });
    if (res.error) return NextResponse.json({ ok: false, error: "Do‘kon topilmadi." }, { status: 404 });
    return NextResponse.json({ ok: true, shop: res.shop });
  } catch (e) {
    return dbErrorJson(e, "Saqlab bo‘lmadi.");
  }
}
