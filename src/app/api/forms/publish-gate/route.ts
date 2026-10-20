import { NextResponse } from "next/server";
import { smsOtpPublicStatus } from "@/lib/server/sms-otp";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, ...smsOtpPublicStatus() });
}
