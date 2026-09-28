import { NextResponse } from "next/server";
import { closeManagedBrowser } from "@/lib/puppeteer-config";

export const runtime = "nodejs";

export async function POST() {
  await closeManagedBrowser();
  return NextResponse.json({
    ok: true,
    message: "Browser closed. Run Verify or search again to open a fresh Chrome.",
  });
}
