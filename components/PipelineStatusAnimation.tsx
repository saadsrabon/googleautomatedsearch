"use client";

import { cn } from "@/lib/utils";

export type PipelineVisualPhase =
  | "idle"
  | "parsing"
  | "verifying"
  | "running";

const LABELS: Record<Exclude<PipelineVisualPhase, "idle">, string> = {
  parsing: "Understanding your request…",
  verifying: "Opening Google — complete CAPTCHA if shown…",
  running: "Automation running — scraping & formatting leads…",
};

export function PipelineStatusAnimation({
  phase,
  className,
}: {
  phase: PipelineVisualPhase;
  className?: string;
}) {
  if (phase === "idle") return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-5 py-4",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="pipeline-shimmer absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-violet-400/25 to-transparent" />
      </div>
      <div className="relative flex items-center gap-4">
        <div className="relative h-12 w-12 shrink-0">
          <span className="pipeline-pulse absolute inset-0 rounded-full bg-violet-500/20" />
          <span className="pipeline-pulse pipeline-pulse-delay absolute inset-1 rounded-full bg-violet-500/30" />
          <span className="absolute inset-3 rounded-full bg-violet-600 shadow-lg shadow-violet-500/40" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{LABELS[phase]}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Live updates appear in the automation log →
          </p>
        </div>
      </div>
    </div>
  );
}
