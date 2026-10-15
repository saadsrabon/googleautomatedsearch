import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "emerald" | "violet" | "slate";
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight",
          accent === "emerald" && "text-emerald-600",
          accent === "violet" && "text-violet-600",
          !accent && "text-slate-900"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
