"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SOCIAL_SITES } from "@/lib/social-sites";
import {
  buildGoogleQuery,
  DEFAULT_EU_REGIONS,
  parseRegionsInput,
  siteDomainById,
} from "@/lib/search-query";
import { useSearchPipeline, type SearchRunParams } from "@/lib/use-search-pipeline";
import { PageHeader } from "./PageHeader";
import { SpotlightCard } from "./SpotlightCard";
import { SearchChatbot } from "./SearchChatbot";
import {
  PipelineStatusAnimation,
  type PipelineVisualPhase,
} from "./PipelineStatusAnimation";

export function SearchPage() {
  const [siteId, setSiteId] = useState<string>(SOCIAL_SITES[0].id);
  const [niche, setNiche] = useState("");
  const [regionsText, setRegionsText] = useState(DEFAULT_EU_REGIONS.join(", "));
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(5);
  const [categoryName, setCategoryName] = useState("");
  const [autoAfterVerify, setAutoAfterVerify] = useState(true);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);
  const [chatParsing, setChatParsing] = useState(false);

  const {
    loading,
    error,
    setError,
    message,
    progress,
    lastCategoryId,
    runAutomatedPipeline,
  } = useSearchPipeline();

  const regions = useMemo(() => parseRegionsInput(regionsText), [regionsText]);

  const queryPreview = useMemo(() => {
    const domain = siteDomainById(siteId);
    if (!domain || !niche.trim()) return "";
    return buildGoogleQuery(domain, niche, regions);
  }, [siteId, niche, regions]);

  function applyIntentToForm(params: SearchRunParams) {
    setSiteId(params.siteId);
    setNiche(params.niche);
    setRegionsText(
      params.regions.length > 0
        ? params.regions.join(", ")
        : DEFAULT_EU_REGIONS.join(", ")
    );
    setStartPage(params.startPage);
    setEndPage(params.endPage);
    if (params.categoryName) setCategoryName(params.categoryName);
  }

  function formParams(): SearchRunParams {
    return {
      siteId,
      niche,
      regions,
      startPage,
      endPage,
      categoryName: categoryName || undefined,
    };
  }

  async function startFromChat(params: SearchRunParams) {
    try {
      if (autoAfterVerify) {
        setVerifyLoading(true);
        setVerifyStatus(null);
        setError(null);
        const res = await fetch("/api/google/verify", { method: "POST" });
        const data = await res.json();
        setVerifyStatus(data.message ?? (data.verified ? "Verified" : "Failed"));
        if (!data.verified) {
          setError(data.message ?? "Verification failed — complete CAPTCHA in Chrome, then try again.");
          return;
        }
      }
      await runAutomatedPipeline(params);
    } finally {
      setVerifyLoading(false);
    }
  }

  const visualPhase: PipelineVisualPhase = chatParsing
    ? "parsing"
    : loading
      ? "running"
      : verifyLoading
        ? "verifying"
        : "idle";

  async function resetBrowser() {
    setError(null);
    const res = await fetch("/api/google/reset-browser", { method: "POST" });
    const data = await res.json();
    setVerifyStatus(data.message ?? "Browser reset.");
  }

  async function verifyGoogleCaptcha() {
    setVerifyLoading(true);
    setVerifyStatus(null);
    setError(null);
    try {
      const res = await fetch("/api/google/verify", { method: "POST" });
      const data = await res.json();
      setVerifyStatus(data.message ?? (data.verified ? "Verified" : "Failed"));
      if (!data.verified) {
        setError(data.message ?? "Verification failed");
        return;
      }
      if (autoAfterVerify && niche.trim()) {
        await runAutomatedPipeline(formParams());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  }

  const busy = loading || verifyLoading || chatParsing;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 text-slate-100">
      <PageHeader
        eyebrow="Automation"
        title="Search pipeline"
        description="Describe a search in plain English or use the form — scrape, AI format, save to Neon."
        variant="cyber"
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="space-y-4">
          <SearchChatbot
            disabled={busy}
            onParsingChange={setChatParsing}
            onIntentApplied={applyIntentToForm}
            onAutoStart={startFromChat}
          />

          <SpotlightCard
            title="Step 1 — Verify Google"
            subtitle="CAPTCHA once, then automated pagination"
            variant="cyber"
            className="border-amber-400/20 bg-amber-500/[0.04]"
          >
            <label className="mb-3 flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={autoAfterVerify}
                onChange={(e) => setAutoAfterVerify(e.target.checked)}
              />
              Auto-verify before chat / manual run
            </label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={verifyGoogleCaptcha}
                disabled={busy}
                className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {verifyLoading ? "Working…" : "Verify & auto-run"}
              </button>
              <button
                type="button"
                onClick={resetBrowser}
                disabled={busy}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-slate-300"
              >
                Close stuck Chrome
              </button>
            </div>
            {verifyStatus && (
              <p className="mt-3 text-sm text-amber-200">{verifyStatus}</p>
            )}
          </SpotlightCard>

          <SpotlightCard title="Step 2 — Search settings" variant="cyber">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void runAutomatedPipeline(formParams());
              }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">
                  Social site
                </label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#07111c] px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/15"
                >
                  {SOCIAL_SITES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">
                  Niche / keyword
                </label>
                <input
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. Photographer"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#07111c] px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/15"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-400">
                    Countries / cities
                  </label>
                  <button
                    type="button"
                    className="text-xs text-cyan-300 hover:text-cyan-200 hover:underline"
                    onClick={() => setRegionsText(DEFAULT_EU_REGIONS.join(", "))}
                  >
                    Load EU list
                  </button>
                </div>
                <textarea
                  value={regionsText}
                  onChange={(e) => setRegionsText(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-[#07111c] px-3 py-2 text-xs leading-relaxed text-slate-100 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/15"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  {regions.length} location(s) in query
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Start page
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={startPage}
                    onChange={(e) => setStartPage(Number(e.target.value) || 1)}
                    className="w-full rounded-xl border border-white/10 bg-[#07111c] px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/15"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    End page
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={endPage}
                    onChange={(e) => setEndPage(Number(e.target.value) || 1)}
                    className="w-full rounded-xl border border-white/10 bg-[#07111c] px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/15"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">
                  Category name (optional)
                </label>
                <input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#07111c] px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/15"
                />
              </div>

              {queryPreview && (
                <div className="rounded-xl bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-200">
                  {queryPreview}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-[#07111c] hover:bg-cyan-300 disabled:opacity-50"
              >
                {loading ? "Running pipeline…" : "Run automated pipeline"}
              </button>

              {error && (
                <p className="text-sm text-red-300" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <div className="space-y-2">
                  <p className="text-sm text-emerald-300">{message}</p>
                  {lastCategoryId && (
                    <Link
                      href={`/leads?categoryId=${encodeURIComponent(lastCategoryId)}`}
                      className="text-sm font-medium text-cyan-300 hover:text-cyan-200 hover:underline"
                    >
                      View leads from this search →
                    </Link>
                  )}
                </div>
              )}
            </form>
          </SpotlightCard>
        </div>

        <div className="space-y-4">
          <PipelineStatusAnimation phase={visualPhase} />
          <SpotlightCard
            title="Automation log"
            subtitle="Scrape → OpenRouter → save"
            variant="cyber"
            className="flex min-h-[360px] flex-col"
          >
            {loading && (
              <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="log-progress h-full w-1/3 rounded-full bg-cyan-300" />
              </div>
            )}
            <ul className="max-h-[520px] flex-1 overflow-y-auto font-mono text-xs leading-relaxed">
              {progress.length === 0 && (
                <li className="text-slate-500">No activity yet — use the assistant or run the form.</li>
              )}
              {progress.map((line) => (
                <li
                  key={line.id}
                  className={
                    line.tone === "ok"
                      ? "text-emerald-300"
                      : line.tone === "skip"
                        ? "text-slate-500"
                        : line.tone === "err"
                          ? "text-red-300"
                          : "text-slate-300"
                  }
                >
                  {line.text}
                </li>
              ))}
            </ul>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}
