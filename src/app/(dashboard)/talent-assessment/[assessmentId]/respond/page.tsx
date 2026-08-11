"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  FileText,
  Plus,
  Trash2,
  AlertTriangle,
  HelpCircle,
  FileCheck,
  Briefcase,
  ShieldAlert,
  Save,
  ArrowRight,
  X,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  Database,
  Lock,
} from "lucide-react";
import { getAssessmentById, TalentAssessment } from "@/lib/assessments";
import {
  getDraftSubmission,
  saveDraftSubmission,
  finalizeSubmission,
  CandidateSubmission,
  RiskItem,
} from "@/lib/submission";

export default function CandidateRespondPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = (params.assessmentId as string) || "ast_sample_01";

  // Assessment & Candidate State
  const [assessment, setAssessment] = useState<TalentAssessment | null>(null);
  const [submission, setSubmission] = useState<CandidateSubmission | null>(null);

  // Form Field States
  const [questions, setQuestions] = useState<string[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [executionPlan, setExecutionPlan] = useState<string>("");
  const [risks, setRisks] = useState<RiskItem[]>([]);

  // Timer State (Default 47분 32초 = 2852 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(47 * 60 + 32);
  const [isTimerExpired, setIsTimerExpired] = useState<boolean>(false);

  // UI States
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"saved" | "saving" | "failed">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string>("방금 전");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial Load
  useEffect(() => {
    const ast = getAssessmentById(assessmentId);
    setAssessment(ast);

    const sub = getDraftSubmission(assessmentId);
    setSubmission(sub);
    setQuestions(sub.questions.length > 0 ? sub.questions : ["", "", ""]);
    setSummary(sub.summary || "");
    setExecutionPlan(sub.executionPlan || "");
    setRisks(
      sub.risks.length > 0
        ? sub.risks
        : [
            { id: "r1", risk: "", impact: "상", mitigation: "" },
            { id: "r2", risk: "", impact: "중", mitigation: "" },
          ]
    );

    if (sub.status === "submitted") {
      router.push("/talent-assessment/submission-complete");
    }
  }, [assessmentId, router]);

  // Countdown Timer Effect
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsTimerExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimerExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Autosave effect (Trigger on state changes)
  useEffect(() => {
    if (!submission || isTimerExpired) return;

    setAutosaveStatus("saving");
    const timeout = setTimeout(() => {
      const updated: CandidateSubmission = {
        ...submission,
        questions: questions.filter((q) => q.trim().length > 0),
        summary,
        executionPlan,
        risks,
      };

      const success = saveDraftSubmission(updated);
      if (success) {
        setAutosaveStatus("saved");
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
        setLastSavedTime(timeStr);
      } else {
        setAutosaveStatus("failed");
      }
    }, 1200);

    return () => clearTimeout(timeout);
  }, [questions, summary, executionPlan, risks, submission, isTimerExpired]);

  // Format Timer String (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Section 01: Questions handlers
  const handleAddQuestion = () => {
    if (isTimerExpired) return;
    setQuestions((prev) => [...prev, ""]);
  };

  const handleUpdateQuestion = (index: number, val: string) => {
    if (isTimerExpired) return;
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleRemoveQuestion = (index: number) => {
    if (isTimerExpired) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Section 03: Helper Suggestions Handler
  const handleAddSuggestion = (text: string) => {
    if (isTimerExpired) return;
    setExecutionPlan((prev) => {
      if (prev.includes(text)) return prev;
      const prefix = prev.trim() ? `${prev}\n→ ` : "→ ";
      return `${prefix}${text}`;
    });
  };

  // Section 04: Risk Table Handlers
  const handleAddRisk = () => {
    if (isTimerExpired) return;
    const newRisk: RiskItem = {
      id: `r_${Date.now()}`,
      risk: "",
      impact: "중",
      mitigation: "",
    };
    setRisks((prev) => [...prev, newRisk]);
  };

  const handleUpdateRisk = (id: string, field: keyof RiskItem, val: string) => {
    if (isTimerExpired) return;
    setRisks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveRisk = (id: string) => {
    if (isTimerExpired) return;
    setRisks((prev) => prev.filter((item) => item.id !== id));
  };

  // Completed Section Count
  const completedSectionsCount = [
    questions.some((q) => q.trim().length > 0),
    summary.trim().length > 0,
    executionPlan.trim().length > 0,
    risks.some((r) => r.risk.trim().length > 0),
  ].filter(Boolean).length;

  // Submit Handler
  const handleFinalSubmit = async () => {
    if (!submission || isTimerExpired) return;

    setIsSubmitting(true);
    const initialSeconds = 60 * 60; // 60 mins default
    const durationSec = Math.max(0, initialSeconds - timeLeft);

    const updated: CandidateSubmission = {
      ...submission,
      questions,
      summary,
      executionPlan,
      risks,
    };

    await new Promise((resolve) => setTimeout(resolve, 600));

    finalizeSubmission(updated, durationSec);
    router.push("/talent-assessment/submission-complete");
  };

  const projectName = assessment?.projectName || "쇼핑몰 MVP 개발";

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-app-border bg-white/95 px-6 py-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-app-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white font-extrabold text-xs tracking-tighter">
              LK
            </span>
            LinKross
          </Link>
          <div className="h-4 w-px bg-app-border" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-app-muted">과제:</span>
            <h1 className="text-sm font-bold text-app-foreground">{projectName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              isTimerExpired
                ? "bg-rose-100 text-rose-800"
                : submission?.status === "submitted"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {isTimerExpired ? (
              <>
                <Lock className="h-3.5 w-3.5 text-rose-600" /> 제출 제한됨 (시간 만료)
              </>
            ) : (
              <>
                <Clock className="h-3.5 w-3.5 text-amber-600" /> 제출 전
              </>
            )}
          </span>

          {/* Countdown Timer */}
          <div
            className={`flex items-center gap-2 rounded-xl border px-4 py-1.5 font-mono text-base font-bold shadow-inner ${
              timeLeft < 300
                ? "border-rose-300 bg-rose-50 text-rose-600 animate-pulse"
                : "border-brand-200 bg-brand-50 text-brand-700"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* Timer Expired Warning Banner */}
      {isTimerExpired && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-rose-600 shrink-0" />
            <div>
              <h3 className="font-bold text-sm">제출 시간이 만료되었습니다.</h3>
              <p className="text-xs mt-0.5">제출 시간이 종료되어 답변 수정 및 제출이 제한됩니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column — Requirements (5 cols) */}
        <aside className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-app-border pb-4 mb-4">
              <h2 className="text-base font-bold text-app-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-500" />
                프로젝트 요구사항
              </h2>
              <span className="text-xs text-brand-600 font-semibold bg-brand-50 px-2.5 py-1 rounded-full">
                MVP Scope
              </span>
            </div>

            {/* Checklist items */}
            <ul className="space-y-2.5">
              {[
                "회원가입 / 로그인",
                "상품 목록",
                "상품 상세",
                "장바구니",
                "주문 기능",
                "관리자 페이지",
                "REST API",
                "PostgreSQL",
              ].map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-app-border bg-app-surface-subtle px-3.5 py-2.5 text-xs font-semibold text-app-foreground"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    {item}
                  </span>
                  <span className="text-[10px] text-app-muted font-normal">필수 포함</span>
                </li>
              ))}
            </ul>

            {/* Full Document Viewer Button */}
            <div className="mt-6 border-t border-app-border pt-4">
              <button
                type="button"
                onClick={() => setIsDocumentModalOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-brand-200 bg-brand-50/60 px-4 py-2.5 text-xs font-bold text-brand-700 hover:bg-brand-100 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                요구사항 문서 전체보기
              </button>
            </div>
          </div>
        </aside>

        {/* Right Column — Response Form (7 cols) */}
        <main className="lg:col-span-7 space-y-8">
          {/* Section 01: 확인 질문 */}
          <section className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-app-border pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 font-bold text-xs">
                  01
                </div>
                <h3 className="font-bold text-base text-app-foreground">확인 질문</h3>
              </div>
              <span className="text-xs text-app-muted">요구사항 모호성 / 확인이 필요한 사항 역질의</span>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-app-muted w-6 text-center">
                    Q{idx + 1}.
                  </span>
                  <input
                    type="text"
                    disabled={isTimerExpired}
                    value={q}
                    onChange={(e) => handleUpdateQuestion(idx, e.target.value)}
                    placeholder="예: PG 결제 연동 테스트 시 선호하시는 결제 모듈이 있으신가요?"
                    className="flex-1 rounded-[var(--radius-control)] border border-app-border bg-app-surface px-3.5 py-2.5 text-xs text-app-foreground focus:border-brand-500 focus:outline-none transition-colors disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    disabled={isTimerExpired || questions.length <= 1}
                    onClick={() => handleRemoveQuestion(idx)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-app-border text-app-muted hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={isTimerExpired}
              onClick={handleAddQuestion}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> 질문 추가
            </button>
          </section>

          {/* Section 02: 요구사항 이해 요약 */}
          <section className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-app-border pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 font-bold text-xs">
                  02
                </div>
                <h3 className="font-bold text-base text-app-foreground">요구사항 이해 요약</h3>
              </div>
              <span className="text-xs font-mono text-app-muted">
                {summary.length} / 1000자
              </span>
            </div>

            <textarea
              rows={5}
              maxLength={1000}
              disabled={isTimerExpired}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="프로젝트의 목적과 필수 기능 명세를 본인의 언어로 요약 정리하세요."
              className="w-full rounded-[var(--radius-control)] border border-app-border bg-app-surface p-4 text-xs text-app-foreground placeholder-app-muted focus:border-brand-500 focus:outline-none transition-colors disabled:bg-slate-100"
            />
          </section>

          {/* Section 03: 실행 계획 */}
          <section className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-app-border pb-4 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 font-bold text-xs">
                  03
                </div>
                <h3 className="font-bold text-base text-app-foreground">실행 계획</h3>
              </div>
              <span className="text-xs text-app-muted">주차별 마일스톤 및 아키텍처 수립</span>
            </div>

            {/* Helper Suggestions */}
            <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-app-muted font-medium flex items-center gap-1 mr-1">
                <Sparkles className="h-3.5 w-3.5 text-brand-500" /> 추천 키워드:
              </span>
              {[
                "환경 구성",
                "DB",
                "API",
                "Frontend",
                "Testing",
                "Deployment",
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isTimerExpired}
                  onClick={() => handleAddSuggestion(item)}
                  className="rounded-full border border-app-border bg-app-surface-subtle px-2.5 py-1 font-semibold text-app-foreground hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-colors text-[11px]"
                >
                  + {item}
                </button>
              ))}
            </div>

            <textarea
              rows={6}
              disabled={isTimerExpired}
              value={executionPlan}
              onChange={(e) => setExecutionPlan(e.target.value)}
              placeholder="단계별 개발 계획, 기술 스택, 마일스톤을 구체적으로 작성하세요."
              className="w-full rounded-[var(--radius-control)] border border-app-border bg-app-surface p-4 text-xs font-mono text-app-foreground placeholder-app-muted focus:border-brand-500 focus:outline-none transition-colors disabled:bg-slate-100"
            />
          </section>

          {/* Section 04: 예상 리스크 및 대응방안 */}
          <section className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-app-border pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 font-bold text-xs">
                  04
                </div>
                <h3 className="font-bold text-base text-app-foreground">예상 리스크 및 대응방안</h3>
              </div>
              <button
                type="button"
                disabled={isTimerExpired}
                onClick={handleAddRisk}
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> 리스크 추가
              </button>
            </div>

            {/* Repeatable Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-app-border bg-app-surface-subtle text-app-muted font-semibold">
                    <th className="p-2.5 rounded-l-lg">Risk (리스크)</th>
                    <th className="p-2.5 w-24">Impact (영향도)</th>
                    <th className="p-2.5">Mitigation (대응방안)</th>
                    <th className="p-2.5 w-10 text-center rounded-r-lg"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {risks.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2.5">
                        <input
                          type="text"
                          disabled={isTimerExpired}
                          value={item.risk}
                          onChange={(e) => handleUpdateRisk(item.id, "risk", e.target.value)}
                          placeholder="예: 외부 PG 연동 지연"
                          className="w-full rounded-lg border border-app-border bg-app-surface px-2.5 py-1.5 text-xs text-app-foreground focus:border-brand-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <select
                          disabled={isTimerExpired}
                          value={item.impact}
                          onChange={(e) =>
                            handleUpdateRisk(item.id, "impact", e.target.value as "상" | "중" | "하")
                          }
                          className="w-full rounded-lg border border-app-border bg-app-surface px-2 py-1.5 text-xs font-bold text-app-foreground focus:border-brand-500 focus:outline-none"
                        >
                          <option value="상">상</option>
                          <option value="중">중</option>
                          <option value="하">하</option>
                        </select>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          disabled={isTimerExpired}
                          value={item.mitigation}
                          onChange={(e) => handleUpdateRisk(item.id, "mitigation", e.target.value)}
                          placeholder="예: 샌드박스 키 사전 확보"
                          className="w-full rounded-lg border border-app-border bg-app-surface px-2.5 py-1.5 text-xs text-app-foreground focus:border-brand-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          disabled={isTimerExpired || risks.length <= 1}
                          onClick={() => handleRemoveRisk(item.id)}
                          className="text-app-muted hover:text-rose-600 disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-40 flex items-center justify-between rounded-2xl border border-app-border bg-white/95 p-4 shadow-xl backdrop-blur-md">
        {/* Autosave Status Indicator */}
        <div className="flex items-center gap-2 text-xs font-medium">
          {autosaveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              자동 저장됨 · {lastSavedTime}
            </span>
          )}
          {autosaveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
              저장 중...
            </span>
          )}
          {autosaveStatus === "failed" && (
            <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              저장 실패 · 다시 시도
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isTimerExpired}
            onClick={() => {
              if (submission) saveDraftSubmission(submission);
            }}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-app-border bg-app-surface px-4 py-2.5 text-xs font-semibold text-app-foreground hover:bg-app-surface-subtle transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4 text-app-muted" /> 임시 저장
          </button>

          <button
            type="button"
            disabled={isTimerExpired}
            onClick={() => setIsSubmitModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-brand-500 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-600 active:scale-[0.98] transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            제출하기
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Modal 1: Requirements Full Document Viewer */}
      {isDocumentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-2xl border border-app-border bg-white p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <h3 className="text-lg font-bold text-app-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-500" />
                {projectName} — 요구사항 명세서 전문
              </h3>
              <button
                onClick={() => setIsDocumentModalOpen(false)}
                className="rounded-lg p-1.5 text-app-muted hover:bg-slate-100 hover:text-app-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs leading-relaxed text-app-foreground pr-2">
              <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 font-semibold text-brand-900">
                📌 본 과제는 쇼핑몰 MVP 웹 애플리케이션 구축을 위한 사전 역량검증 문서입니다.
              </div>

              <h4 className="font-bold text-sm text-app-foreground border-b border-slate-200 pb-1">
                1. 회원가입 및 사용자 인증
              </h4>
              <p>
                - 이메일/비밀번호 기반 회원가입 및 로그인 처리<br />
                - JWT 인증 기반 세션 관리 및 토큰 보안 정책 수립
              </p>

              <h4 className="font-bold text-sm text-app-foreground border-b border-slate-200 pb-1">
                2. 상품 카탈로그 & 장바구니
              </h4>
              <p>
                - 카테고리별 상품 목록 페이징 및 상세 검색<br />
                - 장바구니 담기, 수량 변경 및 선택 삭제
              </p>

              <h4 className="font-bold text-sm text-app-foreground border-b border-slate-200 pb-1">
                3. 주문 및 결제 시스템
              </h4>
              <p>
                - 주문서 작성, 배송지 입력 및 결제 PG사 연동 모듈<br />
                - 재고 상태에 따른 주문 차감 트랜잭션 처리
              </p>

              <h4 className="font-bold text-sm text-app-foreground border-b border-slate-200 pb-1">
                4. 기술 제약 사항
              </h4>
              <p>
                - RESTful API 아키텍처 및 PostgreSQL 데이터베이스 필수 사용<br />
                - 합성 데이터 및 단위 테스트 시나리오 제공 필요
              </p>
            </div>

            <div className="border-t border-app-border pt-3 text-right">
              <button
                onClick={() => setIsDocumentModalOpen(false)}
                className="rounded-xl bg-app-foreground px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Final Submit Confirmation */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-app-border bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-app-foreground">과제를 제출하시겠습니까?</h3>
                <p className="text-xs text-app-muted mt-0.5">
                  제출 후에는 답변을 수정할 수 없습니다.
                </p>
              </div>
            </div>

            {/* Submission Status Metrics */}
            <div className="rounded-xl border border-app-border bg-app-surface-subtle p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-app-muted">Completed sections:</span>
                <span className="font-bold text-emerald-700">{completedSectionsCount} / 4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-app-muted">Remaining time:</span>
                <span className="font-mono font-bold text-brand-600">{formatTime(timeLeft)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="rounded-[var(--radius-control)] border border-app-border px-4 py-2.5 text-xs font-semibold text-app-foreground hover:bg-app-surface-subtle transition-colors"
              >
                취소
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-brand-500 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-600 transition-colors disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    제출 중...
                  </>
                ) : (
                  <>최종 제출</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
