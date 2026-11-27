"use client";

import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  variant?: "default" | "cyber";
};

/** Magic UI–inspired panel (lightweight, no motion dependency). */
export function SpotlightCard({ children, className, title, subtitle, variant = "default" }: Props) {
  const cyber = variant === "cyber";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5 shadow-sm",
        cyber
          ? "border-white/10 bg-[#0b1724] text-slate-100 shadow-[0_14px_40px_rgba(0,0,0,0.18)] before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-cyan-400/[0.06] before:via-transparent before:to-fuchsia-400/[0.04]"
          : "border-slate-200/80 bg-white before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-violet-500/10 before:via-transparent before:to-cyan-500/10 before:opacity-0 before:transition-opacity hover:before:opacity-100",
        className
      )}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h2 className={cn("text-sm font-semibold uppercase tracking-wide", cyber ? "text-cyan-100" : "text-slate-500")}>
              {title}
            </h2>
          )}
          {subtitle && <p className={cn("mt-1 text-xs", cyber ? "text-slate-400" : "text-slate-500")}>{subtitle}</p>}
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
