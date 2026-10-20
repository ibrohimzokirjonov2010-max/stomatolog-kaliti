import { NextResponse } from "next/server";
import { publicObjectUrl, rpc } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { invalidResponse, workError } from "@/lib/server/work";
import { elonPayload, validateElon, type ElonInput } from "@/lib/add-forms";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, auth: false, items: [] });
  try {
    const items = await rpc("sh_classified_mine", { p_user: session.uid });
    return NextResponse.json({ ok: true, auth: true, items: items ?? [] });
  } catch (e) {
    return workError(e);
  }
}

export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const mode = body.mode === "publish" ? "publish" : "draft";
  const input: ElonInput = {
    title: String(body.title ?? ""),
    category: String(body.category ?? ""),
    condition: body.condition === "ishlatilgan" ? "ishlatilgan" : "yangi",
    price: body.price == null ? "" : String(body.price),
    negotiable: body.negotiable === true,
    description: String(body.description ?? ""),
    city: String(body.city ?? ""),
    district: String(body.district ?? ""),
    phone: String(body.phone ?? ""),
    telegram: String(body.telegram ?? ""),
    photos: Array.isArray(body.photos) ? body.photos.filter((item): item is string => typeof item === "string") : [],
  };
  const errors = validateElon(input, mode);
  const prefix = publicObjectUrl(`listings/${guard.userId}/`);
  const photos = input.photos.map((url) => (url.startsWith(prefix) ? url : ""));
  if (photos.some((url, index) => input.photos[index] && !url)) errors.photos = "Rasm manzili noto‘g‘ri. Rasmlarni qayta yuklang.";
  const id = typeof body.id === "string" && body.id ? body.id : "";
  if (id && !UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "E’lon topilmadi." }, { status: 400 });
  if (Object.keys(errors).length) return invalidResponse(errors);
  try {
    const item = await rpc("sh_classified_save", { p_user: guard.userId, p_id: id || null, p_data: { ...elonPayload(input, mode), photos: photos.filter(Boolean) } });
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return workError(e);
  }
}
