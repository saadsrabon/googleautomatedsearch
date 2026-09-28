import "server-only";

import { z } from "zod";
import type { SerpItem } from "./google-search";
import { serpItemToRawText } from "./google-search";
import { extractEmailsFromText } from "./email-extract";

const leadRowSchema = z.object({
  name: z.string(),
  profileLink: z.string(),
  businessName: z.string(),
  email: z.string(),
});

const extractionSchema = z.object({
  leads: z.array(leadRowSchema),
});

const singleLeadSchema = z.object({
  lead: leadRowSchema.nullable(),
});

export type ExtractedLead = z.infer<typeof leadRowSchema>;

const SINGLE_SYSTEM_PROMPT = `You format ONE lead from a Google search result (usually Instagram).
Return ONLY valid JSON:
{"lead":{"name":"...","profileLink":"...","businessName":"...","email":"..."}}

Column rules (match exactly):
- name: person's name if present (e.g. "Dr. Anyelina Fermin"), else "not found"
- profileLink: Instagram profile URL from Link or text (https://www.instagram.com/...)
- businessName: clinic/practice/brand name from title or snippet, else "not found"
- email: exact email from text only

If no valid email exists, return {"lead":null}.
Never invent emails or URLs.`;

function isValidEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  return e !== "not found" && e.includes("@") && e.includes(".");
}

function normalizeLead(item: SerpItem, lead: ExtractedLead): ExtractedLead {
  let profileLink = lead.profileLink.trim();
  if (profileLink === "not found" || !profileLink.startsWith("http")) {
    profileLink = item.link.startsWith("http") ? item.link : "not found";
  }

  const blob = item.fullText || serpItemToRawText(item);
  const emails = extractEmailsFromText(blob);
  let email = lead.email.trim();
  if (!isValidEmail(email) && emails[0]) {
    email = emails[0];
  }

  return {
    name: lead.name.trim() || "not found",
    profileLink,
    businessName: lead.businessName.trim() || "not found",
    email,
  };
}

async function callOpenRouter(
  system: string,
  user: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model =
    process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.2-3b-instruct:free";

  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY. See .env.example.");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
      "X-Title": "Lead Search App",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });

  const data = (await res.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!res.ok) {
    throw new Error(data.error?.message ?? `OpenRouter failed (${res.status})`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned empty content");
  }

  return content;
}

function parseJsonContent(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not parse JSON from model response");
    return JSON.parse(match[0]);
  }
}

/** Scrape row → OpenRouter → formatted lead (or null if no email). */
export async function extractLeadFromSerpItem(
  item: SerpItem
): Promise<ExtractedLead | null> {
  const hints = extractEmailsFromText(item.fullText || item.snippet);
  const hintLine =
    hints.length > 0 ? `\nDetected emails in text: ${hints.join(", ")}` : "";

  const content = await callOpenRouter(
    SINGLE_SYSTEM_PROMPT,
    `Format this scraped Google result into the lead JSON.${hintLine}

${serpItemToRawText(item)}`
  );

  const parsed = parseJsonContent(content);
  const result = singleLeadSchema.safeParse(parsed);
  if (!result.success) {
    const batch = extractionSchema.safeParse(parsed);
    if (batch.success && batch.data.leads[0]) {
      const row = normalizeLead(item, batch.data.leads[0]);
      return isValidEmail(row.email) ? row : null;
    }
    throw new Error("Model JSON did not match single-lead schema");
  }

  const lead = result.data.lead;
  if (!lead) return null;

  const normalized = normalizeLead(item, lead);
  return isValidEmail(normalized.email) ? normalized : null;
}
