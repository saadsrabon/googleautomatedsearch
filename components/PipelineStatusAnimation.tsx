"use client";

import { cn } from "@/lib/utils";

export type PipelineVisualPhase =
  | "idle"
  | "parsing"
  | "verifying"
  | "running";

const STATUS: Record<PipelineVisualPhase, { title: string; detail: string }> = {
  idle: {
    title: "System ready",
    detail: "Configure a search to begin. Live updates will appear here.",
  },
  parsing: {
    title: "Interpreting your request",
    detail: "Applying the search details from your prompt.",
  },
  verifying: {
    title: "Verifying Google access",
    detail: "Complete CAPTCHA in Chrome if Google requests it.",
  },
  running: {
    title: "Searching Google",
    detail: "Collecting results and formatting leads. Follow the live log below.",
  },
};

const STAGES = ["Request", "Verify", "Search"] as const;

function RadarGraphic() {
  const ticks = Array.from({ length: 60 }, (_, index) => {
    const angle = index * 6;
    const major = index % 5 === 0;
    return (
      <line
        key={angle}
        x1="160"
        y1={major ? "9" : "12"}
        x2="160"
        y2={major ? "21" : "17"}
        transform={`rotate(${angle} 160 160)`}
        stroke="currentColor"
        strokeOpacity={major ? "0.8" : "0.38"}
        strokeWidth={major ? "1.3" : "0.75"}
      />
    );
  });

  return (
    <div className="radar-dial relative mx-auto aspect-square w-full max-w-[340px] overflow-hidden rounded-full border border-cyan-300/25 bg-[#06121b] shadow-[0_0_45px_rgba(34,211,238,0.08)]">
      <div className="radar-sweep pointer-events-none absolute inset-2 z-0 rounded-full" aria-hidden="true" />
      <svg
        className="absolute inset-0 z-10 h-full w-full text-cyan-300/70"
        viewBox="0 0 320 320"
        fill="none"
        aria-hidden="true"
      >
        {ticks}
        {[42, 78, 114, 150].map((radius) => (
          <circle
            key={radius}
            cx="160"
            cy="160"
            r={radius}
            stroke="currentColor"
            strokeOpacity="0.38"
            strokeWidth="0.8"
          />
        ))}
        <path d="M160 10v300M10 160h300" stroke="currentColor" strokeOpacity="0.32" strokeWidth="0.8" />
        <path d="M160 148v24M148 160h24" stroke="currentColor" strokeOpacity="0.85" strokeWidth="1" />
        <circle cx="160" cy="160" r="3" fill="#39e6e6" />
      </svg>
      <span className="radar-contact absolute left-[31%] top-[29%] z-20 h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_10px_#39e6e6]" aria-hidden="true" />
      <span className="radar-contact radar-contact-delay absolute right-[25%] top-[58%] z-20 h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_10px_#39e6e6]" aria-hidden="true" />
      <span className="radar-contact radar-contact-delay-long absolute bottom-[25%] left-[39%] z-20 h-1.5 w-1.5 rounded-full bg-fuchsia-300 shadow-[0_0_10px_#db78f2]" aria-hidden="true" />
      <span className="absolute left-1/2 top-1/2 z-20 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100 bg-cyan-300 shadow-[0_0_15px_rgba(57,230,230,0.8)]" aria-hidden="true" />
    </div>
  );
}

export function PipelineStatusAnimation({
  phase,
  className,
}: {
  phase: PipelineVisualPhase;
  className?: string;
}) {
  const status = STATUS[phase];
  const activeStage = phase === "parsing" ? 0 : phase === "verifying" ? 1 : phase === "running" ? 2 : -1;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#0b1724] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.22)] sm:p-6",
        className
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Search status: ${status.title}. ${status.detail}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_50%,rgba(34,211,238,0.08),transparent_48%),radial-gradient(ellipse_at_100%_0%,rgba(217,70,239,0.05),transparent_32%)]" aria-hidden="true" />
      <div className="relative grid items-center gap-5 sm:grid-cols-[minmax(220px,0.9fr)_minmax(220px,1fr)] sm:gap-8">
        <div className="w-full">
          <RadarGraphic />
        </div>
        <div className="flex min-h-full flex-col justify-center py-1">
          <p className="font-cyber-mono flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-cyan-300">
            <span className={cn("h-2 w-2 rounded-full bg-cyan-300", phase !== "idle" && "animate-pulse shadow-[0_0_10px_#39e6e6]")} aria-hidden="true" />
            {phase === "idle" ? "Radar standby" : "Live search"}
          </p>
          <h2 className="font-cyber-display mt-4 text-2xl font-semibold tracking-wide text-slate-50 sm:text-3xl">
            {status.title}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{status.detail}</p>

          <div className="mt-8 grid grid-cols-3 gap-2" aria-hidden="true">
            {STAGES.map((stage, index) => (
              <div key={stage} className="min-w-0">
                <div className={cn("mb-2 h-px w-full bg-white/10", index === activeStage && "h-[2px] bg-cyan-300 shadow-[0_0_8px_rgba(57,230,230,0.7)]")} />
                <span className={cn("font-cyber-mono text-[10px] uppercase tracking-[0.14em] text-slate-400", index === activeStage && "text-cyan-200")}>
                  {stage}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
