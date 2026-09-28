import "server-only";

import { ensureDbConnection, prisma } from "./prisma";
import { runGoogleSearchPagination } from "./google-browser-pagination";
import { formatLeadFromScrape } from "./format-lead-fallback";
import {
  extractLeadFromSerpItem,
  type ExtractedLead,
} from "./openrouter";
import { buildGoogleQuery } from "./search-query";

export type PipelineEvent =
  | { type: "started"; query: string; categoryId: string; maxPages: number }
  | { type: "page_start"; page: number; maxPages: number; itemCount: number }
  | { type: "item_start"; page: number; index: number; title: string }
  | { type: "item_ai"; page: number; index: number; status: "formatting" | "saved" | "skipped" }
  | { type: "item_saved"; page: number; index: number; email: string; name: string }
  | { type: "item_skipped"; page: number; index: number; reason: string }
  | { type: "page_done"; page: number; processed: number; saved: number }
  | {
      type: "done";
      query: string;
      categoryId: string;
      resultCount: number;
      saved: number;
      pagesVisited: number;
    }
  | { type: "error"; message: string };

export type PipelineInput = {
  siteId: string;
  niche: string;
  domain: string;
  categoryName: string;
  maxPages: number;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function formatLeadForDb(
  item: Parameters<typeof extractLeadFromSerpItem>[0]
): Promise<ExtractedLead | null> {
  try {
    const aiLead = await extractLeadFromSerpItem(item);
    if (aiLead) return aiLead;
  } catch {
    /* fallback below */
  }
  return formatLeadFromScrape(item);
}

export async function runLeadSearchPipeline(
  input: PipelineInput,
  emit: (event: PipelineEvent) => void
): Promise<void> {
  const { niche, domain, categoryName, maxPages } = input;
  const query = buildGoogleQuery(domain, niche.trim());

  await ensureDbConnection();

  const category = await prisma.leadCategory.create({
    data: {
      name: categoryName,
      site: domain,
      niche: niche.trim(),
    },
  });

  emit({
    type: "started",
    query,
    categoryId: category.id,
    maxPages,
  });

  const savedEmails = new Set<string>();
  let savedCount = 0;
  let resultCount = 0;

  const aiDelayMs = Number.parseInt(
    process.env.AI_ITEM_DELAY_MS ?? "400",
    10
  );

  try {
    const { totalItems, pagesVisited } = await runGoogleSearchPagination(
      query,
      maxPages,
      async (items, { pageIndex, maxPages: maxP }) => {
        emit({
          type: "page_start",
          page: pageIndex + 1,
          maxPages: maxP,
          itemCount: items.length,
        });

        let savedOnPage = 0;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          resultCount += 1;

          emit({
            type: "item_start",
            page: pageIndex + 1,
            index: i + 1,
            title: item.title || item.link,
          });

          emit({
            type: "item_ai",
            page: pageIndex + 1,
            index: i + 1,
            status: "formatting",
          });

          let lead: ExtractedLead | null = null;
          try {
            lead = await formatLeadForDb(item);
          } catch (e) {
            emit({
              type: "item_skipped",
              page: pageIndex + 1,
              index: i + 1,
              reason:
                e instanceof Error ? e.message : "AI formatting failed",
            });
            await sleep(aiDelayMs);
            continue;
          }

          if (!lead) {
            emit({
              type: "item_skipped",
              page: pageIndex + 1,
              index: i + 1,
              reason: "No email after scrape + AI format",
            });
            await sleep(aiDelayMs);
            continue;
          }

          const emailKey = lead.email.trim().toLowerCase();
          if (savedEmails.has(emailKey)) {
            emit({
              type: "item_skipped",
              page: pageIndex + 1,
              index: i + 1,
              reason: "Duplicate email",
            });
            await sleep(aiDelayMs);
            continue;
          }

          await prisma.lead.create({
            data: {
              name: lead.name,
              profileLink: lead.profileLink,
              businessName: lead.businessName,
              email: lead.email,
              sourceSite: domain,
              niche: niche.trim(),
              categoryId: category.id,
            },
          });

          savedEmails.add(emailKey);
          savedCount += 1;
          savedOnPage += 1;

          emit({
            type: "item_ai",
            page: pageIndex + 1,
            index: i + 1,
            status: "saved",
          });

          emit({
            type: "item_saved",
            page: pageIndex + 1,
            index: i + 1,
            email: lead.email,
            name: lead.name,
          });

          await sleep(aiDelayMs);
        }

        emit({
          type: "page_done",
          page: pageIndex + 1,
          processed: items.length,
          saved: savedOnPage,
        });
      }
    );

    if (totalItems === 0) {
      emit({
        type: "error",
        message:
          "No Google results scraped. Verify CAPTCHA, close stuck Chrome, and try again.",
      });
    }

    emit({
      type: "done",
      query,
      categoryId: category.id,
      resultCount,
      saved: savedCount,
      pagesVisited,
    });
  } catch (e) {
    emit({
      type: "error",
      message: e instanceof Error ? e.message : "Pipeline failed",
    });
    emit({
      type: "done",
      query,
      categoryId: category.id,
      resultCount,
      saved: savedCount,
      pagesVisited: 0,
    });
  }
}
