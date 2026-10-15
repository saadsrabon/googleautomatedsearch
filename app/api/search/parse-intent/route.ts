import { NextRequest, NextResponse } from "next/server";
import { parseSearchIntentFromMessage } from "@/lib/parse-search-intent";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  message: z.string().min(3).max(2000),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Send a message between 3 and 2000 characters." },
      { status: 400 }
    );
  }

  try {
    const intent = await parseSearchIntentFromMessage(parsed.data.message);
    return NextResponse.json({ intent });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not parse request" },
      { status: 422 }
    );
  }
}
