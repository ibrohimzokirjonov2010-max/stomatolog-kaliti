import "server-only";
import { NextResponse } from "next/server";
import { DbError, publicObjectUrl } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { fieldsResponseBody, type FieldErrors } from "@/lib/work-validate";

export async function viewerId() {
  const s = await getSession();
  return s?.uid ?? null;
}

export function invalidResponse(errors: FieldErrors) {
  return NextResponse.json(fieldsResponseBody(errors), { status: 400 });
}

/** Maps DB errors to Uzbek JSON; only DbError is swallowed (Next.js bail-out errors propagate). */
export function workError(e: unknown) {
  if (e instanceof DbError) {
    const status = e.status === 403 ? 403 : e.status === 502 ? 502 : 400;
    return NextResponse.json({ ok: false, error: e.message }, { status });
  }
  throw e;
}

/** Image URLs must point to the caller's own `listings/<uid>/` folder in our storage bucket. */
export function ownPhoto(url: string, userId: string) {
  if (!url) return "";
  return url.startsWith(publicObjectUrl(`listings/${userId}/`)) ? url : null;
}
