"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "lead-search-sidebar-collapsed";

const NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    desc: "Overview & KPIs",
    icon: DashboardIcon,
  },
  {
    href: "/search",
    label: "Search",
    desc: "Run pipeline",
    icon: SearchIcon,
  },
  {
    href: "/leads",
    label: "All leads",
    desc: "Browse & export",
    icon: LeadsIcon,
  },
] as const;

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 4h7v9H4V4zm9 0h7v5h-7V4zM4 15h7v5H4v-5zm9 3h7v2h-7v-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M11 8v6M8 11h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

function LeadsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6h14M5 12h14M5 18h9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="18" cy="18" r="2" fill="currentColor" />
    </svg>
  );
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M14 7l-5 5 5 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <div className="cyber-shell flex min-h-screen text-slate-100">
      <aside
        className={cn(
          "cyber-sidebar relative hidden shrink-0 flex-col border-r border-cyan-500/20 lg:flex",
          "transition-[width] duration-300 ease-out",
          collapsed ? "w-[4.5rem]" : "w-64"
        )}
      >
        <div className="cyber-sidebar-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative flex flex-col h-full min-h-screen">
          <div
            className={cn(
              "border-b border-cyan-500/15 px-3 py-4",
              collapsed ? "px-2" : "px-4"
            )}
          >
            <Link href="/dashboard" className="group block">
              <div className="flex items-center gap-3">
                <div className="cyber-logo-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-950/50 text-xs font-bold text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
                  LS
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="font-cyber-mono text-[10px] font-medium uppercase tracking-[0.2em] text-fuchsia-400/90">
                      Lead Search
                    </p>
                    <p className="font-cyber-display truncate text-base font-semibold tracking-wide text-cyan-50">
                      Control room
                    </p>
                  </div>
                )}
              </div>
            </Link>
          </div>

          <nav className="relative flex-1 space-y-1 p-2">
            {!collapsed && (
              <p className="font-cyber-mono px-2 pb-2 text-[10px] uppercase tracking-[0.25em] text-cyan-500/70">
                // nav
              </p>
            )}
            {NAV.map(({ href, label, desc, icon: Icon }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  title={collapsed ? `${label} — ${desc}` : undefined}
                  className={cn(
                    "cyber-nav-link group relative flex items-center gap-3 overflow-hidden rounded-lg px-2 py-2.5 transition-all duration-200",
                    collapsed && "justify-center px-0 py-3",
                    active
                      ? "bg-cyan-500/10 text-cyan-100 shadow-[inset_0_0_24px_rgba(34,211,238,0.08)]"
                      : "text-slate-400 hover:bg-fuchsia-500/5 hover:text-cyan-100"
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 h-8 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-cyan-400 to-fuchsia-500 transition-all duration-300",
                      active
                        ? "opacity-100 shadow-[0_0_12px_rgba(34,211,238,0.9)]"
                        : "opacity-0 group-hover:opacity-40"
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors",
                      active
                        ? "border-cyan-400/50 bg-cyan-950/80 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.2)]"
                        : "border-white/5 bg-black/20 text-slate-500 group-hover:border-fuchsia-500/30 group-hover:text-fuchsia-300"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  {!collapsed && (
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium tracking-wide">
                        {label}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block truncate text-[11px]",
                          active ? "text-cyan-400/70" : "text-slate-600"
                        )}
                      >
                        {desc}
                      </span>
                    </span>
                  )}
                  {!collapsed && active && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
                      aria-hidden
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="relative space-y-2 border-t border-cyan-500/15 p-2">
            <button
              type="button"
              onClick={toggleCollapsed}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-cyan-500/40 hover:text-cyan-200",
                collapsed && "justify-center px-0"
              )}
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronIcon collapsed={collapsed} />
              {!collapsed && (
                <span className="font-cyber-mono uppercase tracking-wider">
                  Collapse
                </span>
              )}
            </button>
            {!collapsed && (
              <p className="font-cyber-mono px-2 pb-1 text-[10px] leading-relaxed text-slate-600">
                <span className="text-fuchsia-500/80">→</span> Scrape · OpenRouter · Neon
              </p>
            )}
          </div>
        </div>
        <div
          className="pointer-events-none absolute bottom-0 right-0 top-0 w-px bg-gradient-to-b from-transparent via-cyan-400/50 to-fuchsia-500/40"
          aria-hidden
        />
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="cyber-main-grid pointer-events-none absolute inset-0 opacity-[0.35]" />
        <header className="sticky top-0 z-40 border-b border-cyan-500/20 bg-[#070b14]/90 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-2 p-2">
            <div className="font-cyber-mono px-2 text-[10px] uppercase tracking-widest text-cyan-500">
              LS
            </div>
            <div className="flex flex-1 gap-1 overflow-x-auto">
              {NAV.map(({ href, label }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "shrink-0 rounded-md border px-3 py-2 text-sm font-medium transition",
                      active
                        ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                        : "border-white/10 bg-black/30 text-slate-400"
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>
        <main
          className={cn(
            "relative flex-1 p-4 lg:p-8",
            mounted && "transition-opacity duration-300"
          )}
        >
          <div className="cyber-content-panel mx-auto min-h-[calc(100vh-4rem)] rounded-2xl border border-white/10 bg-slate-50/95 p-4 text-slate-900 shadow-[0_0_60px_rgba(0,0,0,0.45)] backdrop-blur-sm lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
