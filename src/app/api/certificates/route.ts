import { NextResponse } from "next/server";

/**
 * Certificates of the signed-in doctor.
 * There is no certificates table in Supabase yet, so this honestly returns an empty list;
 * the /sertifikatlar page then shows its empty state. Wire the table here when it exists.
 */
export async function GET() {
  return NextResponse.json({ ok: true, certificates: [] });
}
