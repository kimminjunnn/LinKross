"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  FileCheck,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Briefcase,
  ShieldAlert,
} from "lucide-react";
import { getDraftSubmission, CandidateSubmission } from "@/lib/submission";

export default function SubmissionCompletePage() {
  const [submission, setSubmission] = useState<CandidateSubmission | null>(null);

  useEffect(() => {
    // Sample or last submission retrieval
    const data = getDraftSubmission("ast_sample_01");
    setSubmission(data);
  }, []);

  const submittedTimeStr = submission?.submittedAt
    ? new Date(submission.submittedAt).toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "2026년 8월 11일 11:38";

  const durationMin = submission?.durationSeconds
    ? Math.floor(submission.durationSeconds / 60)
    : 12;

  const durationSec = submission?.durationSeconds
    ? submission.durationSeconds % 60
    : 28;

  return (
    <div className="mx-auto max-w-3xl py-12 px-4 space-y-8">
      {/* Hero Card */}
      <div className="rounded-[var(--radius-card)] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 shadow-sm text-center space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 mx-auto">
          <CheckCircle2 className="h-9 w-9" />
        </div>

        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> 제출 정상 완료
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-app-foreground tracking-tight">
            과제 제출이 완료되었습니다!
          </h1>
          <p className="text-xs sm:text-sm text-app-muted max-w-lg mx-auto leading-relaxed">
            제출하신 사전 과제 답변과 실행 계획이 저장되었습니다. 발주자가 원문 및 루브릭 근거를 바탕으로 비교 검토를 진행합니다.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 max-w-md mx-auto text-left">
          <div className="rounded-xl border border-emerald-100 bg-white p-3.5 shadow-2xs">
            <span className="text-[11px] text-app-muted">제출 일시</span>
            <p className="text-xs font-bold text-app-foreground mt-1 truncate">{submittedTimeStr}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-white p-3.5 shadow-2xs">
            <span className="text-[11px] text-app-muted">소요 시간</span>
            <p className="text-xs font-bold text-brand-600 mt-1">
              {durationMin}분 {durationSec}초
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-xl border border-emerald-100 bg-white p-3.5 shadow-2xs">
            <span className="text-[11px] text-app-muted">제출 섹션</span>
            <p className="text-xs font-bold text-emerald-700 mt-1">4 / 4개 전체 작성</p>
          </div>
        </div>
      </div>

      {/* Summary Box */}
      <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-app-foreground border-b border-app-border pb-3 flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-brand-500" />
          제출한 응답 카테고리 요약
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-app-border bg-app-surface-subtle p-3.5 flex items-center gap-3">
            <HelpCircle className="h-4 w-4 text-brand-500 shrink-0" />
            <div>
              <p className="font-bold text-app-foreground">1. 확인 질문</p>
              <p className="text-app-muted text-[11px]">
                {submission?.questions.length || 3}개 질문 항목 제출 완료
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-app-border bg-app-surface-subtle p-3.5 flex items-center gap-3">
            <FileCheck className="h-4 w-4 text-brand-500 shrink-0" />
            <div>
              <p className="font-bold text-app-foreground">2. 요구사항 이해 요약</p>
              <p className="text-app-muted text-[11px]">
                {submission?.summary.length || 240}자 작성 완료
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-app-border bg-app-surface-subtle p-3.5 flex items-center gap-3">
            <Briefcase className="h-4 w-4 text-brand-500 shrink-0" />
            <div>
              <p className="font-bold text-app-foreground">3. 실행 계획</p>
              <p className="text-app-muted text-[11px]">주차별 마일스톤 작성 완료</p>
            </div>
          </div>

          <div className="rounded-xl border border-app-border bg-app-surface-subtle p-3.5 flex items-center gap-3">
            <ShieldAlert className="h-4 w-4 text-brand-500 shrink-0" />
            <div>
              <p className="font-bold text-app-foreground">4. 예상 리스크 및 대응</p>
              <p className="text-app-muted text-[11px]">
                {submission?.risks.length || 2}개 리스크 항목 식별 완료
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="text-center pt-2">
        <Link
          href="/assessments"
          className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-app-foreground px-6 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-md"
        >
          검증 목록으로 돌아가기
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
