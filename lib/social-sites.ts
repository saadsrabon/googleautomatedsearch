/** Safe for client components — no Puppeteer / server imports. */
export const SOCIAL_SITES = [
  { id: "instagram", label: "Instagram", domain: "instagram.com" },
  { id: "facebook", label: "Facebook", domain: "facebook.com" },
  { id: "linkedin", label: "LinkedIn", domain: "linkedin.com" },
  { id: "twitter", label: "X (Twitter)", domain: "twitter.com" },
  { id: "tiktok", label: "TikTok", domain: "tiktok.com" },
] as const;
