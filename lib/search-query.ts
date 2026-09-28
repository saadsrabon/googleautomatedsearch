import { SOCIAL_SITES } from "./social-sites";

export { SOCIAL_SITES };

const EMAIL_OR_CLAUSE =
  '+"@gmail.com" OR "@yahoo.com" OR "@hotmail.com" OR "@outlook.com" OR "@aol.com" OR "@icloud.com" OR "@me.com" OR "@live.com" OR "@yahoo.co.uk" OR "@hotmail.fr" OR "@msn.com"';

export function buildGoogleQuery(siteDomain: string, niche: string): string {
  const trimmed = niche.trim();
  return `site:${siteDomain} "${trimmed}" ${EMAIL_OR_CLAUSE}`;
}

export function siteDomainById(siteId: string): string | undefined {
  return SOCIAL_SITES.find((s) => s.id === siteId)?.domain;
}
