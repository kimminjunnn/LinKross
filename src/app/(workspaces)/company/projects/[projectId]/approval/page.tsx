"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileText, LockKeyhole, UserCheck } from "lucide-react";

import {
  approveSowAsCompanyAction,
  getSowApprovalStateAction,
  generateSowSummaryAction,
  type SowSummaryResult,
} from "@/app/actions/sow";
import { StatusBadge } from "@/components/project/status-badge";
import type { SowApprovalState } from "@/lib/backend";

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
  needsReview: "업무명세서 탭에서 작성된 원본 내용을 확인",
};

function formatVerificationMethod(method: string) {
  const labels: Record<string, string> = {
    automated_e2e: "자동 E2E 검수",
    build: "빌드 확인",
    manual: "PO 직접 확인",
    document: "문서/커밋 근거 확인",
  };

  return labels[method] ?? method;
}

export default function ApprovalPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = params.projectId;
  const [isPoApproved, setIsPoApproved] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isOriginalSummaryVisible, setIsOriginalSummaryVisible] = useState(false);
  const [approvalState, setApprovalState] = useState<SowApprovalState | null>(null);
  const [isApprovalLoading, setIsApprovalLoading] = useState(true);
  const [approvalLoadError, setApprovalLoadError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [aiSummary, setAiSummary] = useState<SowSummaryResult | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const loadApprovalState = useCallback(async () => {
    setIsApprovalLoading(true);
    setApprovalLoadError(null);

    const result = await getSowApprovalStateAction(projectId);
    if (result.ok) {
      setApprovalState(result.data);
      
      const sow = result.data?.document;
      if (sow) {
        setIsSummaryLoading(true);
        const workDetailKo = sow.documentSections.find(s => s.title === "한국어 업무 상세")?.body || "";
        const overviewSec = sow.documentSections.find(s => s.title === "Project Overview & Objectives")?.body || "";
        
        let background = "";
        let objective = "";
        const bgMatch = overviewSec.match(/Background:\s*([\s\S]*?)(?=Objective:|$)/);
        const objMatch = overviewSec.match(/Objective:\s*([\s\S]*)/);
        if (bgMatch) background = bgMatch[1].trim();
        if (objMatch) objective = objMatch[1].trim();

        const summaryResult = await generateSowSummaryAction(
          workDetailKo,
          background,
          objective,
          sow.acceptanceCriteria,
          sow.definitionOfDone
        );

        if (summaryResult.ok) {
          setAiSummary(summaryResult.data);
        }
        setIsSummaryLoading(false);
      }
    } else {
      setApprovalState(null);
      setApprovalLoadError(result.error.message);
    }

    setIsApprovalLoading(false);
  }, [projectId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadApprovalState();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadApprovalState]);

  const sowDocument = approvalState?.document ?? null;
  const documentVersion = sowDocument?.version ?? "-";
  const activeDocumentSections = sowDocument?.documentSections ?? fallbackDocumentSections;
  const activeAcceptanceCriteria = sowDocument?.acceptanceCriteria ?? acceptanceCriteria;
  const activeDefinitionOfDone = sowDocument?.definitionOfDone ?? definitionOfDone;
  const activeSummary = sowDocument?.summary ?? fallbackSummary;
  const milestoneCriteriaRows =
    approvalState?.milestones.map((milestone) => {
      const milestoneAcceptanceCriteria = milestone.acceptanceCriteria.map((item) => item.description);
      const milestoneDefinitionOfDone = milestone.definitionOfDone.map((item) => item.description);

      return {
        code: milestone.code,
        title: milestone.title,
        period: milestone.period,
        amount: milestone.amount,
        acceptanceCriteria: milestoneAcceptanceCriteria.length
          ? milestoneAcceptanceCriteria
          : activeAcceptanceCriteria,
        definitionOfDone: milestoneDefinitionOfDone.length
          ? milestoneDefinitionOfDone
          : activeDefinitionOfDone,
        verificationMethods: milestone.verificationMethods.length
          ? milestone.verificationMethods.map(formatVerificationMethod)
          : ["PO 직접 확인"],
      };
    }) ?? [];
  const translatedSummary = {
    coreScope: aiSummary
      ? aiSummary.coreScope
      : (sowDocument
          ? "영문 SOW 원본의 Scope of Work 항목을 기준으로 이번 개발 범위를 확인합니다."
          : "업무 명세서 탭에서 승인 요청한 원본 문서가 아직 없습니다."),
    keyAcceptance: aiSummary
      ? aiSummary.keyAcceptance
      : (sowDocument
          ? `${activeAcceptanceCriteria.length}개 Acceptance Criteria와 ${activeDefinitionOfDone.length}개 Definition of Done을 다음 검수 기준으로 사용합니다.`
          : "승인 요청 후 완료조건과 검수 기준이 이곳에 표시됩니다."),
    needsReview: aiSummary
      ? aiSummary.needsReview
      : (sowDocument
          ? `${documentVersion} 원본 문서가 업무 명세서 탭에서 승인 요청한 버전과 같은지 확인하세요.`
          : "업무 명세서 탭에서 SOW를 생성하고 승인 요청을 진행하세요."),
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

  const isCompanyApproved =
    isPoApproved || Boolean(approvalState?.approvals.company) || approvalState?.status === "approved";
  const isFreelancerApproved = Boolean(approvalState?.approvals.freelancer) || approvalState?.status === "approved";
  const isReadOnly = approvalState?.status === "approved";
  const isApprovalComplete =
    isReadOnly || approvalState?.status === "approved" || (isCompanyApproved && isFreelancerApproved);

  const handleFinalApproval = async () => {
    if (!approvalState) {
      setStatusMessage("승인 요청된 업무명세서가 DB에 없습니다. 업무명세서 탭에서 승인 요청을 먼저 진행해주세요.");
      setIsConfirmOpen(false);
      return;
    }

    setIsApproving(true);
    const result = await approveSowAsCompanyAction({
      projectId,
      sowVersionId: approvalState.sowVersionId,
      contentHash: approvalState.contentHash,
    });

    if (!result.ok) {
      setStatusMessage(`PO 승인 저장 실패: ${result.error.message}`);
      setIsApproving(false);
      setIsConfirmOpen(false);
      return;
    }

    setApprovalState(result.data);
    setIsPoApproved(true);
    setIsApproving(false);
    setIsConfirmOpen(false);

    if (result.data.status === "approved" || result.data.approvals.freelancer) {
      router.push(`/company/projects/${projectId}/verification`);
      return;
    }

    setStatusMessage("PO 승인 기록이 DB에 저장되었습니다. 프리랜서 승인까지 완료되면 다음 단계로 이동할 수 있습니다.");
  };

  const handleCancelApproval = () => {
    setIsConfirmOpen(false);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.1em] text-brand-700 uppercase">
              {isReadOnly ? "Approved SOW" : "PO approval"}
            </p>
            <h2 className="mt-2 text-xl font-black text-app-foreground">
              {isReadOnly ? "승인된 업무 명세서" : "업무 명세서 승인"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-app-muted">
              {isReadOnly
                ? "기업과 프리랜서가 동일한 버전에 승인한 업무 명세서와 승인 기록을 확인합니다. 승인된 문서는 읽기 전용입니다."
                : "PO가 프리랜서 승인 완료 상태를 확인한 뒤, 같은 업무 명세서 원본 버전을 승인합니다. 이 화면은 개발 시작 전 합의를 확정하는 단계입니다."}
            </p>
          </div>
          <StatusBadge tone={isApprovalComplete ? "success" : "warning"}>
            {isApprovalLoading
              ? "승인 정보 확인 중"
              : isApprovalComplete
                ? "양측 승인 완료"
                : "PO 승인 대기"}
          </StatusBadge>
        </div>
      </section>

      {approvalLoadError ? (
        <div className="rounded-control border border-danger/30 bg-danger/10 p-4 text-sm font-bold text-danger">
          {approvalLoadError}
        </div>
      ) : null}

      {statusMessage ? (
        <div className="rounded-control border border-brand-200 bg-brand-50 p-4 text-sm font-bold text-brand-800">
          {statusMessage}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-brand-700">
                <FileText aria-hidden="true" className="size-5" />
                <p className="text-xs font-bold tracking-[0.1em] uppercase">
                  승인 기준 문서 {documentVersion}
                </p>
              </div>
              <h2 className="mt-2 text-xl font-black text-app-foreground">
                업무 명세서 원본
              </h2>
              <p className="mt-2 text-sm leading-6 text-app-muted">
                업무명세서 탭에서 작성된 원본 내용을 확인합니다.
              </p>
            </div>
            <StatusBadge tone={isReadOnly ? "success" : "brand"}>
              {isReadOnly ? "승인 완료" : sowDocument ? "원본 문서 준비" : "승인 요청 대기"}
            </StatusBadge>
          </div>

          <div className="mt-6 rounded-control border border-app-border bg-app-surface-subtle p-5">
            <div className="rounded-control border border-app-border bg-app-surface p-5">
              <h3 className="text-sm font-black text-app-foreground">업무명세서 탭 원본 데이터</h3>
              {sowDocument ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {activeDocumentSections.map((section) => (
                    <article
                      key={section.title}
                      className="rounded-control border border-app-border bg-app-surface-subtle p-4"
                    >
                      <h4 className="text-sm font-black text-app-foreground">{section.title}</h4>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-app-muted">
                        {section.body}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm leading-6 text-app-muted">
                  업무명세서 탭에서 승인 요청한 DB 원본이 아직 없습니다. 영문 SOW를 생성한 뒤 승인 요청을 진행해주세요.
                </p>
              )}
            </div>

            <div className="mt-6 border-t border-app-border pt-5">
              <h3 className="text-sm font-black text-app-foreground">
                마일스톤 검증 정보
              </h3>
              <div className="mt-3 overflow-hidden rounded-control border border-app-border bg-app-surface">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-app-border text-left text-sm">
                    <thead className="bg-app-surface-subtle text-xs font-bold text-app-muted">
                      <tr>
                        <th scope="col" className="w-[18%] px-4 py-3">
                          Milestone
                        </th>
                        <th scope="col" className="w-[32%] px-4 py-3">
                          Acceptance Criteria
                        </th>
                        <th scope="col" className="w-[32%] px-4 py-3">
                          Definition of Done
                        </th>
                        <th scope="col" className="w-[18%] px-4 py-3">
                          Verification
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app-border">
                      {milestoneCriteriaRows.length ? (
                        milestoneCriteriaRows.map((row) => (
                          <tr key={`${row.code}-${row.title}`} className="align-top">
                            <td className="px-4 py-4 font-bold text-app-foreground">
                              <span>{row.code}</span>
                              <span className="mt-1 block font-semibold text-app-muted">
                                {row.title}
                              </span>
                              <span className="mt-3 block text-xs font-semibold text-app-muted">
                                기간: {row.period}
                              </span>
                              <span className="mt-1 block text-xs font-semibold text-app-muted">
                                금액: {row.amount}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-app-muted">
                              <ul className="list-disc space-y-2 pl-4">
                                {row.acceptanceCriteria.map((item, index) => (
                                  <li key={`${row.code}-acceptance-${index}`}>{item}</li>
                                ))}
                              </ul>
                            </td>
                            <td className="px-4 py-4 text-app-muted">
                              <ul className="list-disc space-y-2 pl-4">
                                {row.definitionOfDone.map((item, index) => (
                                  <li key={`${row.code}-done-${index}`}>{item}</li>
                                ))}
                              </ul>
                            </td>
                            <td className="px-4 py-4 text-app-muted">
                              <ul className="list-disc space-y-2 pl-4">
                                {row.verificationMethods.map((item) => (
                                  <li key={`${row.code}-${item}`}>{item}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-sm font-semibold text-app-muted">
                            아직 확정된 마일스톤 검수 기준이 없습니다. 업무명세서 탭에서 기준을 작성한 뒤 승인 요청하세요.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {!isReadOnly ? (
            <div className="mt-5 rounded-control border border-brand-200 bg-brand-50 p-4">
              <p className="text-sm font-bold leading-6 text-brand-700">
                이 업무 명세서 {documentVersion} 원본을 확인했고, 해당 버전을 승인합니다.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(true)}
                  disabled={!approvalState || isCompanyApproved || isApproving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserCheck aria-hidden="true" className="size-4" />
                  {isCompanyApproved ? `${documentVersion} 승인 완료` : `${documentVersion} 승인`}
                </button>
              </div>
            </div>
          ) : null}
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
              {isSummaryLoading ? (
                <div className="py-8 text-center text-xs font-semibold text-app-muted animate-pulse">
                  Gemini AI가 업무 명세서 요약을 생성하고 있습니다...
                </div>
              ) : (
                summaryItems.map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs font-semibold text-app-muted">{item.label}</dt>
                    <dd className="mt-1 text-sm font-bold leading-6 text-app-foreground">
                      {item.value}
                    </dd>
                  </div>
                ))
              )}
            </dl>
          </section>

          <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
            <h2 className="text-lg font-black text-app-foreground">승인 진행 상태</h2>
            <div className="mt-5 space-y-3">
              <article className="rounded-control border border-app-border bg-app-surface-subtle p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-app-foreground">{approvalState?.approvals.company?.approverName ?? "발주자"}</h3>
                    <p className="mt-1 text-xs font-semibold text-app-muted">PO 승인</p>
                  </div>
                  <StatusBadge tone={isCompanyApproved ? "success" : "warning"}>
                    {isCompanyApproved ? "승인 완료" : "승인 대기"}
                  </StatusBadge>
                </div>
              </article>

              <article className="rounded-control border border-app-border bg-app-surface-subtle p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-app-foreground">{approvalState?.approvals.freelancer?.approverName ?? "프리랜서"}</h3>
                    <p className="mt-1 text-xs font-semibold text-app-muted">프리랜서 승인</p>
                  </div>
                  <StatusBadge tone={isFreelancerApproved ? "success" : "warning"}>
                    {isFreelancerApproved ? "승인 완료" : "승인 대기"}
                  </StatusBadge>
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>

      {!isReadOnly && isConfirmOpen ? (
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
                  예를 누르면 업무 명세서 {documentVersion} 승인 기록이 DB에 저장됩니다.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleFinalApproval}
                disabled={isApproving}
                className="min-h-11 rounded-control bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isApproving ? "저장 중" : "예"}
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
