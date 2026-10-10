import { NextResponse } from "next/server";
import { publicObjectUrl, rpc } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { readJson, requireUser } from "@/lib/server/user";
import { invalidResponse, ownPhoto, workError } from "@/lib/server/work";
import { validateLab } from "@/lib/work-validate";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, auth: false, lab: null });
  try {
    const lab = await rpc("sh_lab_mine", { p_user: session.uid });
    return NextResponse.json({ ok: true, auth: true, lab });
  } catch (e) {
    return workError(e);
  }
}

export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const { errors, clean } = validateLab(await readJson(request));
  const photo = ownPhoto(clean.photo, guard.userId);
  if (photo === null) errors.photo = "Rasm manzili noto‘g‘ri. Rasmni qayta yuklang.";
  // Gallery/portfolio/logo/video/price-row photos must be the owner's own uploads (listings/<uid>/ or labs/<uid>/).
  const own = [publicObjectUrl(`listings/${guard.userId}/`), publicObjectUrl(`labs/${guard.userId}/`)];
  const isOwn = (url: string | null) => !url || own.some((p) => url.startsWith(p));
  if (![...clean.photos, ...clean.portfolio].every(isOwn)) errors.photos = "Rasm manzili noto‘g‘ri. Rasmlarni qayta yuklang.";
  if (!isOwn(clean.video)) errors.video = "Video manzili noto‘g‘ri. Qayta yuklang.";
  if (!isOwn(clean.logo)) errors.logo = "Logo manzili noto‘g‘ri. Qayta yuklang.";
  if (!clean.priceItems.every((r) => isOwn(r.photo))) errors.priceItems = "Xizmat rasmi manzili noto‘g‘ri. Qayta yuklang.";
  if (Object.keys(errors).length) return invalidResponse(errors);
  try {
    const lab = await rpc("sh_lab_save", { p_user: guard.userId, p_data: { ...clean, photo } });
    return NextResponse.json({ ok: true, lab });
  } catch (e) {
    return workError(e);
  }
}

export async function DELETE(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  try {
    await rpc("sh_lab_delete", { p_user: guard.userId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return workError(e);
  }
}
