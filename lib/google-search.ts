import "server-only";

import { runGoogleSearchPagination } from "./google-browser-pagination";

export type SerpItem = {
  title: string;
  link: string;
  snippet: string;
  /** Full visible text block from Google result — best input for AI. */
  fullText: string;
};

type GoogleCseResponse = {
  items?: Array<{ title?: string; link?: string; snippet?: string }>;
  error?: { message?: string };
};

async function fetchGoogleResultsViaCse(
  query: string,
  maxPages = 3
): Promise<SerpItem[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!apiKey || !cx) {
    throw new Error(
      "Missing GOOGLE_API_KEY or GOOGLE_CSE_ID. Set SEARCH_PROVIDER=browser or add CSE keys."
    );
  }
  const items: SerpItem[] = [];
  const perPage = 10;

  for (let page = 0; page < maxPages; page++) {
    const start = page * perPage + 1;
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("cx", cx);
    url.searchParams.set("q", query);
    url.searchParams.set("start", String(start));

    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    const data = (await res.json()) as GoogleCseResponse;

    if (!res.ok) {
      throw new Error(data.error?.message ?? `Google search failed (${res.status})`);
    }

    const batch = data.items ?? [];
    if (batch.length === 0) break;

    for (const item of batch) {
      const title = item.title ?? "";
      const link = item.link ?? "";
      const snippet = item.snippet ?? "";
      items.push({
        title,
        link,
        snippet,
        fullText: `${title}\n${link}\n${snippet}`,
      });
    }

    if (batch.length < perPage) break;
  }

  return items;
}

export async function fetchGoogleResults(
  query: string,
  maxPages = 3
): Promise<SerpItem[]> {
  const provider = (process.env.SEARCH_PROVIDER ?? "browser").toLowerCase();
  if (provider === "cse") {
    return fetchGoogleResultsViaCse(query, maxPages);
  }

  const all: SerpItem[] = [];
  await runGoogleSearchPagination(query, maxPages, async (items) => {
    all.push(...items);
  });
  return all;
}

export function serpItemToRawText(item: SerpItem): string {
  return `Title: ${item.title}
Link: ${item.link}
Snippet: ${item.snippet}
Full result text:
${item.fullText}`;
}

export function serpItemsToRawText(items: SerpItem[]): string {
  return items
    .map((item, i) => `[${i + 1}] ${serpItemToRawText(item)}`)
    .join("\n\n");
}
