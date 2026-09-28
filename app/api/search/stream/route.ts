import { NextRequest } from "next/server";
import { z } from "zod";
import { runLeadSearchPipeline } from "@/lib/lead-pipeline";
import { siteDomainById, SOCIAL_SITES } from "@/lib/search-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

const bodySchema = z.object({
  siteId: z.string(),
  niche: z.string().min(1).max(120),
  categoryName: z.string().min(1).max(120).optional(),
  maxPages: z.number().int().min(1).max(10).optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return new Response(JSON.stringify({ type: "error", message: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { siteId, niche, categoryName, maxPages = 5 } = parsed.data;
  const domain = siteDomainById(siteId);
  if (!domain) {
    return new Response(JSON.stringify({ type: "error", message: "Unknown site" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const siteLabel =
    SOCIAL_SITES.find((s) => s.id === siteId)?.label ?? domain;
  const name =
    categoryName?.trim() ||
    `${siteLabel} — ${niche.trim()}`.slice(0, 120);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        await runLeadSearchPipeline(
          {
            siteId,
            niche,
            domain,
            categoryName: name,
            maxPages,
          },
          send
        );
      } catch (e) {
        send({
          type: "error",
          message: e instanceof Error ? e.message : "Pipeline failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
