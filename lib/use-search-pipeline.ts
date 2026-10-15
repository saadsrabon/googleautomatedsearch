"use client";

import { useRef, useState } from "react";

export type ProgressLine = {
  id: number;
  text: string;
  tone: "info" | "ok" | "skip" | "err";
};

export type SearchRunParams = {
  siteId: string;
  niche: string;
  regions: string[];
  startPage: number;
  endPage: number;
  categoryName?: string;
};

export function useSearchPipeline() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressLine[]>([]);
  const [lastCategoryId, setLastCategoryId] = useState<string | null>(null);
  const progressId = useRef(0);

  function pushProgress(text: string, tone: ProgressLine["tone"] = "info") {
    progressId.current += 1;
    setProgress((prev) => [...prev.slice(-100), { id: progressId.current, text, tone }]);
  }

  function clearProgress() {
    setProgress([]);
  }

  async function consumeSearchStream(res: Response) {
    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        (err as { message?: string; error?: string }).message ??
          (err as { error?: string }).error ??
          "Automation failed"
      );
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line) as Record<string, unknown>;
        const type = String(event.type);

        switch (type) {
          case "started":
            pushProgress(String(event.query ?? "Started"), "info");
            if (event.categoryId) setLastCategoryId(String(event.categoryId));
            break;
          case "page_start":
            pushProgress(
              `Google page ${event.page} (${event.startPage}–${event.endPage}) · ${event.itemCount} hits`,
              "info"
            );
            break;
          case "item_start":
            pushProgress(`Scraped: ${event.title}`, "info");
            break;
          case "item_ai":
            if (event.status === "formatting") {
              pushProgress(`OpenRouter formatting #${event.index}…`, "info");
            }
            break;
          case "item_saved":
            pushProgress(`Saved: ${event.name} (${event.email})`, "ok");
            break;
          case "item_skipped":
            pushProgress(`Skipped: ${event.reason}`, "skip");
            break;
          case "page_done":
            pushProgress(
              `Page ${event.page} done · saved ${event.saved} on page`,
              "info"
            );
            break;
          case "done":
            setMessage(
              `Done — ${event.saved} leads from ${event.resultCount} results (${event.pagesVisited} pages).`
            );
            break;
          case "error":
            pushProgress(String(event.message ?? "Error"), "err");
            setError(String(event.message ?? "Pipeline error"));
            break;
          default:
            break;
        }
      }
    }
  }

  async function runAutomatedPipeline(params: SearchRunParams) {
    if (!params.niche.trim()) {
      setError("Enter a niche / keyword before running.");
      return;
    }
    if (params.endPage < params.startPage) {
      setError("End page must be ≥ start page.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    setProgress([]);

    try {
      const res = await fetch("/api/search/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: params.siteId,
          niche: params.niche,
          categoryName: params.categoryName || undefined,
          regions: params.regions,
          startPage: params.startPage,
          endPage: params.endPage,
        }),
      });
      await consumeSearchStream(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Automation failed");
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    setError,
    message,
    progress,
    lastCategoryId,
    pushProgress,
    clearProgress,
    runAutomatedPipeline,
  };
}
