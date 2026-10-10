import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { readJson, requireUser } from "@/lib/server/user";
import { invalidResponse, ownPhoto, workError } from "@/lib/server/work";
import { validateMaster } from "@/lib/work-validate";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, auth: false, master: null });
  try {
    const master = await rpc("sh_master_mine", { p_user: session.uid });
    return NextResponse.json({ ok: true, auth: true, master });
  } catch (e) {
    return workError(e);
  }
}

/** Create / update my master profile (new or rejected profiles go to admin moderation). */
export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const { errors, clean } = validateMaster(await readJson(request));
  const photo = ownPhoto(clean.photo, guard.userId);
  if (photo === null) errors.photo = "Rasm manzili noto‘g‘ri. Rasmni qayta yuklang.";
  const works = clean.works.map((url) => ownPhoto(url, guard.userId));
  if (works.some((url) => url === null)) errors.works = "Ish rasmlari manzili noto‘g‘ri. Qayta yuklang.";
  if (Object.keys(errors).length) return invalidResponse(errors);
  try {
    const master = await rpc("sh_master_save", { p_user: guard.userId, p_data: { ...clean, photo, works } });
    return NextResponse.json({ ok: true, master });
  } catch (e) {
    return workError(e);
  }
}

export async function DELETE(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  try {
    await rpc("sh_master_delete", { p_user: guard.userId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return workError(e);
  }
}
