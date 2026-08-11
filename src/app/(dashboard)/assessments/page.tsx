import Link from "next/link";
import { ArrowRight, ClipboardPlus } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { StatusBadge } from "@/components/project/status-badge";

const assessments = [
  { id: "customer-portal", title: "고객 포털 MVP 개발자 검증", status: "응답 검토 중", tone: "accent" as const, candidates: 12, due: "2026.08.18", evidence: "질문 · 계획 · 리스크" },
  { id: "admin-automation", title: "정산 백오피스 개발자 검증", status: "제출 중", tone: "brand" as const, candidates: 6, due: "2026.08.23", evidence: "요구사항 이해 · 설계 판단" },
  { id: "brand-site", title: "브랜드 사이트 개발자 검증", status: "선정 완료", tone: "success" as const, candidates: 8, due: "2026.07.31", evidence: "비교 결과 보관" },
];

export default function AssessmentsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="지원자 검증"
        description="이력보다 요구사항을 이해하고 실행 계획과 위험을 설명하는 능력을 동일한 기준으로 비교합니다."
        actions={
          <Link href="/talent-assessment/create" className="inline-flex min-h-11 items-center gap-2 rounded-control bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600 transition-colors">
            <ClipboardPlus className="size-4" />새 검증 과제
          </Link>
        }
      />

      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        {assessments.map((assessment) => (
          <article key={assessment.id} className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
            <StatusBadge tone={assessment.tone}>{assessment.status}</StatusBadge>
            <h2 className="mt-3 text-xl font-black tracking-tight text-app-foreground">{assessment.title}</h2>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-app-border py-4 text-sm">
              <div><dt className="text-xs text-app-muted">제출 인원</dt><dd className="mt-1 font-black text-app-foreground">{assessment.candidates}명</dd></div>
              <div><dt className="text-xs text-app-muted">마감일</dt><dd className="mt-1 font-black text-app-foreground">{assessment.due}</dd></div>
            </dl>
            <p className="mt-4 text-sm text-app-muted">비교 근거 · {assessment.evidence}</p>
            <Link href={`/assessments/${assessment.id}`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-app-border-strong font-bold text-app-foreground hover:border-brand-300 hover:text-brand-700">
              응답 비교하기<ArrowRight className="size-4" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
