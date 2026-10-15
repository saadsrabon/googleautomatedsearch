export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 border-b border-slate-200/80 pb-6">
      {eyebrow && (
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      {description && (
        <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>
      )}
    </div>
  );
}
