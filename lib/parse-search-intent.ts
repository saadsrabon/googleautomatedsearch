import "server-only";

import { z } from "zod";
import { SOCIAL_SITES } from "./social-sites";
import { DEFAULT_EU_REGIONS, normalizePageRange } from "./search-query";
import { callOpenRouter } from "./openrouter";

const intentSchema = z.object({
  siteId: z
    .string()
    .refine((id) => SOCIAL_SITES.some((s) => s.id === id), "Unknown site"),
  niche: z.string().min(1).max(120),
  regions: z.array(z.string().min(1).max(80)).max(60),
  startPage: z.number().int().min(1).max(50),
  endPage: z.number().int().min(1).max(50),
  categoryName: z.string().min(1).max(120).optional(),
  summary: z.string().min(1).max(500),
});

export type ParsedSearchIntent = z.infer<typeof intentSchema>;

const SYSTEM = `You convert natural-language lead search requests into JSON for a Google scraping app.

Allowed siteId values (pick the closest match): ${SOCIAL_SITES.map((s) => `${s.id} (${s.label})`).join(", ")}.

Rules:
- niche: main profession/keyword (e.g. photographer, dentist)
- regions: array of countries/cities mentioned; if none, use []
- startPage/endPage: from phrases like "page 1 to 5", "pages 1-5", "from 1 to 5"; default 1 and 5
- categoryName: optional short label for the search batch
- summary: one friendly sentence confirming what you understood (for the chat UI)

Return ONLY valid JSON:
{"siteId":"instagram","niche":"photographer","regions":["United Kingdom"],"startPage":1,"endPage":5,"categoryName":"UK photographers","summary":"Searching Instagram for photographers in the United Kingdom, pages 1–5."}`;

function fallbackParse(message: string): ParsedSearchIntent | null {
  const lower = message.toLowerCase();
  let siteId = "instagram";
  for (const s of SOCIAL_SITES) {
    if (lower.includes(s.id) || lower.includes(s.label.toLowerCase())) {
      siteId = s.id;
      break;
    }
  }

  const pageMatch =
    lower.match(/(?:page|pages)\s*(\d+)\s*(?:to|–|-|\.\.)\s*(\d+)/) ??
    lower.match(/from\s*(\d+)\s*(?:to|-)\s*(\d+)/);
  let startPage = 1;
  let endPage = 5;
  if (pageMatch) {
    startPage = Number(pageMatch[1]) || 1;
    endPage = Number(pageMatch[2]) || 5;
  }
  const range = normalizePageRange(startPage, endPage);

  const regions: string[] = [];
  const uk =
    /\b(united kingdom|u\.?k\.?|britain|england)\b/i.test(message);
  if (uk) regions.push("United Kingdom");
  for (const r of DEFAULT_EU_REGIONS) {
    if (message.toLowerCase().includes(r.toLowerCase()) && !regions.includes(r)) {
      regions.push(r);
    }
  }

  const cleaned = message
    .replace(/\b(instagram|facebook|linkedin|tiktok|twitter|x)\b/gi, "")
    .replace(/\b(search|from|pages?|page|to|maybe|united kingdom|u\.?k\.?)\b/gi, "")
    .replace(/\d+\s*(?:to|-)\s*\d+/g, "")
    .trim();

  const nicheMatch = cleaned.match(
    /(?:photographer|dentist|lawyer|designer|coach|trainer|consultant|developer|marketer|[a-z][a-z\s-]{2,40})/i
  );
  const niche = (nicheMatch?.[0] ?? cleaned.split(/\s+/).slice(0, 4).join(" "))
    .trim()
    .slice(0, 120);
  if (!niche) return null;

  const siteLabel = SOCIAL_SITES.find((s) => s.id === siteId)?.label ?? siteId;
  const regionLabel =
    regions.length > 0 ? ` in ${regions.join(", ")}` : "";
  return {
    siteId,
    niche,
    regions,
    startPage: range.startPage,
    endPage: range.endPage,
    summary: `Searching ${siteLabel} for “${niche}”${regionLabel}, pages ${range.startPage}–${range.endPage}.`,
  };
}

export async function parseSearchIntentFromMessage(
  message: string
): Promise<ParsedSearchIntent> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error("Describe what you want to search for.");
  }

  try {
    const content = await callOpenRouter(
      SYSTEM,
      `User request:\n${trimmed}`
    );
    const parsed = JSON.parse(
      content.match(/\{[\s\S]*\}/)?.[0] ?? content
    ) as unknown;
    const result = intentSchema.safeParse(parsed);
    if (result.success) {
      const range = normalizePageRange(result.data.startPage, result.data.endPage);
      return {
        ...result.data,
        niche: result.data.niche.trim(),
        regions: [...new Set(result.data.regions.map((r) => r.trim()).filter(Boolean))],
        startPage: range.startPage,
        endPage: range.endPage,
      };
    }
  } catch {
    /* fall through to heuristic */
  }

  const fallback = fallbackParse(trimmed);
  if (fallback) return fallback;

  throw new Error(
    "Could not understand that request. Try: “Instagram photographer United Kingdom pages 1 to 5”."
  );
}
