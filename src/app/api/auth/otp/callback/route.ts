import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { verifyGatewaySignature } from "@/lib/server/otp";

export const dynamic = "force-dynamic";

/** Telegram Gateway delivery reports (signed with SHA256(token) HMAC). */
export async function POST(request: Request) {
  const body = await request.text();
  const ok = verifyGatewaySignature(
    request.headers.get("x-request-timestamp") ?? "",
    body,
    request.headers.get("x-request-signature") ?? "",
  );
  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const report = JSON.parse(body) as { request_id?: string; delivery_status?: { status?: string } };
    if (report.request_id && report.delivery_status?.status) {
      await rpc("sh_otp_delivery_report", { p_request_id: report.request_id, p_status: report.delivery_status.status });
    }
  } catch {
    /* acknowledge anyway so Telegram does not retry malformed reports */
  }
  return NextResponse.json({ ok: true });
}
