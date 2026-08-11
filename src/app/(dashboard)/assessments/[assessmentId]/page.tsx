import Link from "next/link";
import { ArrowLeft, Check, CircleAlert } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { StatusBadge } from "@/components/project/status-badge";

const candidates = [
  {
    name: "김지원",
    role: "Full-stack · 6년",
    timezone: "UTC+9",
    score: "4.4 / 5",
    question: "인증 실패 및 결제 상태 동기화 경계를 먼저 확인했습니다.",
    plan: "스키마 → 인증 → 계약 목록 → E2E 순으로 3개 마일스톤을 제안했습니다.",
    risk: "외부 결제 API 지연을 식별하고 mock 및 재시도 전략을 제안했습니다.",
    recommended: true,
  },
  {
    name: "Alex Kim",
    role: "Frontend · 5년",
    timezone: "UTC-8",
    score: "3.7 / 5",
    question: "화면 목록과 디자인 시스템 유무를 확인했습니다.",
    plan: "컴포넌트 구현 중심 계획이며 백엔드 연동 단계가 구체적이지 않습니다.",
    risk: "시차 리스크는 언급했으나 API 실패 시나리오는 빠져 있습니다.",
    recommended: false,
  },
];

export default function AssessmentDetailPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <Link href="/assessments" className="inline-flex items-center gap-1.5 text-sm font-bold text-app-muted hover:text-brand-700">
        <ArrowLeft className="size-4" />지원자 검증 목록
      </Link>
      <div className="mt-4">
        <PageHeader
          eyebrow="응답 비교 · 12명 중 상위 2명"
          title="고객 포털 MVP 개발자 검증"
          description="동일한 요구사항에 대한 확인 질문, 실행 계획과 위험 대응을 근거로 비교합니다. 점수는 판단을 돕는 요약이며 자동 선정하지 않습니다."
        />
      </div>

      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        {candidates.map((candidate) => (
          <article key={candidate.name} className={`rounded-card border bg-app-surface p-5 shadow-card sm:p-6 ${candidate.recommended ? "border-brand-300" : "border-app-border"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-app-foreground">{candidate.name}</h2>
                  {candidate.recommended ? <StatusBadge tone="brand">우선 검토</StatusBadge> : null}
                </div>
                <p className="mt-2 text-sm text-app-muted">{candidate.role} · {candidate.timezone}</p>
              </div>
              <div className="rounded-control bg-app-surface-subtle px-3 py-2 text-right">
                <p className="text-xs text-app-muted">루브릭 요약</p>
                <p className="mt-1 font-black text-app-foreground">{candidate.score}</p>
              </div>
            </div>

            <dl className="mt-6 space-y-3">
              {[
                ["확인 질문", candidate.question],
                ["실행 계획", candidate.plan],
                ["예상 리스크", candidate.risk],
              ].map(([label, value]) => (
                <div key={label} className="rounded-control border border-app-border bg-app-surface-subtle p-4">
                  <dt className="text-xs font-black text-brand-700">{label}</dt>
                  <dd className="mt-2 text-sm leading-6 text-app-foreground">{value}</dd>
                </div>
              ))}
            </dl>

            <label className="mt-5 flex items-start gap-3 rounded-control border border-app-border p-4">
              <input type="radio" name="candidate" value={candidate.name} className="mt-0.5 size-4 accent-brand-500" />
              <span>
                <strong className="block text-sm text-app-foreground">선정 후보로 표시</strong>
                <span className="mt-1 block text-xs leading-5 text-app-muted">최종 선정 전 발주자가 근거를 다시 확인합니다.</span>
              </span>
            </label>
          </article>
        ))}
      </div>

      <aside className="mt-5 flex flex-col gap-4 rounded-card border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning" />
          <div>
            <h2 className="text-sm font-black text-app-foreground">선정 전 확인</h2>
            <p className="mt-1 text-sm leading-6 text-app-muted">프로필, 국적이나 AI 점수만으로 선정하지 말고 제출 원문과 프로젝트 제약조건을 함께 확인하세요.</p>
          </div>
        </div>
        <button type="button" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-bold text-white">
          <Check className="size-4" />개발자 선정
        </button>
      </aside>
    </div>
  );
}
