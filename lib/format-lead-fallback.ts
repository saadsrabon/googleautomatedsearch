import type { SerpItem } from "./google-search";
import { extractEmailsFromText } from "./email-extract";
import type { ExtractedLead } from "./openrouter";

/** Deterministic formatting when AI fails but scrape contains an email. */
export function formatLeadFromScrape(item: SerpItem): ExtractedLead | null {
  const blob = item.fullText || `${item.title}\n${item.link}\n${item.snippet}`;
  const emails = extractEmailsFromText(blob);
  if (emails.length === 0) return null;

  const profileLink =
    item.link.includes("instagram.com") ? item.link : item.link;

  let name = "not found";
  const drMatch = blob.match(/(?:Dr\.?|Doctor)\s+([A-Za-z][A-Za-z\s.'-]{2,40})/i);
  if (drMatch) name = drMatch[1].trim();
  else if (item.title && !item.title.includes("Instagram")) {
    name = item.title.split("·")[0].trim().slice(0, 80);
  }

  let businessName = "not found";
  const handleMatch = profileLink.match(/instagram\.com\/([^/?#]+)/i);
  if (handleMatch) {
    businessName = handleMatch[1].replace(/_/g, " ");
  }

  return {
    name,
    profileLink,
    businessName,
    email: emails[0],
  };
}
