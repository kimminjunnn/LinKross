"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Eye,
  X,
  FileText,
  Check,
  FolderKanban,
  Award,
} from "lucide-react";
import { getDraftSubmission, CandidateSubmission } from "@/lib/submission";
import { getAssessmentById, TalentAssessment } from "@/lib/assessments";

export default function SubmissionCompleteScreen() {
  const router = useRouter();
  const [submission, setSubmission] = useState<CandidateSubmission | null>(null);
  const [assessment, setAssessment] = useState<TalentAssessment | null>(null);
  const [isReadOnlyModalOpen, setIsReadOnlyModalOpen] = useState(false);

  useEffect(() => {
    // Retrieve submission and assessment data from localStorage
    const subData = getDraftSubmission("ast_sample_01");
    setSubmission(subData);

    if (subData?.assessmentId) {
      const astData = getAssessmentById(subData.assessmentId);
      setAssessment(astData);
    }
  }, []);

  // Format Submission Time (e.g. 2026.08.11 10:42)
  const formattedSubmissionTime = submission?.submittedAt
    ? (() => {
        const d = new Date(submission.submittedAt);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        return `${year}.${month}.${day} ${hours}:${minutes}`;
      })()
    : "2026.08.11 10:42";

  // Format Time Spent (e.g. 42분 18초)
  const formattedTimeSpent = submission?.durationSeconds
    ? (() => {
        const mins = Math.floor(submission.durationSeconds / 60);
        const secs = submission.durationSeconds % 60;
        return `${mins}분 ${secs}초`;
      })()
    : "42분 18초";

  const projectName = assessment?.projectName || "쇼핑몰 MVP 개발";

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Main Content — Centered */}
        <div className="space-y-4">
          {/* Large Success Icon */}
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/30">
              <CheckCircle2 className="h-11 w-11 stroke-[2.5]" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-app-foreground">
              과제가 제출되었습니다.
            </h1>
            <p className="text-sm sm:text-base text-app-muted font-medium">
              발주자의 평가가 완료되면 결과를 확인할 수 있습니다.
            </p>
          </div>
        </div>

        {/* Submission Summary Card */}
        <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 sm:p-7 shadow-sm text-left space-y-5">
          <div className="flex items-center justify-between border-b border-app-border pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-app-muted">
              Submission Summary
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> 제출 완료
            </span>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <dt className="text-app-muted">Project</dt>
              <dd className="font-bold text-sm text-app-foreground mt-0.5">{projectName}</dd>
            </div>
            <div>
              <dt className="text-app-muted">Submission Time</dt>
              <dd className="font-bold text-sm text-app-foreground mt-0.5 font-mono">
                {formattedSubmissionTime}
              </dd>
            </div>
            <div>
              <dt className="text-app-muted">Time Spent</dt>
              <dd className="font-bold text-sm text-brand-600 mt-0.5 font-mono">
                {formattedTimeSpent}
              </dd>
            </div>
          </dl>

          {/* Submitted Sections */}
          <div className="border-t border-app-border pt-4 space-y-2.5">
            <span className="text-xs font-bold text-app-foreground">제출된 항목 (4/4)</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50/70 border border-emerald-100 px-3 py-2 text-emerald-900 font-semibold">
                <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                <span>확인 질문</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50/70 border border-emerald-100 px-3 py-2 text-emerald-900 font-semibold">
                <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                <span>요구사항 이해 요약</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50/70 border border-emerald-100 px-3 py-2 text-emerald-900 font-semibold">
                <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                <span>실행 계획</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50/70 border border-emerald-100 px-3 py-2 text-emerald-900 font-semibold">
                <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                <span>예상 리스크 및 대응방안</span>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Information Card (No Candidate Score Displayed) */}
        <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface-subtle p-6 text-left space-y-2">
          <div className="flex items-center gap-2 text-app-foreground">
            <Award className="h-4 w-4 text-brand-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-app-foreground">
              평가 방식
            </h2>
          </div>
          <p className="text-xs text-app-muted leading-relaxed font-medium">
            발주자는 요구사항 이해도, 질문의 적절성, 실행 계획, 리스크 대응 능력을 기준으로 지원자의 응답을 비교합니다.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {/* Secondary Button: 제출 내용 확인 (Read-only Modal) */}
          <button
            type="button"
            onClick={() => setIsReadOnlyModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border border-app-border bg-app-surface px-6 py-3 text-xs font-bold text-app-foreground hover:bg-app-surface-subtle shadow-xs transition-colors"
          >
            <Eye className="h-4 w-4 text-app-muted" />
            제출 내용 확인
          </button>

          {/* Primary Button: 프로젝트 목록으로 */}
          <button
            type="button"
            onClick={() => router.push("/projects")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] bg-brand-500 px-7 py-3 text-xs font-bold text-white shadow-md hover:bg-brand-600 active:scale-[0.98] transition-all"
          >
            <FolderKanban className="h-4 w-4" />
            프로젝트 목록으로
          </button>
        </div>
      </div>

      {/* Read-Only Submitted Answers Modal */}
      {isReadOnlyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-2xl border border-app-border bg-white p-6 shadow-2xl space-y-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-app-border pb-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Read-Only 모드
                </span>
                <h3 className="text-lg font-bold text-app-foreground mt-1">
                  제출한 사전 과제 답변 확인
                </h3>
              </div>
              <button
                onClick={() => setIsReadOnlyModalOpen(false)}
                className="rounded-lg p-1.5 text-app-muted hover:bg-slate-100 hover:text-app-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 text-xs text-app-foreground pr-2">
              {/* Section 01 */}
              <div className="rounded-xl border border-app-border p-4 bg-app-surface-subtle space-y-2">
                <h4 className="font-bold text-sm text-app-foreground flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-brand-500" />
                  01. 확인 질문
                </h4>
                <ul className="space-y-2 text-app-muted">
                  {submission?.questions && submission.questions.length > 0 ? (
                    submission.questions.map((q, idx) => (
                      <li key={idx} className="bg-white p-3 rounded-lg border border-app-border text-app-foreground font-medium">
                        <strong>Q{idx + 1}.</strong> {q}
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400">제출된 질문이 없습니다.</li>
                  )}
                </ul>
              </div>

              {/* Section 02 */}
              <div className="rounded-xl border border-app-border p-4 bg-app-surface-subtle space-y-2">
                <h4 className="font-bold text-sm text-app-foreground flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-brand-500" />
                  02. 요구사항 이해 요약
                </h4>
                <div className="bg-white p-4 rounded-lg border border-app-border text-app-foreground leading-relaxed whitespace-pre-wrap font-medium">
                  {submission?.summary || "요약 내용이 없습니다."}
                </div>
              </div>

              {/* Section 03 */}
              <div className="rounded-xl border border-app-border p-4 bg-app-surface-subtle space-y-2">
                <h4 className="font-bold text-sm text-app-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-brand-500" />
                  03. 실행 계획
                </h4>
                <div className="bg-white p-4 rounded-lg border border-app-border text-app-foreground font-mono leading-relaxed whitespace-pre-wrap">
                  {submission?.executionPlan || "실행 계획이 없습니다."}
                </div>
              </div>

              {/* Section 04 */}
              <div className="rounded-xl border border-app-border p-4 bg-app-surface-subtle space-y-2">
                <h4 className="font-bold text-sm text-app-foreground flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-brand-500" />
                  04. 예상 리스크 및 대응방안
                </h4>
                <div className="overflow-x-auto bg-white rounded-lg border border-app-border">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-app-border bg-slate-50 text-app-muted font-semibold">
                        <th className="p-3">Risk</th>
                        <th className="p-3 w-20">Impact</th>
                        <th className="p-3">Mitigation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app-border">
                      {submission?.risks && submission.risks.length > 0 ? (
                        submission.risks.map((item) => (
                          <tr key={item.id}>
                            <td className="p-3 font-medium">{item.risk}</td>
                            <td className="p-3">
                              <span className="inline-block rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-800 text-[11px]">
                                {item.impact}
                              </span>
                            </td>
                            <td className="p-3 text-app-muted">{item.mitigation}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-3 text-slate-400 text-center">
                            등록된 리스크가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="border-t border-app-border pt-3 text-right">
              <button
                onClick={() => setIsReadOnlyModalOpen(false)}
                className="rounded-xl bg-app-foreground px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
