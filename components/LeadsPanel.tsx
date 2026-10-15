"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "@/lib/use-debounce";
import { SpotlightCard } from "./SpotlightCard";

type Lead = {
  id: string;
  name: string;
  profileLink: string;
  businessName: string;
  email: string;
};

type Category = { id: string; name: string };

type LeadsResponse = {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function LeadsPanel({
  categories,
  filterCategoryId,
  onCategoryChange,
  onExport,
  refreshKey,
}: {
  categories: Category[];
  filterCategoryId: string;
  onCategoryChange: (id: string) => void;
  onExport: () => void;
  refreshKey: number;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LeadsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "15",
      });
      if (filterCategoryId) params.set("categoryId", filterCategoryId);
      if (debouncedSearch) params.set("q", debouncedSearch);
      const res = await fetch(`/api/leads?${params}`);
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [page, filterCategoryId, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [filterCategoryId, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const leads = data?.items ?? [];

  return (
    <SpotlightCard
      title="Leads"
      subtitle="Search with debounce · paginated table"
      className="min-h-[420px]"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, business…"
          className="min-w-[200px] flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm outline-none ring-violet-500/30 focus:ring-2"
        />
        <select
          value={filterCategoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
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
          onClick={onExport}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Export XLSX
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Profile</th>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Email</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && leads.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No leads match your filters.
                </td>
              </tr>
            )}
            {!loading &&
              leads.map((lead) => (
                <tr key={lead.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-800">{lead.name}</td>
                  <td className="px-4 py-3">
                    {lead.profileLink.startsWith("http") ? (
                      <a
                        href={lead.profileLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-violet-600 hover:underline"
                      >
                        Link
                      </a>
                    ) : (
                      lead.profileLink
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{lead.businessName}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{lead.email}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <span>
          {data
            ? `${data.total} total · page ${data.page} of ${data.totalPages}`
            : "—"}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!data || data.page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!data || data.page >= data.totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </SpotlightCard>
  );
}
