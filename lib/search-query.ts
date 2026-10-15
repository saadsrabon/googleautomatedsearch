import { SOCIAL_SITES } from "./social-sites";

export { SOCIAL_SITES };

export const EMAIL_DOMAIN_SUFFIXES = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "live.com",
  "msn.com",
  "protonmail.com",
  "proton.me",
  "gmx.com",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "mail.ru",
  "web.de",
  "orange.fr",
  "rediffmail.com",
] as const;

export const DEFAULT_EU_REGIONS = [
  "United Kingdom",
  "Ireland",
  "France",
  "Germany",
  "Netherlands",
  "Belgium",
  "Luxembourg",
  "Switzerland",
  "Austria",
  "Spain",
  "Portugal",
  "Italy",
  "Greece",
  "Malta",
  "Cyprus",
  "Croatia",
  "Slovenia",
  "Denmark",
  "Sweden",
  "Norway",
  "Finland",
  "Iceland",
  "Poland",
  "Czech Republic",
  "Slovakia",
  "Hungary",
  "Romania",
  "Bulgaria",
  "Serbia",
  "Bosnia",
  "Montenegro",
  "Albania",
  "North Macedonia",
  "Moldova",
  "Ukraine",
  "Estonia",
  "Latvia",
  "Lithuania",
] as const;

export function parseRegionsInput(raw: string): string[] {
  const parts = raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set(parts)];
}

function orQuoted(values: string[]): string {
  return `(${values.map((v) => `"${v.replace(/"/g, "")}"`).join(" OR ")})`;
}

function buildEmailClause(): string {
  const tokens = EMAIL_DOMAIN_SUFFIXES.map((d) => `"@${d}"`);
  return `(${tokens.join(" OR ")})`;
}

export function buildGoogleQuery(
  siteDomain: string,
  niche: string,
  regions: string[] = []
): string {
  const trimmed = niche.trim();
  const emailPart = buildEmailClause();
  const regionPart =
    regions.length > 0 ? ` ${orQuoted(regions)}` : "";
  return `site:${siteDomain} "${trimmed}" ${emailPart}${regionPart}`;
}

export function siteDomainById(siteId: string): string | undefined {
  return SOCIAL_SITES.find((s) => s.id === siteId)?.domain;
}

export function normalizePageRange(startPage: number, endPage: number) {
  const start = Math.min(Math.max(1, startPage), 50);
  const end = Math.min(Math.max(start, endPage), 50);
  return { startPage: start, endPage: end };
}
