"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { KpiCard } from "./KpiCard";

const LeadsChart = dynamic(
  () => import("./LeadsChart").then((m) => m.LeadsChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        Loading chart…
      </div>
    ),
  }
);

type Activity = {
  id: string;
  tone: "ok" | "info" | "warn";
  label: string;
  detail: string;
  at: string;
};

type Stats = {
  leadCount: number;
  categoryCount: number;
  avgPerCategory: number;
  chart: { name: string; leads: number }[];
  activity: Activity[];
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function DashboardStats({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, [refreshKey]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total leads"
          value={stats?.leadCount ?? "—"}
          hint="All saved contacts"
          accent="emerald"
        />
        <KpiCard
          label="Search runs"
          value={stats?.categoryCount ?? "—"}
          hint="Categories in DB"
        />
        <KpiCard
          label="Avg leads / run"
          value={stats?.avgPerCategory ?? "—"}
          hint="Yield per category"
          accent="violet"
        />
        <KpiCard
          label="Pipeline"
          value="Ready"
          hint="Open Search to automate"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Leads by category</h3>
              <p className="text-xs text-slate-500">Recent search performance</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live data
            </span>
          </div>
          <LeadsChart data={stats?.chart ?? []} />
        </div>

        <div className="flex max-h-[360px] flex-col rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Activity stream</h3>
            <p className="text-xs text-slate-500">Latest saves & search runs</p>
          </div>
          <ul className="flex-1 overflow-y-auto divide-y divide-slate-50 px-2 py-1">
            {(stats?.activity ?? []).length === 0 && (
              <li className="px-2 py-8 text-center text-xs text-slate-500">
                No activity yet.
              </li>
            )}
            {stats?.activity.map((row) => (
              <li key={row.id} className="px-2 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={
                      row.tone === "ok"
                        ? "rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-700"
                        : "rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600"
                    }
                  >
                    {row.label}
                  </span>
                  <time className="font-mono text-[10px] text-slate-400">
                    {formatTime(row.at)}
                  </time>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-slate-700">{row.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
