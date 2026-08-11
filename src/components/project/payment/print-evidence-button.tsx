"use client";

export function PrintEvidenceButton({ disabled }: { disabled: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => window.print()}
      className="no-print mt-5 min-h-11 w-full rounded-control bg-app-foreground px-4 text-sm font-bold text-white disabled:opacity-45"
    >
      지급 증빙 PDF 생성
    </button>
  );
}
