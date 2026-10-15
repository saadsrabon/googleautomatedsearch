"use client";

import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
};

/** Magic UI–inspired panel (lightweight, no motion dependency). */
export function SpotlightCard({ children, className, title, subtitle }: Props) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-violet-500/10 before:via-transparent before:to-cyan-500/10 before:opacity-0 before:transition-opacity hover:before:opacity-100",
        className
      )}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {title}
            </h2>
          )}
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
