"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
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
  const [isOriginalSummaryVisible, setIsOriginalSummaryVisible] = useState(false);

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
  const translatedSummary = {
    coreScope: sowSnapshot
      ? "영문 SOW 원본의 Scope of Work 항목을 기준으로 이번 개발 범위를 확인합니다."
      : "업무 명세서 탭에서 승인 요청한 원본 문서가 아직 없습니다.",
    keyAcceptance: sowSnapshot
      ? `${activeAcceptanceCriteria.length}개 Acceptance Criteria와 ${activeDefinitionOfDone.length}개 Definition of Done을 다음 검수 기준으로 사용합니다.`
      : "승인 요청 후 완료조건과 검수 기준이 이곳에 표시됩니다.",
    needsReview: sowSnapshot
      ? `${documentVersion} 원본 문서가 업무 명세서 탭에서 승인 요청한 버전과 같은지 확인하세요.`
      : "업무 명세서 탭에서 SOW를 생성하고 승인 요청을 진행하세요.",
  };
  const summaryItems = isOriginalSummaryVisible
    ? [
        { label: "Core Scope", value: activeSummary.coreScope },
        { label: "Key Acceptance", value: activeSummary.keyAcceptance },
        { label: "Needs Review", value: activeSummary.needsReview },
      ]
    : [
        { label: "핵심 범위", value: translatedSummary.coreScope },
        { label: "주요 승인 기준", value: translatedSummary.keyAcceptance },
        { label: "확인 포인트", value: translatedSummary.needsReview },
      ];

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
                현재 승인 요청된 업무 명세서 원본을 확인합니다.
              </p>
            </div>
            <StatusBadge tone="brand">
              {sowSnapshot ? "원본 문서 준비" : "승인 요청 대기"}
            </StatusBadge>
          </div>

          {sowSnapshot ? (
            <div className="mt-4 rounded-control border border-brand-200 bg-brand-50 p-4 text-sm leading-6 text-brand-700">
              <strong>{sowSnapshot.pdfFileName}</strong> 승인 기준으로 사용할 업무 명세서 원본입니다.
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
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-black text-app-foreground">업무명세서 요약</h2>
              <button
                type="button"
                onClick={() => setIsOriginalSummaryVisible((current) => !current)}
                className="shrink-0 rounded-control border border-app-border-strong px-3 py-1.5 text-xs font-bold text-app-foreground hover:bg-app-surface-subtle"
              >
                {isOriginalSummaryVisible ? "번역 보기" : "원문 보기"}
              </button>
            </div>
            <dl className="mt-5 space-y-4">
              {summaryItems.map((item) => (
                <div key={item.label}>
                  <dt className="text-xs font-semibold text-app-muted">{item.label}</dt>
                  <dd className="mt-1 text-sm font-bold leading-6 text-app-foreground">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
            <h2 className="text-lg font-black text-app-foreground">승인 진행 상태</h2>
            <div className="mt-5 space-y-3">
              <article className="rounded-control border border-app-border bg-app-surface-subtle p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-app-foreground">박피오</h3>
                    <p className="mt-1 text-xs font-semibold text-app-muted">PO 승인</p>
                  </div>
                  <StatusBadge tone={isPoApproved ? "success" : "warning"}>
                    {isPoApproved ? "승인 완료" : "승인 대기"}
                  </StatusBadge>
                </div>
              </article>

              <article className="rounded-control border border-app-border bg-app-surface-subtle p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-app-foreground">Sarah Lee</h3>
                    <p className="mt-1 text-xs font-semibold text-app-muted">프리랜서 승인</p>
                  </div>
                  <StatusBadge tone="success">승인 완료</StatusBadge>
                </div>
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
