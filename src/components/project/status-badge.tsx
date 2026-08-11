type StatusTone = "neutral" | "brand" | "accent" | "success" | "warning";

const toneClasses: Record<StatusTone, string> = {
  neutral: "border-app-border bg-app-surface-subtle text-app-muted",
  brand: "border-brand-200 bg-brand-50 text-brand-700",
  accent: "border-accent-200 bg-accent-50 text-accent-800",
  success: "border-emerald-200 bg-emerald-50 text-success",
  warning: "border-amber-200 bg-amber-50 text-warning",
};

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: StatusTone;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-pill border px-2.5 py-1 text-xs font-bold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
