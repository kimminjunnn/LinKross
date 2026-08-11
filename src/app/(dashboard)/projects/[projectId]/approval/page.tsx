"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, FileText, LockKeyhole, UserCheck } from "lucide-react";

import { StatusBadge } from "@/components/project/status-badge";
import {
  ApprovalSowSnapshot,
  readApprovalSowSnapshot,
} from "@/lib/sow-approval";

const fallbackDocumentSections = [
  {
    title: "업무 명세서",
    body: "아직 승인 요청된 원본 문서가 없습니다. 업무 명세서 탭에서 영문 SOW를 생성한 뒤 승인 요청을 진행하면 이곳에 원본 문서가 표시됩니다.",
  },
];

const acceptanceCriteria = [
  "업무 명세서 탭에서 승인 요청된 원본 문서를 기준으로 표시됩니다.",
];

const definitionOfDone = [
  "승인 요청이 완료되면 해당 업무 명세서 버전이 승인 기준으로 고정됩니다.",
];

const fallbackSummary = {
  coreScope: "승인 요청된 업무 명세서 없음",
  keyAcceptance: "업무 명세서 탭에서 영문 SOW 승인 요청 필요",
  needsReview: "PDF 인쇄/저장 후 승인 탭에서 원본 문서를 확인",
};

const getEmptySowSnapshot = () => null;

