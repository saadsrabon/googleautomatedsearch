import { NextRequest } from "next/server";
import { runLeadSearchPipeline } from "@/lib/lead-pipeline";
import { searchBodySchema } from "@/lib/search-body-schema";
import { siteDomainById, SOCIAL_SITES } from "@/lib/search-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = searchBodySchema.safeParse(json);
  if (!parsed.success) {
    return new Response(JSON.stringify({ type: "error", message: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const {
    siteId,
    niche,
    categoryName,
    regions,
    startPage,
    endPage,
  } = parsed.data;
  const domain = siteDomainById(siteId);
  if (!domain) {
    return new Response(JSON.stringify({ type: "error", message: "Unknown site" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const siteLabel =
    SOCIAL_SITES.find((s) => s.id === siteId)?.label ?? domain;
  const regionLabel =
    regions.length > 0 ? ` · ${regions.slice(0, 2).join(", ")}${regions.length > 2 ? "…" : ""}` : "";
  const name =
    categoryName?.trim() ||
    `${siteLabel} — ${niche.trim()}${regionLabel}`.slice(0, 120);

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
            regions,
            startPage,
            endPage,
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
