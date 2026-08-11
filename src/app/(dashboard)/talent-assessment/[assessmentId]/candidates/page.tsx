"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  Award,
  Sparkles,
  Star,
  Clock,
  ArrowUpDown,
  Eye,
  UserCheck,
  AlertTriangle,
  X,
  FileCheck,
  HelpCircle,
  Briefcase,
  ShieldAlert,
  ChevronRight,
  ArrowRight,
  FileSpreadsheet,
  Info,
} from "lucide-react";
import {
  INITIAL_CANDIDATES,
  MOCK_AI_ANALYSIS,
  CandidateComparisonItem,
  PenaltyInfo,
  getSelectedCandidateId,
  saveSelectedCandidateId,
} from "@/lib/comparison";

export default function CandidateComparisonDashboard() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = (params.assessmentId as string) || "ast_sample_01";

  // Candidates & Selection State
  const [candidates, setCandidates] = useState<CandidateComparisonItem[]>(INITIAL_CANDIDATES);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"finalScore" | "submissionTime">("finalScore");

  // Modals & Toast State
  const [penaltyModalData, setPenaltyModalData] = useState<{
    candidateName: string;
    penalty: PenaltyInfo;
  } | null>(null);

  const [detailModalCandidate, setDetailModalCandidate] = useState<CandidateComparisonItem | null>(null);
  const [selectionTarget, setSelectionTarget] = useState<CandidateComparisonItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedId = getSelectedCandidateId();
    if (savedId) {
      setSelectedCandidateId(savedId);
      setCandidates((prev) =>
        prev.map((c) => ({
          ...c,
          status: c.id === savedId ? "selected" : "submitted",
        }))
      );
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sorting
  const sortedCandidates = [...candidates].sort((a, b) => {
    if (sortBy === "finalScore") {
      return b.finalScore - a.finalScore;
    } else {
      return parseInt(a.submissionTime) - parseInt(b.submissionTime);
    }
  });

  // Action: Select Developer
  const handleConfirmSelect = () => {
    if (!selectionTarget) return;

    const targetId = selectionTarget.id;
    setSelectedCandidateId(targetId);
    saveSelectedCandidateId(targetId);

    setCandidates((prev) =>
      prev.map((c) => ({
        ...c,
        status: c.id === targetId ? "selected" : "submitted",
      }))
    );

    showToast(`'${selectionTarget.name}' 지원자가 프로젝트 개발자로 선정되었습니다.`);
    setSelectionTarget(null);
  };

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-700 bg-emerald-900 px-5 py-3.5 text-white shadow-xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-500 uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" /> Candidate Evaluation Dashboard
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-app-foreground sm:text-3xl">
            지원자 비교
          </h1>
          <p className="mt-1 text-sm text-app-muted">
            동일한 요구사항을 기준으로 지원자의 실무 대응력을 비교하세요.
          </p>
        </div>

        {/* Selected Developer & SOW Button */}
        {selectedCandidate && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
            <div className="text-xs">
              <span className="text-emerald-800 font-bold">선정된 개발자:</span>{" "}
              <span className="font-extrabold text-emerald-900">{selectedCandidate.name}</span>
            </div>
            <button
              onClick={() => router.push("/projects/proj_01/sow")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              업무 명세서 생성하기
            </button>
          </div>
        )}
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Card 1: 지원자 */}
        <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-app-muted">
            <span className="text-xs font-bold uppercase">지원자</span>
            <Users className="h-4 w-4 text-brand-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-app-foreground">3</span>
            <span className="text-xs font-semibold text-app-muted">명</span>
          </div>
        </div>

        {/* Card 2: 제출 완료 */}
        <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-app-muted">
            <span className="text-xs font-bold uppercase">제출 완료</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-app-foreground">3</span>
            <span className="text-xs font-semibold text-app-muted">명</span>
          </div>
        </div>

        {/* Card 3: 평균 점수 */}
        <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-app-muted">
            <span className="text-xs font-bold uppercase">평균 점수</span>
            <Award className="h-4 w-4 text-brand-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-app-foreground">77.9</span>
            <span className="text-xs font-semibold text-app-muted">점</span>
          </div>
        </div>

        {/* Card 4: 최고 점수 */}
        <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-app-muted">
            <span className="text-xs font-bold uppercase">최고 점수</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-brand-600">91.3</span>
            <span className="text-xs font-semibold text-app-muted">점</span>
          </div>
        </div>
      </section>

      {/* Candidate Comparison Table */}
      <section className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-4">
          <div>
            <h2 className="text-base font-bold text-app-foreground">지원자 실무 역량 비교표</h2>
            <p className="text-xs text-app-muted">
              4가지 완료 조건 및 루브릭 비중에 따른 산출 점수와 페널티 현황입니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-app-muted font-medium flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5" /> 정렬:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "finalScore" | "submissionTime")}
              className="rounded-lg border border-app-border bg-app-surface px-3 py-1.5 text-xs font-bold text-app-foreground focus:border-brand-500 focus:outline-none"
            >
              <option value="finalScore">최종점수 높은 순</option>
              <option value="submissionTime">제출시간 빠른 순</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-app-border bg-app-surface-subtle text-app-muted font-semibold">
                <th className="p-3.5">지원자</th>
                <th className="p-3.5 text-center">평판</th>
                <th className="p-3.5 text-center">제출시간</th>
                <th className="p-3.5 text-center">요구사항 이해</th>
                <th className="p-3.5 text-center">질문</th>
                <th className="p-3.5 text-center">작업 계획</th>
                <th className="p-3.5 text-center">리스크 대응</th>
                <th className="p-3.5 text-center">기본점수</th>
                <th className="p-3.5 text-center">페널티</th>
                <th className="p-3.5 text-center">최종점수</th>
                <th className="p-3.5 text-center">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {sortedCandidates.map((c) => {
                const isSelected = selectedCandidateId === c.id;

                return (
                  <tr
                    key={c.id}
                    onClick={() => setDetailModalCandidate(c)}
                    className={`cursor-pointer transition-colors hover:bg-app-surface-subtle/80 ${
                      c.isRecommended ? "bg-amber-50/20" : ""
                    } ${isSelected ? "bg-emerald-50/40" : ""}`}
                  >
                    {/* 지원자 정보 */}
                    <td className="p-3.5 font-bold">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-white text-xs font-extrabold shadow-xs">
                          {c.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-app-foreground">{c.name}</span>
                            {c.isRecommended && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 border border-amber-200">
                                <Sparkles className="h-3 w-3 text-amber-600" /> 추천
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 평판 */}
                    <td className="p-3.5 text-center font-semibold">
                      <div className="inline-flex items-center gap-1 text-amber-600">
                        <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-500" />
                        <span>{c.rating.toFixed(1)}</span>
                      </div>
                    </td>

                    {/* 제출시간 */}
                    <td className="p-3.5 text-center font-mono font-medium text-slate-700">
                      {c.submissionTime}
                    </td>

                    {/* 4가지 항목 점수 */}
                    <td className="p-3.5 text-center font-semibold text-slate-700">
                      {c.scores.requirements}
                    </td>
                    <td className="p-3.5 text-center font-semibold text-slate-700">
                      {c.scores.questions}
                    </td>
                    <td className="p-3.5 text-center font-semibold text-slate-700">
                      {c.scores.workPlan}
                    </td>
                    <td className="p-3.5 text-center font-semibold text-slate-700">
                      {c.scores.risk}
                    </td>

                    {/* 기본점수 */}
                    <td className="p-3.5 text-center font-mono font-semibold text-slate-600">
                      {c.baseScore}
                    </td>

                    {/* 페널티 (Clickable Modal) */}
                    <td className="p-3.5 text-center font-mono">
                      {c.penalty ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPenaltyModalData({
                              candidateName: c.name,
                              penalty: c.penalty!,
                            });
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-1 font-bold text-rose-700 hover:bg-rose-200 transition-colors"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {c.penalty.score}
                        </button>
                      ) : (
                        <span className="text-slate-400 font-semibold">0</span>
                      )}
                    </td>

                    {/* 최종점수 */}
                    <td className="p-3.5 text-center font-mono font-black text-sm text-brand-600">
                      {c.finalScore}
                    </td>

                    {/* 액션 */}
                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailModalCandidate(c)}
                          className="inline-flex items-center gap-1 rounded-lg border border-app-border px-2.5 py-1.5 text-[11px] font-semibold text-app-foreground hover:bg-app-surface transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5 text-app-muted" /> 상세 답변
                        </button>

                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1.5 text-[11px] font-extrabold text-emerald-800">
                            <UserCheck className="h-3.5 w-3.5 text-emerald-600" /> 선정 완료
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectionTarget(c)}
                            className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-brand-600 active:scale-[0.98] transition-all"
                          >
                            개발자로 선정
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Penalty Explanation Modal */}
      {penaltyModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h3 className="font-bold text-base text-rose-900">
                  페널티 감점 세부 내역
                </h3>
              </div>
              <button
                onClick={() => setPenaltyModalData(null)}
                className="rounded-lg p-1 text-app-muted hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-app-muted">대상 지원자:</span>
                <span className="font-bold text-app-foreground">{penaltyModalData.candidateName}</span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-app-muted">Penalty score:</span>
                <span className="font-mono font-extrabold text-rose-600 text-sm">
                  {penaltyModalData.penalty.score} 점
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-app-muted">Reason (사유):</span>
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 font-semibold text-rose-900">
                  {penaltyModalData.penalty.reason}
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Applied date/time:</span>
                <span className="font-mono">{penaltyModalData.penalty.appliedAt}</span>
              </div>
            </div>

            <div className="border-t border-app-border pt-3 text-right">
              <button
                onClick={() => setPenaltyModalData(null)}
                className="rounded-xl bg-app-foreground px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                확인 및 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Evaluation Assistant Panel */}
      <section className="rounded-[var(--radius-card)] border border-brand-200 bg-gradient-to-br from-brand-50/40 via-white to-amber-50/30 p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-brand-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-app-foreground">AI 평가 보조</h2>
            <p className="text-xs text-app-muted">지원자들의 원문 제출서와 요구사항 대조 분석 요약입니다.</p>
          </div>
        </div>

        {/* Example Summary */}
        <div className="rounded-xl border border-brand-200/80 bg-white p-4 text-xs font-medium leading-relaxed text-app-foreground shadow-2xs">
          “{MOCK_AI_ANALYSIS.summary}”
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
          {/* Strengths */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
            <h3 className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Strengths (주요 강점)
            </h3>
            <ul className="space-y-1.5 text-emerald-950 font-medium pl-1">
              {MOCK_AI_ANALYSIS.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Potential Concern */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
            <h3 className="font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Potential Concern (우려 사항)
            </h3>
            <p className="text-amber-950 font-medium leading-relaxed">
              • {MOCK_AI_ANALYSIS.potentialConcern}
            </p>
          </div>
        </div>

        {/* Important Disclaimer */}
        <div className="rounded-xl border border-app-border bg-app-surface-subtle p-3.5 text-center text-xs font-bold text-app-foreground flex items-center justify-center gap-2">
          <Info className="h-4 w-4 text-brand-500" />
          <span>{MOCK_AI_ANALYSIS.disclaimer}</span>
        </div>
      </section>

      {/* Candidate Selection Confirmation Modal */}
      {selectionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-app-border bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 shrink-0">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-app-foreground">
                  이 지원자를 프로젝트 개발자로 선정하시겠습니까?
                </h3>
                <p className="text-xs text-app-muted mt-1 leading-relaxed">
                  선정 완료 시 지원자의 사전 과제 응답을 기반으로 다음 단계인 SOW(업무 명세서) 및 WBS 작성을 진행하게 됩니다.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-app-border bg-app-surface-subtle p-3.5 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-app-muted">선정 대상:</span>
                <span className="font-bold text-app-foreground">{selectionTarget.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-app-muted">최종 점수:</span>
                <span className="font-bold text-brand-600">{selectionTarget.finalScore}점</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectionTarget(null)}
                className="rounded-[var(--radius-control)] border border-app-border px-4 py-2.5 text-xs font-semibold text-app-foreground hover:bg-app-surface-subtle transition-colors"
              >
                취소
              </button>

              <button
                type="button"
                onClick={handleConfirmSelect}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-brand-500 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-600 active:scale-[0.98] transition-all"
              >
                선정하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Read-Only Candidate Detail Modal */}
      {detailModalCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-2xl border border-app-border bg-white p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-app-border pb-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700">
                  <Eye className="h-3 w-3 text-brand-500" /> 지원자 응답 상세 열람
                </span>
                <h3 className="text-lg font-bold text-app-foreground mt-1">
                  {detailModalCandidate.name} 지원자의 제출 내역
                </h3>
              </div>
              <button
                onClick={() => setDetailModalCandidate(null)}
                className="rounded-lg p-1 text-app-muted hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs text-app-foreground pr-2">
              <div className="grid grid-cols-4 gap-3 bg-app-surface-subtle p-3.5 rounded-xl border border-app-border text-center">
                <div>
                  <span className="text-[11px] text-app-muted">요구사항 이해</span>
                  <p className="font-bold text-sm text-app-foreground">{detailModalCandidate.scores.requirements}점</p>
                </div>
                <div>
                  <span className="text-[11px] text-app-muted font-normal">질문</span>
                  <p className="font-bold text-sm text-app-foreground">{detailModalCandidate.scores.questions}점</p>
                </div>
                <div>
                  <span className="text-[11px] text-app-muted font-normal">작업 계획</span>
                  <p className="font-bold text-sm text-app-foreground">{detailModalCandidate.scores.workPlan}점</p>
                </div>
                <div>
                  <span className="text-[11px] text-app-muted font-normal">리스크 대응</span>
                  <p className="font-bold text-sm text-app-foreground">{detailModalCandidate.scores.risk}점</p>
                </div>
              </div>

              <div className="rounded-xl border border-app-border p-4 space-y-2">
                <h4 className="font-bold text-sm text-app-foreground flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-brand-500" />
                  01. 제출된 확인 질문
                </h4>
                <p className="text-app-muted leading-relaxed">
                  1. 인증 처리 방식에서 JWT 토큰의 만료 시간 및 Refresh 토큰 보관 위치에 대한 기준이 선호되시는 방식이 있으신가요?<br />
                  2. PostgreSQL 데이터베이스의 초동 스키마 마이그레이션 도구로 Prisma ORM을 사용하는 것에 동의하시나요?
                </p>
              </div>

              <div className="rounded-xl border border-app-border p-4 space-y-2">
                <h4 className="font-bold text-sm text-app-foreground flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-brand-500" />
                  02. 요구사항 이해 요약
                </h4>
                <p className="text-app-muted leading-relaxed">
                  본 프로젝트는 쇼핑몰 MVP 서비스 구축을 목적으로 하며, 핵심 사용자 흐름인 회원가입/로그인, 상품 목록/상세, 장바구니, 주문 결제 및 관리자 관리 페이지를 8주 이내에 구축하는 것을 목표로 합니다.
                </p>
              </div>

              <div className="rounded-xl border border-app-border p-4 space-y-2">
                <h4 className="font-bold text-sm text-app-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-brand-500" />
                  03. 실행 계획
                </h4>
                <p className="font-mono text-app-muted leading-relaxed">
                  → 환경 구성: Next.js 및 TypeScript 개발 환경 초기화<br />
                  → DB: PostgreSQL 데이터베이스 스키마 설계 및 Prisma 설정<br />
                  → API: 회원 인증 및 상품/장바구니 RESTful API 구현
                </p>
              </div>
            </div>

            <div className="border-t border-app-border pt-3 text-right">
              <button
                onClick={() => setDetailModalCandidate(null)}
                className="rounded-xl bg-app-foreground px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
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
