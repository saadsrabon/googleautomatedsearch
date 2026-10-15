"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DashboardStats } from "./DashboardStats";

type Category = {
  id: string;
  name: string;
  site: string;
  niche: string;
  regions: string | null;
  _count: { leads: number };
};

export function DashboardHome() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
            Analytics
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Lead operations
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Real-time view of saved leads and search categories — inspired by ops dashboards.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/search"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            New search
          </Link>
          <Link
            href="/leads"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            All leads
          </Link>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <DashboardStats refreshKey={refreshKey} />

      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Categories by volume</h2>
          <p className="text-xs text-slate-500">Click a row to open filtered leads</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Site</th>
                <th className="px-5 py-3 font-medium">Niche</th>
                <th className="px-5 py-3 text-right font-medium">Leads</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                    No data yet.{" "}
                    <Link href="/search" className="text-emerald-600 hover:underline">
                      Start a search
                    </Link>
                  </td>
                </tr>
              )}
              {categories.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-slate-100 transition hover:bg-slate-50/80"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/leads?categoryId=${encodeURIComponent(c.id)}`}
                      className="font-medium text-slate-900 hover:text-emerald-700"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{c.site}</td>
                  <td className="px-5 py-3 text-slate-600">{c.niche}</td>
                  <td className="px-5 py-3 text-right font-mono font-semibold tabular-nums text-emerald-700">
                    {c._count.leads}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
