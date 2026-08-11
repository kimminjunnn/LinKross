export function ProgressSteps({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-app-muted">
        <span>진행도</span>
        <span>{label}</span>
      </div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={`마일스톤 ${total}개 중 ${current}개 진행`}
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={`h-2 rounded-pill ${
              index < current ? "bg-brand-500" : "bg-app-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
