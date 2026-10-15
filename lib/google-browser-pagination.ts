import "server-only";

import type { SerpItem } from "./google-search";
import {
  dismissGoogleConsent,
  googleSearchUrl,
  isGoogleBlocked,
  prepareGooglePage,
  scrapeResultsPage,
  waitForCaptchaVerification,
} from "./google-page-utils";
import {
  captchaWaitTimeoutMs,
  getSearchBrowser,
  shouldWaitForManualCaptcha,
  withBrowserProfileLock,
} from "./puppeteer-config";

async function handleBlockedPage(
  page: Awaited<
    ReturnType<Awaited<ReturnType<typeof getSearchBrowser>>["newPage"]>
  >,
  forceVisible: boolean
): Promise<void> {
  if (!shouldWaitForManualCaptcha()) {
    throw new Error(
      "Google blocked automated search. Verify CAPTCHA first or set CAPTCHA_MANUAL_WAIT=true."
    );
  }

  if (forceVisible) {
    const ok = await waitForCaptchaVerification(page, captchaWaitTimeoutMs());
    if (!ok) {
      throw new Error("CAPTCHA not completed in time.");
    }
    return;
  }

  throw new Error(
    "Google requires CAPTCHA. Click Verify Google CAPTCHA first."
  );
}

export type PageRange = { startPage: number; endPage: number };

export type PageHandler = (
  items: SerpItem[],
  ctx: {
    pageNumber: number;
    startPage: number;
    endPage: number;
  }
) => Promise<void | "stop">;

/** One browser session: paginate Google pages [startPage..endPage] (1-based). */
export async function runGoogleSearchPagination(
  query: string,
  range: PageRange,
  onPage: PageHandler
): Promise<{ totalItems: number; pagesVisited: number }> {
  const startPage = Math.max(1, range.startPage);
  const endPage = Math.max(startPage, range.endPage);
  const pageCount = endPage - startPage + 1;
  return withBrowserProfileLock(async () => {
    const forceVisible = process.env.PUPPETEER_HEADLESS === "false";
    const browser = await getSearchBrowser(forceVisible);
    const seenLinks = new Set<string>();
    let totalItems = 0;
    let pagesVisited = 0;

    const page = await browser.newPage();
    try {
      await prepareGooglePage(page);

      for (let i = 0; i < pageCount; i++) {
        const pageNumber = startPage + i;
        const googleOffset = (pageNumber - 1) * 10;
        const url = googleSearchUrl(query, googleOffset);

        await page.goto(url, {
          waitUntil: "networkidle2",
          timeout: 120_000,
        });

        if (i === 0) {
          await dismissGoogleConsent(page);
        }

        if (await isGoogleBlocked(page)) {
          await handleBlockedPage(page, forceVisible);
        }

        let batch = await scrapeResultsPage(page);
        if (
          batch.length === 0 &&
          i === 0 &&
          (await isGoogleBlocked(page))
        ) {
          await handleBlockedPage(page, forceVisible);
          await page
            .goto(url, { waitUntil: "networkidle2", timeout: 120_000 })
            .catch(() => {});
          batch = await scrapeResultsPage(page);
        }

        if (batch.length === 0) break;

        const unique: SerpItem[] = [];
        for (const item of batch) {
          if (seenLinks.has(item.link)) continue;
          seenLinks.add(item.link);
          unique.push(item);
        }

        if (unique.length === 0) break;

        pagesVisited += 1;
        totalItems += unique.length;

        const stop = await onPage(unique, {
          pageNumber,
          startPage,
          endPage,
        });
        if (stop === "stop") break;
      }

      return { totalItems, pagesVisited };
    } finally {
      await page.close().catch(() => {});
    }
  });
}
