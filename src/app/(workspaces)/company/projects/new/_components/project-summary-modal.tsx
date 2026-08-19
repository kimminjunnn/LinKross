"use client";

import { X } from "lucide-react";

export type ProjectPreview = {
  title: string;
  projectTypeLabel: string;
  technology: string;
  goal: string;
  requirements: string;
  deliverables: string;
  outOfScope: string;
  budgetLabel: string;
  scheduleLabel: string;
  recruitmentLabel: string;
  applicantGuidance: string;
};

type ProjectSummaryModalProps = {
  open: boolean;
  data: ProjectPreview | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ProjectSummaryModal({
  open,
  data,
  isSubmitting,
  onCancel,
  onConfirm,
}: ProjectSummaryModalProps) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-card bg-app-surface p-6 shadow-xl sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-app-border pb-4">
          <div>
            <h2 className="text-lg font-semibold text-app-foreground">등록 전 최종 확인</h2>
            <p className="mt-1 text-sm text-app-muted">
              아래 내용으로 프로젝트 공고가 등록됩니다. 등록 후 요구사항 수정은 별도 화면에서 진행합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-control p-1.5 text-app-muted transition-colors hover:bg-app-surface-subtle hover:text-app-foreground disabled:opacity-50"
            aria-label="닫기"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <dl className="mt-5 space-y-4 text-sm">
          <SummaryRow label="프로젝트명" value={data.title} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryRow label="유형" value={data.projectTypeLabel} />
            <SummaryRow label="기술 환경" value={data.technology} />
          </div>
          <SummaryRow label="목표" value={data.goal} multiline />
          <SummaryRow label="핵심 요구사항" value={data.requirements} multiline />
          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryRow label="기대 결과물" value={data.deliverables} multiline />
            <SummaryRow label="제외 범위" value={data.outOfScope} multiline />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryRow label="예산" value={data.budgetLabel} />
            <SummaryRow label="개발 일정" value={data.scheduleLabel} />
          </div>
          <SummaryRow label="모집 기간" value={data.recruitmentLabel} />
          <SummaryRow label="지원자 안내" value={data.applicantGuidance} multiline />
        </dl>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-app-border pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex min-h-11 items-center justify-center rounded-control border border-app-border-strong bg-app-surface px-5 text-sm font-semibold text-app-foreground transition-colors hover:bg-app-surface-subtle disabled:opacity-60"
          >
            내용 다시 확인
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "등록 중..." : "공고 등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-app-muted uppercase">{label}</dt>
      <dd
        className={`mt-1 text-app-foreground ${multiline ? "whitespace-pre-wrap leading-6" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
