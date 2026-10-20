import { NextResponse } from "next/server";
import { publicObjectUrl, rpc } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { invalidResponse, workError } from "@/lib/server/work";
import { labPayload, validateLabForm, type LabInput } from "@/lib/add-forms";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, auth: false, profiles: [] });
  try {
    const profiles = await rpc("sh_lab_profiles", { p_user: session.uid });
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
  const rows = Array.isArray(body.rows) ? body.rows : Array.isArray(body.priceItems) ? body.priceItems : [];
  const input: LabInput = {
    name: String(body.name ?? ""),
    services: Array.isArray(body.services) ? body.services.filter((item): item is string => typeof item === "string") : [],
    materials: Array.isArray(body.materials) ? body.materials.filter((item): item is string => typeof item === "string") : [],
    rows: rows.map((row, index) => {
      const item = row && typeof row === "object" ? row as Record<string, unknown> : {};
      return { key: String(item.key ?? item.id ?? `row-${index}`), service: String(item.service ?? item.title ?? ""), material: String(item.material ?? ""), price: item.price == null ? "" : String(item.price), days: item.days == null ? "" : String(item.days) };
    }),
    city: String(body.city ?? ""),
    district: String(body.district ?? ""),
    address: String(body.address ?? ""),
    weekdays: Array.isArray(body.weekdays) ? body.weekdays.filter((item): item is string => typeof item === "string") : [],
    openTime: String(body.openTime ?? ""),
    closeTime: String(body.closeTime ?? ""),
    delivery: body.delivery === true,
    phone: String(body.phone ?? ""),
    telegram: String(body.telegram ?? ""),
    email: String(body.email ?? ""),
    sourceUrl: String(body.sourceUrl ?? ""),
    logo: typeof body.logo === "string" ? body.logo : "",
    photos: Array.isArray(body.photos) ? body.photos.filter((item): item is string => typeof item === "string") : [],
  };
  const errors = validateLabForm(input, mode);
  const own = (url: string) => !url || [publicObjectUrl(`labs/${guard.userId}/`), publicObjectUrl(`logos/${guard.userId}/`), publicObjectUrl(`listings/${guard.userId}/`)].some((prefix) => url.startsWith(prefix));
  if (!own(input.logo)) errors.logo = "Logo manzili noto‘g‘ri. Qayta yuklang.";
  if (!input.photos.every(own)) errors.photos = "Galereya rasmlari manzili noto‘g‘ri. Qayta yuklang.";
  const id = typeof body.id === "string" ? body.id : "";
  if (id && !UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "Profil topilmadi." }, { status: 400 });
  if (Object.keys(errors).length) return invalidResponse(errors);
  try {
    const lab = await rpc("sh_lab_save", { p_user: guard.userId, p_data: labPayload(input, mode, id) });
    return NextResponse.json({ ok: true, lab });
  } catch (e) {
    return workError(e);
  }
}
