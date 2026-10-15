import { NextRequest, NextResponse } from "next/server";
import { runLeadSearchPipeline } from "@/lib/lead-pipeline";
import { searchBodySchema } from "@/lib/search-body-schema";
import { siteDomainById, SOCIAL_SITES } from "@/lib/search-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = searchBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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
      return NextResponse.json({ error: "Unknown site" }, { status: 400 });
    }

    const siteLabel =
      SOCIAL_SITES.find((s) => s.id === siteId)?.label ?? domain;
    const name =
      categoryName?.trim() ||
      `${siteLabel} — ${niche.trim()}`.slice(0, 120);

    const outcome = {
      query: "",
      categoryId: "",
      resultCount: 0,
      saved: 0,
      pagesVisited: 0,
      completed: false,
    };

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
      (event) => {
        if (event.type === "done") {
          outcome.query = event.query;
          outcome.categoryId = event.categoryId;
          outcome.resultCount = event.resultCount;
          outcome.saved = event.saved;
          outcome.pagesVisited = event.pagesVisited;
          outcome.completed = true;
        }
      }
    );

    if (!outcome.completed) {
      return NextResponse.json({ error: "Pipeline did not complete" }, { status: 500 });
    }

    if (outcome.saved === 0 && outcome.resultCount === 0) {
      return NextResponse.json({
        ...outcome,
        message: "No results scraped. Verify Google CAPTCHA first.",
      });
    }

    return NextResponse.json(outcome);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
