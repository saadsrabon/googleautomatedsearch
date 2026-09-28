import type { Browser } from "puppeteer";
import type { SerpItem } from "./google-search";
import { USER_AGENT } from "./puppeteer-config";

export type GooglePage = Awaited<ReturnType<Browser["newPage"]>>;

export async function prepareGooglePage(page: GooglePage) {
  await page.setUserAgent(USER_AGENT);
  if (!page.viewport()) {
    await page.setViewport({ width: 1366, height: 900 });
  }
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
}

export async function dismissGoogleConsent(page: GooglePage) {
  const selectors = ["#L2AGLb", 'button[aria-label="Accept all"]'];
  for (const sel of selectors) {
    try {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        await page
          .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 5000 })
          .catch(() => {});
        break;
      }
    } catch {
      /* no consent dialog */
    }
  }
}

export async function isGoogleBlocked(
  page: GooglePage,
  delayMs = 800
): Promise<boolean> {
  if (delayMs > 0) {
    await new Promise((r) => setTimeout(r, delayMs));
  }
  const currentUrl = page.url();
  if (currentUrl.includes("/sorry") || currentUrl.includes("google.com/sorry")) {
    return true;
  }
  return page.evaluate(() => {
    const body = (document.body?.innerText ?? "").toLowerCase();
    return (
      body.includes("unusual traffic") ||
      body.includes("about this page") ||
      body.includes("not a robot") ||
      body.includes("verify you're not a robot")
    );
  });
}

export async function hasGoogleSearchResults(page: GooglePage): Promise<boolean> {
  return page.evaluate(() => {
    const rso = document.querySelectorAll("#rso h3, div#search h3, main a h3");
    return rso.length > 0;
  });
}

export async function waitForCaptchaVerification(
  page: GooglePage,
  timeoutMs: number
): Promise<boolean> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const blocked = await isGoogleBlocked(page, 0);
    const hasResults = await hasGoogleSearchResults(page);

    if (!blocked && hasResults) {
      return true;
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  return false;
}

export async function scrapeResultsPage(page: GooglePage): Promise<SerpItem[]> {
  await page
    .waitForSelector("#rso, div#search, a h3", { timeout: 20000 })
    .catch(() => {});

  return page.evaluate(() => {
    type Row = {
      title: string;
      link: string;
      snippet: string;
      fullText: string;
    };
    const items: Row[] = [];
    const skip = (href: string) =>
      !href ||
      href.includes("google.com/search") ||
      href.includes("webcache") ||
      href.includes("accounts.google") ||
      href.startsWith("https://www.google.com/url?");

    const push = (row: Row) => {
      if (skip(row.link)) return;
      items.push(row);
    };

    const roots = document.querySelectorAll(
      "#rso div.MjjYud, #rso div.g, #search div.MjjYud, #search div.g"
    );

    roots.forEach((block) => {
      const heading =
        block.querySelector("h3") ??
        block.querySelector('[role="heading"]');
      const anchor =
        heading?.closest("a") ??
        block.querySelector('a[href*="instagram.com"]') ??
        block.querySelector("a[href^='http']");
      if (!heading || !anchor) return;

      const link = (anchor as HTMLAnchorElement).href ?? "";
      const title = heading.textContent?.trim() ?? "";
      const fullText = (block as HTMLElement).innerText?.trim() ?? "";
      const snippet =
        block.querySelector(".VwiC3b, .MUxGbd, .IsZvec, .yXK7lf")?.textContent?.trim() ??
        fullText.replace(title, "").trim();

      push({ title, link, snippet, fullText: fullText || `${title}\n${link}\n${snippet}` });
    });

    if (items.length === 0) {
      document.querySelectorAll("#rso a h3, #search a h3, main a h3").forEach((heading) => {
        const anchor = heading.closest("a");
        if (!anchor) return;
        const link = anchor.href ?? "";
        const title = heading.textContent?.trim() ?? "";
        let block: HTMLElement | null = anchor.closest("div");
        for (let i = 0; i < 6 && block; i++) {
          if ((block.innerText?.length ?? 0) > title.length + 20) break;
          block = block.parentElement;
        }
        const fullText = block?.innerText?.trim() ?? `${title}\n${link}`;
        const snippet =
          block?.querySelector(".VwiC3b, .MUxGbd, .IsZvec")?.textContent?.trim() ??
          fullText;
        push({ title, link, snippet, fullText });
      });
    }

    const seen = new Set<string>();
    return items.filter((item) => {
      if (!item.link || seen.has(item.link)) return false;
      seen.add(item.link);
      return true;
    });
  });
}

export function googleSearchUrl(query: string, start = 0): string {
  const url = new URL("https://www.google.com/search");
  url.searchParams.set("q", query);
  url.searchParams.set("num", "10");
  url.searchParams.set("hl", "en");
  if (start > 0) url.searchParams.set("start", String(start));
  return url.toString();
}
