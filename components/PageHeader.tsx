import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  variant = "default",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  variant?: "default" | "cyber";
}) {
  const cyber = variant === "cyber";

  return (
    <div className={cn("mb-8 border-b pb-6", cyber ? "border-cyan-300/15" : "border-slate-200/80")}>
      {eyebrow && (
        <p className={cn("text-xs font-medium uppercase tracking-widest", cyber ? "font-cyber-mono text-cyan-400/80" : "text-slate-500")}>
          {eyebrow}
        </p>
      )}
      <h1 className={cn("mt-1 text-2xl font-semibold tracking-tight", cyber ? "font-cyber-display text-slate-50" : "text-slate-900")}>
        {title}
      </h1>
      {description && (
        <p className={cn("mt-1 max-w-2xl text-sm", cyber ? "text-slate-400" : "text-slate-600")}>
          {description}
        </p>
      )}
    </div>
  );
}
