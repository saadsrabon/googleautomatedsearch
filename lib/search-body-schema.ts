import { z } from "zod";
import { normalizePageRange } from "./search-query";

export const searchBodySchema = z
  .object({
    siteId: z.string(),
    niche: z.string().min(1).max(120),
    categoryName: z.string().min(1).max(120).optional(),
    regions: z.array(z.string().min(1).max(80)).max(60).optional(),
    startPage: z.number().int().min(1).max(50).optional(),
    endPage: z.number().int().min(1).max(50).optional(),
    /** @deprecated use startPage/endPage */
    maxPages: z.number().int().min(1).max(50).optional(),
  })
  .transform((data) => {
    let startPage = data.startPage ?? 1;
    let endPage = data.endPage ?? data.maxPages ?? 5;
    if (data.maxPages != null && data.startPage == null && data.endPage == null) {
      startPage = 1;
      endPage = data.maxPages;
    }
    const range = normalizePageRange(startPage, endPage);
    return {
      ...data,
      regions: data.regions ?? [],
      startPage: range.startPage,
      endPage: range.endPage,
    };
  });

export type SearchBody = z.infer<typeof searchBodySchema>;
