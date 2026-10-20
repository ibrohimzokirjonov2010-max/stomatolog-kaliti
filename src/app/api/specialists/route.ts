import { NextResponse } from "next/server";
import { readCache, rpc } from "@/lib/server/db";
import { resolveStoredImage } from "@/lib/media-url";

export const dynamic = "force-dynamic";

/** Doctors who completed a profile, plus published usta profiles. */
export async function GET() {
  try {
    const data = await rpc<{ people?: Record<string, unknown>[] }>("sh_public_specialists", {});
    const people = Array.isArray(data?.people)
      ? data.people.map((row) => ({ ...row, image: resolveStoredImage(row.image) }))
      : [];
    return NextResponse.json({ ok: true, people }, { headers: readCache(false) });
  } catch {
    return NextResponse.json({ ok: false, people: [] }, { status: 502 });
  }
}
