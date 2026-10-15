"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LeadsPanel } from "./LeadsPanel";
import { PageHeader } from "./PageHeader";

type Category = { id: string; name: string };

export function AllLeadsPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("categoryId") ?? "";
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCategoryId, setFilterCategoryId] = useState(initialCategory);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(
      data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))
    );
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setFilterCategoryId(initialCategory);
  }, [initialCategory]);

  function exportXlsx() {
    const q = filterCategoryId
      ? `?categoryId=${encodeURIComponent(filterCategoryId)}`
      : "";
    window.location.href = `/api/leads/export${q}`;
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <PageHeader
        eyebrow="Database"
        title="All leads"
        description="Debounced search and pagination across every saved contact."
      />

      <LeadsPanel
        categories={categories}
        filterCategoryId={filterCategoryId}
        onCategoryChange={setFilterCategoryId}
        onExport={exportXlsx}
        refreshKey={refreshKey}
      />

      <button
        type="button"
        onClick={() => setRefreshKey((k) => k + 1)}
        className="text-sm text-violet-600 hover:underline"
      >
        Refresh table
      </button>
    </div>
  );
}
