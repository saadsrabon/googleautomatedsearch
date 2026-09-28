import { NextResponse } from "next/server";
import { verifyGoogleCaptchaAccess } from "@/lib/google-captcha-verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

export async function POST() {
  try {
    const result = await verifyGoogleCaptchaAccess();
    const status = result.verified ? 200 : 408;
    return NextResponse.json(result, { status });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Verification failed";
    return NextResponse.json({ verified: false, message }, { status: 500 });
  }
}
