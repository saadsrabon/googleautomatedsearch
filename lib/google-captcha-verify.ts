import "server-only";

import { buildGoogleQuery } from "./search-query";
import {
  dismissGoogleConsent,
  googleSearchUrl,
  hasGoogleSearchResults,
  isGoogleBlocked,
  prepareGooglePage,
  scrapeResultsPage,
  waitForCaptchaVerification,
} from "./google-page-utils";
import {
  captchaWaitTimeoutMs,
  getSearchBrowser,
  withBrowserProfileLock,
} from "./puppeteer-config";

export type VerifyGoogleResult = {
  verified: boolean;
  message: string;
  sampleResultCount?: number;
  query?: string;
};

/**
 * Opens a visible Chrome window (saved profile), loads Google search,
 * and waits until the user completes CAPTCHA and real results show.
 */
export async function verifyGoogleCaptchaAccess(): Promise<VerifyGoogleResult> {
  return withBrowserProfileLock(async () => {
    const timeoutMs = captchaWaitTimeoutMs();
    const query = buildGoogleQuery("instagram.com", "dentist");
    const url = googleSearchUrl(query);

    const browser = await getSearchBrowser(true);
    const page = await browser.newPage();

    try {
      await prepareGooglePage(page);

      await page.goto(url, { waitUntil: "networkidle2", timeout: 120_000 });
      await dismissGoogleConsent(page);

      let blocked = await isGoogleBlocked(page);
      let hasResults = await hasGoogleSearchResults(page);

      if (!blocked && hasResults) {
        const sample = await scrapeResultsPage(page);
        return {
          verified: true,
          message: "Google access OK — profile already verified.",
          sampleResultCount: sample.length,
          query,
        };
      }

      if (blocked || !hasResults) {
        const ok = await waitForCaptchaVerification(page, timeoutMs);
        if (!ok) {
          return {
            verified: false,
            message: `Timed out after ${Math.round(timeoutMs / 60000)} min. Complete the CAPTCHA in the Chrome window and try again.`,
            query,
          };
        }

        await page
          .goto(url, { waitUntil: "networkidle2", timeout: 120_000 })
          .catch(() => {});
      }

      await page.goto(url, { waitUntil: "networkidle2", timeout: 120_000 }).catch(() => {});
      blocked = await isGoogleBlocked(page);
      if (blocked) {
        return {
          verified: false,
          message:
            "CAPTCHA still blocking after wait. Finish verification in Chrome and click Verify again.",
          query,
        };
      }

      const sample = await scrapeResultsPage(page);
      if (sample.length === 0) {
        return {
          verified: false,
          message:
            "No search results scraped after CAPTCHA. Try Verify again or change query/niche later.",
          query,
        };
      }

      return {
        verified: true,
        message: `Verified — ${sample.length} sample result(s) loaded. You can run lead search now.`,
        sampleResultCount: sample.length,
        query,
      };
    } finally {
      await page.close().catch(() => {});
    }
  });
}
