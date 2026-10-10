import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { invalidResponse, ownPhoto, workError } from "@/lib/server/work";
import { validateSurplus } from "@/lib/work-validate";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, auth: false, listings: [] });
  try {
    const listings = await rpc("sh_surplus_mine", { p_user: session.uid });
    return NextResponse.json({ ok: true, auth: true, listings });
  } catch (e) {
    return workError(e);
  }
}

/** Create (no id) or edit (id) a listing. New listings wait for admin approval. */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const id = typeof body.id === "string" && body.id ? body.id : null;
  if (id && !UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "E’lon topilmadi." }, { status: 400 });
  const { errors, clean } = validateSurplus(body);
  const image = ownPhoto(clean.image, guard.userId);
  if (image === null) errors.image = "Rasm manzili noto‘g‘ri. Rasmni qayta yuklang.";
  if (!clean.images.every((u) => ownPhoto(u, guard.userId))) errors.images = "Galereya rasmlari noto‘g‘ri. Rasmlarni qayta yuklang.";
  const video = ownPhoto(clean.video, guard.userId);
  if (video === null || (video && !/\.(mp4|mov|webm)$/i.test(video))) errors.video = "Video manzili noto‘g‘ri. Videoni qayta yuklang.";
  if (Object.keys(errors).length) return invalidResponse(errors);
  try {
    const listing = await rpc("sh_surplus_save", { p_user: guard.userId, p_id: id, p_data: { ...clean, image, video } });
    return NextResponse.json({ ok: true, listing });
  } catch (e) {
    return workError(e);
  }
}
