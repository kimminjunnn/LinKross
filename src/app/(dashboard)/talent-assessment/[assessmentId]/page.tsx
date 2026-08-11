"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  Clock,
  Briefcase,
  Copy,
  ExternalLink,
  Users,
  Percent,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  FileCheck,
  ShieldAlert,
} from "lucide-react";
import { getAssessmentById, TalentAssessment } from "@/lib/assessments";

export default function TalentAssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.assessmentId as string;

  const [assessment, setAssessment] = useState<TalentAssessment | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (assessmentId) {
      const data = getAssessmentById(assessmentId);
      setAssessment(data);
    }
  }, [assessmentId]);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/talent-assessment/${assessmentId}/respond`
    : `https://linkross.app/talent-assessment/${assessmentId}/respond`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!assessment) {
    return (
      <div className="mx-auto max-w-4xl py-16 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 mb-4">
          <Sparkles className="h-6 w-6 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-app-foreground">역량검증 과제를 찾을 수 없습니다.</h2>
        <p className="mt-2 text-sm text-app-muted">요청하신 과제가 존재하지 않거나 생성되지 않았습니다.</p>
        <Link
          href="/talent-assessment/create"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> 새 과제 등록하러 가기
        </Link>
      </div>
    );
  }

  const {
    projectName,
    projectType,
    budget,
    devPeriod,
    document,
    timeLimit,
    requiredResponses,
    evaluationCriteria,
    status,
    createdAt,
    applicantCount,
  } = assessment;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-app-muted">
        <Link href="/assessments" className="hover:text-app-foreground transition-colors">
          인재 역량검증
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-app-foreground">{projectName}</span>
      </div>

      {/* Success Hero Card */}
      <div className="rounded-[var(--radius-card)] border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> 등록 완료 (ID: {assessment.id})
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-app-foreground tracking-tight">
              {projectName} 역량검증 과제
            </h1>
            <p className="text-sm text-app-muted">
              지원자에게 아래 제출 링크를 전달하면 제한시간 동안 응답을 제출받을 수 있습니다.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  링크 복사됨!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-emerald-700" />
                  지원자용 링크 복사
                </>
              )}
            </button>
          </div>
        </div>

        {/* Share Link Banner */}
        <div className="mt-6 flex items-center justify-between rounded-xl border border-emerald-200/80 bg-white p-3.5 text-xs text-slate-700">
          <span className="truncate font-mono font-medium text-slate-600">{shareUrl}</span>
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1 font-semibold text-brand-600 hover:underline ml-3"
          >
            미리보기 <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Left Column (Details) */}
        <div className="sm:col-span-2 space-y-6">
          {/* Project Summary Card */}
          <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm">
            <h2 className="text-base font-bold text-app-foreground border-b border-app-border pb-3 mb-4">
              프로젝트 및 요구사항 스펙
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-app-muted">프로젝트 유형</dt>
                <dd className="font-semibold text-app-foreground mt-0.5">{projectType}</dd>
              </div>
              <div>
                <dt className="text-xs text-app-muted">예산</dt>
                <dd className="font-semibold text-app-foreground mt-0.5">{budget}</dd>
              </div>
              <div>
                <dt className="text-xs text-app-muted">개발 기간</dt>
                <dd className="font-semibold text-app-foreground mt-0.5">{devPeriod}</dd>
              </div>
              <div>
                <dt className="text-xs text-app-muted">제한시간</dt>
                <dd className="font-semibold text-brand-600 mt-0.5">{timeLimit}</dd>
              </div>
            </dl>

            {/* Document Box */}
            {document && (
              <div className="mt-6 rounded-xl border border-app-border bg-app-surface-subtle p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-app-foreground">{document.name}</p>
                    <p className="text-[11px] text-app-muted">{document.size} • PDF 문서</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  첨부됨
                </span>
              </div>
            )}
          </div>

          {/* Required Responses */}
          <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm">
            <h2 className="text-base font-bold text-app-foreground border-b border-app-border pb-3 mb-4">
              필수 제출 항목 (Required Responses)
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`p-3.5 rounded-xl border flex items-center gap-2.5 ${
                  requiredResponses.questions ? "border-brand-200 bg-brand-50/40 text-brand-900" : "border-gray-200 opacity-50"
                }`}
              >
                <HelpCircle className="h-4 w-4 text-brand-500" />
                <span className="text-xs font-semibold">1. 확인 질문</span>
              </div>

              <div
                className={`p-3.5 rounded-xl border flex items-center gap-2.5 ${
                  requiredResponses.summary ? "border-brand-200 bg-brand-50/40 text-brand-900" : "border-gray-200 opacity-50"
                }`}
              >
                <FileCheck className="h-4 w-4 text-brand-500" />
                <span className="text-xs font-semibold">2. 요구사항 이해 요약</span>
              </div>

              <div
                className={`p-3.5 rounded-xl border flex items-center gap-2.5 ${
                  requiredResponses.plan ? "border-brand-200 bg-brand-50/40 text-brand-900" : "border-gray-200 opacity-50"
                }`}
              >
                <Briefcase className="h-4 w-4 text-brand-500" />
                <span className="text-xs font-semibold">3. 실행 계획</span>
              </div>

              <div
                className={`p-3.5 rounded-xl border flex items-center gap-2.5 ${
                  requiredResponses.risk ? "border-brand-200 bg-brand-50/40 text-brand-900" : "border-gray-200 opacity-50"
                }`}
              >
                <ShieldAlert className="h-4 w-4 text-brand-500" />
                <span className="text-xs font-semibold">4. 예상 리스크 및 대응</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Rubric & Status) */}
        <div className="space-y-6">
          {/* Status & Applicants Card */}
          <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-app-muted mb-2">
              지원자 제출 현황
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-app-foreground">{applicantCount}</span>
              <span className="text-sm font-medium text-app-muted">명 제출 완료</span>
            </div>
            <p className="mt-2 text-xs text-app-muted leading-relaxed">
              지원자가 과제를 제출하면 원문 비교 분석 및 AI 종합 루브릭 스코어가 자동 생성됩니다.
            </p>
          </div>

          {/* Evaluation Criteria Weights */}
          <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-app-muted mb-4 flex items-center gap-1">
              <Percent className="h-3.5 w-3.5 text-brand-500" /> 평가 루브릭 가중치 (총 100점)
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium text-app-foreground mb-1">
                  <span>요구사항 이해</span>
                  <span className="font-bold text-brand-600">{evaluationCriteria.requirements}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${evaluationCriteria.requirements}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-app-foreground mb-1">
                  <span>확인 질문</span>
                  <span className="font-bold text-brand-600">{evaluationCriteria.questions}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-brand-400 rounded-full" style={{ width: `${evaluationCriteria.questions}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-app-foreground mb-1">
                  <span>실행 계획</span>
                  <span className="font-bold text-brand-600">{evaluationCriteria.workPlan}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-accent-500 rounded-full" style={{ width: `${evaluationCriteria.workPlan}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-app-foreground mb-1">
                  <span>리스크 및 대응</span>
                  <span className="font-bold text-brand-600">{evaluationCriteria.riskMitigation}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${evaluationCriteria.riskMitigation}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
