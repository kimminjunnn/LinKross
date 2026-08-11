"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, FileText, LockKeyhole, UserCheck } from "lucide-react";

import { StatusBadge } from "@/components/project/status-badge";

const summaryItems = [
  { label: "문서 버전", value: "v1.2" },
  { label: "승인 상태", value: "1/2 승인 완료", approvedValue: "2/2 승인 완료" },
  { label: "다음 행동", value: "PO 승인 대기", approvedValue: "다음 단계 진행" },
  { label: "완료조건", value: "4개" },
];

const documentSections = [
  {
    title: "목표",
    body: "고객이 로그인 후 계약 및 진행 현황을 확인할 수 있는 포털 MVP를 구현합니다.",
  },
  {
    title: "범위",
    body: "로그인, 대시보드 이동, 오류 메시지, 기본 계약 목록 화면을 포함합니다.",
  },
  {
    title: "제외사항",
    body: "실제 결제 처리, 운영 고객 데이터 연동, 복잡한 권한 시스템은 제외합니다.",
  },
  {
    title: "결과물",
    body: "로그인 화면, 대시보드 진입 화면, 기본 계약 목록 UI, 검수 가능한 테스트 흐름",
  },
  {
    title: "일정",
    body: "2026.08.10 - 2026.08.31",
  },
  {
    title: "금액",
    body: "3,000 USDC",
  },
];

const acceptanceCriteria = [
  "이메일과 비밀번호를 입력할 수 있다.",
  "정상 로그인 후 `/dashboard`로 이동한다.",
  "잘못된 비밀번호 입력 시 오류가 표시된다.",
  "이메일 미입력 시 로그인이 차단된다.",
];

const definitionOfDone = [
  "승인된 완료조건이 충족되어야 한다.",
  "Commit SHA 기준 검수 요청이 가능해야 한다.",
  "Preview에서 핵심 로그인 흐름을 확인할 수 있어야 한다.",
];

export default function ApprovalPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const [isPoApproved, setIsPoApproved] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const currentSummaryItems = useMemo(
    () =>
      summaryItems.map((item) => ({
        ...item,
        value: isPoApproved && item.approvedValue ? item.approvedValue : item.value,
      })),
    [isPoApproved],
  );

  const handleFinalApproval = () => {
    setIsPoApproved(true);
    router.push(`/projects/${params.projectId}/verification`);
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
                아래 상세 문서가 실제 승인 기준입니다. 요약 정보는 빠른 이해를 돕는 보조 정보로만 사용합니다.
              </p>
            </div>
            <StatusBadge tone="brand">원본 확인 필요</StatusBadge>
          </div>

          <div className="mt-6 rounded-control border border-app-border bg-app-surface-subtle p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              {documentSections.map((section) => (
                <section key={section.title}>
                  <h3 className="text-sm font-black text-app-foreground">{section.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-app-muted">{section.body}</p>
                </section>
              ))}
            </div>

            <div className="mt-6 border-t border-app-border pt-5">
              <h3 className="text-sm font-black text-app-foreground">Acceptance Criteria</h3>
              <ul className="mt-3 space-y-2">
                {acceptanceCriteria.map((item) => (
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
                {definitionOfDone.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-app-muted">
                    <LockKeyhole aria-hidden="true" className="mt-1 size-4 shrink-0 text-brand-700" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-5 rounded-control border border-brand-200 bg-brand-50 p-4">
            <p className="text-sm font-bold leading-6 text-brand-700">
              이 업무 명세서 v1.2 원본을 확인했고, 해당 버전을 승인합니다.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600"
              >
                <UserCheck aria-hidden="true" className="size-4" />
                v1.2 승인
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
                  로그인, 대시보드 이동, 오류 메시지, 기본 계약 목록
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-app-muted">주요 완료조건</dt>
                <dd className="mt-1 text-sm font-bold leading-6 text-app-foreground">
                  로그인 흐름 4개 조건을 이후 검수 기준으로 사용
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-app-muted">확인 필요</dt>
                <dd className="mt-1 text-sm font-bold leading-6 text-app-foreground">
                  PO가 같은 v1.2 원본을 확인하고 승인해야 함
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
                  예를 누르면 업무 명세서 v1.2 승인 단계가 완료되고 다음 단계로 이동합니다.
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