export default function ApprovalPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = params.projectId;
  const [isPoApproved, setIsPoApproved] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const subscribeSowSnapshot = useCallback((onStoreChange: () => void) => {
    window.addEventListener("storage", onStoreChange);
    return () => window.removeEventListener("storage", onStoreChange);
  }, []);

  const getSowSnapshot = useCallback((): ApprovalSowSnapshot | null => {
    return readApprovalSowSnapshot(projectId);
  }, [projectId]);

  const sowSnapshot = useSyncExternalStore(
    subscribeSowSnapshot,
    getSowSnapshot,
    getEmptySowSnapshot,
  );

  const documentVersion = sowSnapshot?.version ?? "v1.2";
  const activeDocumentSections = sowSnapshot?.documentSections ?? fallbackDocumentSections;
  const activeAcceptanceCriteria = sowSnapshot?.acceptanceCriteria ?? acceptanceCriteria;
  const activeDefinitionOfDone = sowSnapshot?.definitionOfDone ?? definitionOfDone;
  const activeSummary = sowSnapshot?.summary ?? fallbackSummary;

  const currentSummaryItems = useMemo(
    () => [
      { label: "문서 버전", value: documentVersion },
      { label: "승인 상태", value: isPoApproved ? "2/2 승인 완료" : "1/2 승인 완료" },
      { label: "다음 행동", value: isPoApproved ? "다음 단계 진행" : "PO 승인 대기" },
      { label: "완료조건", value: `${activeAcceptanceCriteria.length}개` },
    ],
    [activeAcceptanceCriteria.length, documentVersion, isPoApproved],
  );

  const handleFinalApproval = () => {
    setIsPoApproved(true);
    router.push(`/projects/${projectId}/verification`);
  };

  const handleCancelApproval = () => {
    setIsPoApproved(false);
    setIsConfirmOpen(false);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.1em] text-brand-700 uppercase">
              PO approval
            </p>
            <h2 className="mt-2 text-xl font-black text-app-foreground">
              업무 명세서 승인
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-app-muted">
              PO가 프리랜서 승인 완료 상태를 확인한 뒤, 같은 업무 명세서 원본 버전을 승인합니다.
              이 화면은 개발 시작 전 합의를 확정하는 단계입니다.
            </p>
          </div>
          <StatusBadge tone={isPoApproved ? "success" : "warning"}>
            {isPoApproved ? "양측 승인 완료" : "PO 승인 대기"}
          </StatusBadge>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {currentSummaryItems.map((item) => (
            <dl
              key={item.label}
              className="rounded-control border border-app-border bg-app-surface-subtle p-4"
            >
              <dt className="text-xs font-semibold text-app-muted">{item.label}</dt>
              <dd className="mt-2 text-base font-black text-app-foreground">{item.value}</dd>
            </dl>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-brand-700">
                <FileText aria-hidden="true" className="size-5" />
                <p className="text-xs font-bold tracking-[0.1em] uppercase">
                  승인 기준 문서 v1.2
                </p>
              </div>
              <h2 className="mt-2 text-xl font-black text-app-foreground">
                승인 대상 업무 명세서 원본
              </h2>
              <p className="mt-2 text-sm leading-6 text-app-muted">
                아래 상세 문서가 실제 승인 기준입니다. SOW 탭에서 PDF 인쇄 요청한 원본 스냅샷을 우선 표시합니다.
              </p>
            </div>
            <StatusBadge tone="brand">
              {sowSnapshot ? "PDF 원본 저장됨" : "승인 요청 대기"}
            </StatusBadge>
          </div>

          {sowSnapshot ? (
            <div className="mt-4 rounded-control border border-brand-200 bg-brand-50 p-4 text-sm leading-6 text-brand-700">
              <strong>{sowSnapshot.pdfFileName}</strong> 파일명으로 PDF 저장을 요청한 SOW 원본입니다.
            </div>
          ) : null}

          <div className="mt-6 rounded-control border border-app-border bg-app-surface-subtle p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              {activeDocumentSections.map((section) => (
                <section key={section.title}>
                  <h3 className="text-sm font-black text-app-foreground">{section.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-app-muted">{section.body}</p>
                </section>
              ))}
            </div>

            <div className="mt-6 border-t border-app-border pt-5">
              <h3 className="text-sm font-black text-app-foreground">Acceptance Criteria</h3>
              <ul className="mt-3 space-y-2">
                {activeAcceptanceCriteria.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-app-muted">
                    <CheckCircle2 aria-hidden="true" className="mt-1 size-4 shrink-0 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 border-t border-app-border pt-5">
              <h3 className="text-sm font-black text-app-foreground">Definition of Done</h3>
              <ul className="mt-3 space-y-2">
                {activeDefinitionOfDone.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-app-muted">
                    <LockKeyhole aria-hidden="true" className="mt-1 size-4 shrink-0 text-brand-700" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {sowSnapshot?.printText ? (
              <div className="mt-6 border-t border-app-border pt-5">
                <h3 className="text-sm font-black text-app-foreground">PDF 인쇄 원본 텍스트</h3>
                <div className="mt-3 max-h-80 overflow-y-auto rounded-control border border-app-border bg-app-surface p-4 text-sm leading-6 text-app-muted">
                  <p className="whitespace-pre-line">{sowSnapshot.printText}</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-5 rounded-control border border-brand-200 bg-brand-50 p-4">
            <p className="text-sm font-bold leading-6 text-brand-700">
              이 업무 명세서 {documentVersion} 원본을 확인했고, 해당 버전을 승인합니다.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600"
              >
                <UserCheck aria-hidden="true" className="size-4" />
                {documentVersion} 승인
              </button>
            </div>
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
            <p className="text-xs font-bold tracking-[0.1em] text-accent-700 uppercase">
              보조 요약
            </p>
            <h2 className="mt-2 text-lg font-black text-app-foreground">빠른 확인</h2>
            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-xs font-semibold text-app-muted">핵심 범위</dt>
                <dd className="mt-1 text-sm font-bold leading-6 text-app-foreground">
                  {activeSummary.coreScope}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-app-muted">주요 완료조건</dt>
                <dd className="mt-1 text-sm font-bold leading-6 text-app-foreground">
                  {activeSummary.keyAcceptance}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-app-muted">확인 필요</dt>
                <dd className="mt-1 text-sm font-bold leading-6 text-app-foreground">
                  {activeSummary.needsReview}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
            <p className="text-xs font-bold tracking-[0.1em] text-brand-700 uppercase">
              양측 승인 상태
            </p>
            <h2 className="mt-2 text-lg font-black text-app-foreground">승인자</h2>
            <div className="mt-5 space-y-3">
              <article className="rounded-control border border-app-border bg-app-surface-subtle p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-app-foreground">박피오</h3>
                    <p className="mt-1 text-xs font-semibold text-app-muted">
                      역할: PO
                    </p>
                  </div>
                  <StatusBadge tone={isPoApproved ? "success" : "warning"}>
                    {isPoApproved ? "승인 완료" : "승인 대기"}
                  </StatusBadge>
                </div>
                <p className="mt-3 text-xs font-semibold text-app-muted">
                  승인일:{" "}
                  <span className="text-app-foreground">
                    {isPoApproved ? "2026.08.11" : "-"}
                  </span>
                </p>
              </article>

              <article className="rounded-control border border-app-border bg-app-surface-subtle p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-app-foreground">Sarah Lee</h3>
                    <p className="mt-1 text-xs font-semibold text-app-muted">
                      역할: 프리랜서
                    </p>
                  </div>
                  <StatusBadge tone="success">승인 완료</StatusBadge>
                </div>
                <p className="mt-3 text-xs font-semibold text-app-muted">
                  승인일: <span className="text-app-foreground">2026.08.11</span>
                </p>
              </article>
            </div>
          </section>
        </div>
      </div>

      {isConfirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="final-approval-title"
          className="fixed inset-0 z-50 grid place-items-center bg-app-foreground/45 p-4"
        >
          <div className="w-full max-w-md rounded-card border border-app-border bg-app-surface p-5 shadow-floating sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-control bg-brand-50 text-brand-700">
                <LockKeyhole aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 id="final-approval-title" className="text-lg font-black text-app-foreground">
                  최종 승인을 완료 하시겠습니까
                </h2>
                <p className="mt-2 text-sm leading-6 text-app-muted">
                  예를 누르면 업무 명세서 {documentVersion} 승인 단계가 완료되고 다음 단계로 이동합니다.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleFinalApproval}
                className="min-h-11 rounded-control bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600"
              >
                예
              </button>
              <button
                type="button"
                onClick={handleCancelApproval}
                className="min-h-11 rounded-control border border-app-border-strong bg-app-surface px-4 text-sm font-bold text-app-foreground"
              >
                아니오
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
