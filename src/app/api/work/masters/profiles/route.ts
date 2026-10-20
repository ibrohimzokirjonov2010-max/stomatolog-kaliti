import { NextResponse } from "next/server";
import { publicObjectUrl, rpc } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { invalidResponse, workError } from "@/lib/server/work";
import { ustaPayload, validateUsta, type UstaInput } from "@/lib/add-forms";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, auth: false, profiles: [] });
  try {
    const profiles = await rpc("sh_master_profiles", { p_user: session.uid });
    return NextResponse.json({ ok: true, auth: true, profiles: profiles ?? [] });
  } catch (e) {
    return workError(e);
  }
}

export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const mode = body.mode === "publish" ? "publish" : "draft";
  const input: UstaInput = {
    name: String(body.name ?? ""),
    services: Array.isArray(body.services) ? body.services.filter((item): item is string => typeof item === "string") : [],
    years: String(body.years ?? ""),
    city: String(body.city ?? ""),
    district: String(body.district ?? ""),
    address: String(body.address ?? ""),
    hours: String(body.hours ?? ""),
    priceFrom: body.priceFrom == null ? "" : String(body.priceFrom),
    priceNegotiable: body.priceNegotiable === true,
    description: String(body.description ?? ""),
    phone: String(body.phone ?? ""),
    telegram: String(body.telegram ?? ""),
    sourceUrl: String(body.sourceUrl ?? ""),
    instagram: String(body.instagram ?? ""),
    photo: typeof body.photo === "string" ? body.photo : "",
    works: Array.isArray(body.works) ? body.works.filter((item): item is string => typeof item === "string") : [],
    visitMode: typeof body.visitMode === "string" ? body.visitMode : "",
  };
  const errors = validateUsta(input, mode);
  const own = (url: string) => !url || [publicObjectUrl(`listings/${guard.userId}/`), publicObjectUrl(`logos/${guard.userId}/`)].some((prefix) => url.startsWith(prefix));
  if (!own(input.photo)) errors.photo = "Logo manzili noto‘g‘ri. Qayta yuklang.";
  if (!input.works.every(own)) errors.works = "Portfolio rasmlari manzili noto‘g‘ri. Qayta yuklang.";
  const id = typeof body.id === "string" ? body.id : "";
  if (id && !UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "Profil topilmadi." }, { status: 400 });
  if (Object.keys(errors).length) return invalidResponse(errors);
  try {
    const master = await rpc("sh_master_save", { p_user: guard.userId, p_data: ustaPayload(input, mode, id) });
    return NextResponse.json({ ok: true, master });
  } catch (e) {
    return workError(e);
  }
}
