"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SOCIAL_SITES } from "@/lib/social-sites";

type Category = {
  id: string;
  name: string;
  site: string;
  niche: string;
  createdAt: string;
  _count: { leads: number };
};

type Lead = {
  id: string;
  name: string;
  profileLink: string;
  businessName: string;
  email: string;
  sourceSite: string;
  niche: string;
  category: { name: string } | null;
};

type ProgressLine = { id: number; text: string; tone: "info" | "ok" | "skip" | "err" };

export function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [siteId, setSiteId] = useState<string>(SOCIAL_SITES[0].id);
  const [niche, setNiche] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [maxPages, setMaxPages] = useState(5);
  const [autoAfterVerify, setAutoAfterVerify] = useState(true);
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressLine[]>([]);
  const progressId = useRef(0);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
  }, []);

  const loadLeads = useCallback(async (categoryId: string) => {
    const q = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : "";
    const res = await fetch(`/api/leads${q}`);
    setLeads(await res.json());
  }, []);

  useEffect(() => {
    loadCategories();
    loadLeads("");
  }, [loadCategories, loadLeads]);

  useEffect(() => {
    loadLeads(filterCategoryId);
  }, [filterCategoryId, loadLeads]);

  function pushProgress(text: string, tone: ProgressLine["tone"] = "info") {
    progressId.current += 1;
    setProgress((prev) => [
      ...prev.slice(-80),
      { id: progressId.current, text, tone },
    ]);
  }

  async function runAutomatedPipeline() {
    if (!niche.trim()) {
      setError("Enter a niche before running automation.");
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
          siteId,
          niche,
          categoryName: categoryName || undefined,
          maxPages,
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? err.error ?? "Automation failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let activeCategoryId = filterCategoryId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as {
            type: string;
            query?: string;
            categoryId?: string;
            page?: number;
            maxPages?: number;
            itemCount?: number;
            index?: number;
            title?: string;
            email?: string;
            name?: string;
            reason?: string;
            saved?: number;
            resultCount?: number;
            pagesVisited?: number;
            message?: string;
            status?: string;
          };

          switch (event.type) {
            case "started":
              pushProgress(`Started: ${event.query}`, "info");
              if (event.categoryId) activeCategoryId = event.categoryId;
              setFilterCategoryId(event.categoryId ?? "");
              break;
            case "page_start":
              pushProgress(
                `Page ${event.page}/${event.maxPages} — ${event.itemCount} result(s)`,
                "info"
              );
              break;
            case "item_start":
              pushProgress(
                `Scraped ${event.index} on page ${event.page}: ${event.title}`,
                "info"
              );
              break;
            case "item_ai":
              if (event.status === "formatting") {
                pushProgress(
                  `OpenRouter formatting item ${event.index} on page ${event.page}…`,
                  "info"
                );
              }
              break;
            case "item_saved":
              pushProgress(
                `Saved: ${event.name} (${event.email})`,
                "ok"
              );
              if (activeCategoryId) loadLeads(activeCategoryId);
              break;
            case "item_skipped":
              pushProgress(
                `Skipped #${event.index}: ${event.reason}`,
                "skip"
              );
              break;
            case "page_done":
              pushProgress(
                `Page ${event.page} done — saved ${event.saved} on this page`,
                "info"
              );
              break;
            case "done":
              setMessage(
                `Done — ${event.saved} lead(s) saved from ${event.resultCount} result(s), ${event.pagesVisited} page(s).`
              );
              pushProgress(
                `Finished — ${event.saved} leads, ${event.pagesVisited} pages`,
                "ok"
              );
              break;
            case "error":
              pushProgress(event.message ?? "Error", "err");
              setError(event.message ?? "Pipeline error");
              break;
            default:
              break;
          }
        }
      }

      await loadCategories();
      if (activeCategoryId) await loadLeads(activeCategoryId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Automation failed");
    } finally {
      setLoading(false);
    }
  }

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    await runAutomatedPipeline();
  }

  async function resetBrowser() {
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/google/reset-browser", { method: "POST" });
      const data = await res.json();
      setMessage(data.message ?? "Browser reset.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    }
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
        setError(data.message ?? "Google verification failed");
        return;
      }
      if (autoAfterVerify && niche.trim()) {
        pushProgress("CAPTCHA verified — starting automated pipeline…", "ok");
        await runAutomatedPipeline();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  }

  function exportXlsx() {
    const q = filterCategoryId
      ? `?categoryId=${encodeURIComponent(filterCategoryId)}`
      : "";
    window.location.href = `/api/leads/export${q}`;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Lead Search</h1>
            <p className="text-sm text-ink-muted">
              Verify → auto paginate Google → AI each result → save leads
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[340px_1fr]">
        <section className="space-y-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-900">
              Step 1 — Verify Google CAPTCHA
            </h2>
            <p className="mb-4 text-sm text-amber-950/80">
              Opens Chrome. After you solve CAPTCHA, automation can paginate and
              send each hit to OpenRouter one by one.
            </p>
            <label className="mb-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoAfterVerify}
                onChange={(e) => setAutoAfterVerify(e.target.checked)}
              />
              Auto-run search after verify (needs niche filled)
            </label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={verifyGoogleCaptcha}
                disabled={verifyLoading || loading}
                className="w-full rounded-lg border border-amber-400 bg-white px-4 py-2.5 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-60"
              >
                {verifyLoading
                  ? "Waiting for CAPTCHA / running pipeline…"
                  : "Verify & auto-run"}
              </button>
              <button
                type="button"
                onClick={resetBrowser}
                disabled={verifyLoading || loading}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Close stuck Chrome & retry
              </button>
            </div>
            {verifyStatus && (
              <p
                className={`mt-3 text-sm ${verifyStatus.includes("Verified") ? "text-emerald-800" : "text-amber-900"}`}
              >
                {verifyStatus}
              </p>
            )}
          </div>

          <form
            onSubmit={runSearch}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Step 2 — Search settings
            </h2>

            <label className="mb-3 block text-sm font-medium">Social site</label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {SOCIAL_SITES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>

            <label className="mb-3 block text-sm font-medium">Niche / keyword</label>
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder='e.g. dentist'
              required
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />

            <label className="mb-3 block text-sm font-medium">Max Google pages</label>
            <input
              type="number"
              min={1}
              max={10}
              value={maxPages}
              onChange={(e) => setMaxPages(Number(e.target.value) || 5)}
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />

            <label className="mb-3 block text-sm font-medium">
              Category name (optional)
            </label>
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Auto-generated if empty"
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />

            <button
              type="submit"
              disabled={loading || verifyLoading}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Automating pagination + AI…" : "Run automated pipeline"}
            </button>

            {error && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="mt-3 text-sm text-emerald-700">{message}</p>
            )}
          </form>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Lead categories
            </h2>
            <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
              {categories.length === 0 && (
                <li className="text-ink-muted">No categories yet.</li>
              )}
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setFilterCategoryId(c.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left transition ${
                      filterCategoryId === c.id
                        ? "bg-accent-soft text-accent"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="mt-0.5 block text-xs text-ink-muted">
                      {c.site} · {c.niche} · {c._count.leads} leads
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold">Automation log</h2>
              <p className="text-xs text-ink-muted">
                Live: each page → each result → OpenRouter → DB
              </p>
            </div>
            <ul className="max-h-48 overflow-y-auto px-5 py-3 font-mono text-xs">
              {progress.length === 0 && (
                <li className="text-ink-muted">No activity yet.</li>
              )}
              {progress.map((line) => (
                <li
                  key={line.id}
                  className={
                    line.tone === "ok"
                      ? "text-emerald-700"
                      : line.tone === "skip"
                        ? "text-slate-500"
                        : line.tone === "err"
                          ? "text-red-600"
                          : "text-slate-700"
                  }
                >
                  {line.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold">Leads</h2>
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterCategoryId}
                  onChange={(e) => setFilterCategoryId(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={exportXlsx}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
                >
                  Export XLSX
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Profile</th>
                    <th className="px-4 py-3">Business</th>
                    <th className="px-4 py-3">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                        Leads appear here as each row is saved.
                      </td>
                    </tr>
                  )}
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">{lead.name}</td>
                      <td className="px-4 py-3">
                        {lead.profileLink.startsWith("http") ? (
                          <a
                            href={lead.profileLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent hover:underline"
                          >
                            Link
                          </a>
                        ) : (
                          lead.profileLink
                        )}
                      </td>
                      <td className="px-4 py-3">{lead.businessName}</td>
                      <td className="px-4 py-3 font-medium">{lead.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
