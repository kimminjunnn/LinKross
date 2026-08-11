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
  Check,
  FileText,
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

  // Dynamically load candidates based on assessmentId (Project A: 3, Project B: 2, Project C: 1)
  const getCandidateListForAssessment = (id: string) => {
    if (id === "admin-automation") {
      return INITIAL_CANDIDATES.slice(1); // 2 candidates (Alex Kim, David Lee)
    } else if (id === "brand-site") {
      return [INITIAL_CANDIDATES[0]]; // 1 candidate (Gupta Haep)
    } else {
      return INITIAL_CANDIDATES; // 3 candidates (Gupta Haep, Alex Kim, David Lee)
    }
  };

  const [candidates, setCandidates] = useState<CandidateComparisonItem[]>(() =>
    getCandidateListForAssessment(assessmentId)
  );
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"submissionTime" | "name">("submissionTime");

  // Modals & Toast State
  const [penaltyModalData, setPenaltyModalData] = useState<{
    candidateName: string;
    penalty: PenaltyInfo;
  } | null>(null);

  const [detailModalCandidate, setDetailModalCandidate] = useState<CandidateComparisonItem | null>(null);
  const [selectionTarget, setSelectionTarget] = useState<CandidateComparisonItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const list = getCandidateListForAssessment(assessmentId);
    const savedId = getSelectedCandidateId();
    const isSavedCandidateInList = savedId && list.some((c) => c.id === savedId);

    setCandidates(
      list.map((c) => ({
        ...c,
        status: isSavedCandidateInList && c.id === savedId ? "selected" : "submitted",
      }))
    );

    if (isSavedCandidateInList) {
      setSelectedCandidateId(savedId);
    } else {
      setSelectedCandidateId(null);
    }
  }, [assessmentId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sorting
  const sortedCandidates = [...candidates].sort((a, b) => {
    if (sortBy === "submissionTime") {
      return parseInt(a.submissionTime) - parseInt(b.submissionTime);
    } else {
      return a.name.localeCompare(b.name);
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
            지원자 역량 비교
          </h1>
          <p className="mt-1 text-sm text-app-muted">
            동일한 요구사항을 기준으로 지원자들이 제출한 실무 답변을 검토하여 주관적으로 직접 비교 판단하세요.
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
            <span className="text-3xl font-extrabold text-app-foreground">{candidates.length}</span>
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
            <span className="text-3xl font-extrabold text-app-foreground">{candidates.length}</span>
            <span className="text-xs font-semibold text-app-muted">명</span>
          </div>
        </div>

        {/* Card 3: 검토 진행 중 */}
        <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-app-muted">
            <span className="text-xs font-bold uppercase">검토 진행 중</span>
            <Award className="h-4 w-4 text-brand-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-app-foreground">{candidates.length}</span>
            <span className="text-xs font-semibold text-app-muted">명 현황 분석</span>
          </div>
        </div>

        {/* Card 4: 개발자 선정 상태 */}
        <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-app-muted">
            <span className="text-xs font-bold uppercase">선정 상태</span>
            <UserCheck className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-3">
            {selectedCandidate ? (
              <span className="text-sm font-bold text-emerald-700">1명 선정 완료</span>
            ) : (
              <span className="text-sm font-bold text-amber-700">발주자 직접 검토 중</span>
            )}
          </div>
        </div>
      </section>

      {/* Candidate Comparison Table */}
      <section className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-4">
          <div>
            <h2 className="text-base font-bold text-app-foreground">지원자 실무 제출 응답 비교표</h2>
            <p className="text-xs text-app-muted">
              지원자들이 직접 작성한 4가지 영역 답변 현황입니다. 원문을 열람하여 주관적으로 평가하세요.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-app-muted font-medium flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5" /> 정렬:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "submissionTime" | "name")}
              className="rounded-lg border border-app-border bg-app-surface px-3 py-1.5 text-xs font-bold text-app-foreground focus:border-brand-500 focus:outline-none"
            >
              <option value="submissionTime">제출시간 빠른 순</option>
              <option value="name">지원자 이름순</option>
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
                <th className="p-3.5 text-center">확인 질문</th>
                <th className="p-3.5 text-center">작업 계획</th>
                <th className="p-3.5 text-center">리스크 대응</th>
                <th className="p-3.5 text-center">참고사항</th>
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
                      isSelected ? "bg-emerald-50/40" : ""
                    }`}
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
                                <Sparkles className="h-3 w-3 text-amber-600" /> 제출 양호
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

                    {/* 4가지 제출 현황 */}
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 font-bold text-emerald-700 text-[11px]">
                        <Check className="h-3 w-3 stroke-[3]" /> 작성 완료
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-semibold text-slate-700">
                      {c.scores.questions > 80 ? "3개 질문 작성" : "2개 질문 작성"}
                    </td>
                    <td className="p-3.5 text-center font-semibold text-slate-700">
                      7단계 수립
                    </td>
                    <td className="p-3.5 text-center font-semibold text-slate-700">
                      2건 식별
                    </td>

                    {/* 참고사항 */}
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
                          className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 font-bold text-amber-800 hover:bg-amber-200 transition-colors text-[11px]"
                        >
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                          참고사항
                        </button>
                      ) : (
                        <span className="text-slate-400 font-semibold text-[11px]">특이사항 없음</span>
                      )}
                    </td>

                    {/* 액션 */}
                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailModalCandidate(c)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50/40 transition-colors shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-brand-500" /> 원문 열람
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
          <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="font-bold text-base text-amber-900">
                  제출 참고사항
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

              <div className="space-y-1">
                <span className="text-app-muted">참고사항 내용:</span>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 font-semibold text-amber-900">
                  {penaltyModalData.penalty.reason}
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>제출 확인 시각:</span>
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
            <h2 className="text-lg font-bold text-app-foreground">AI 제출서 원문 구조화 보조</h2>
            <p className="text-xs text-app-muted">지원자들이 작성한 원문 답변의 핵심 요약과 쟁점을 정리해 드립니다.</p>
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
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> 제출 원문 핵심 요약
            </h3>
            <ul className="space-y-1.5 text-emerald-950 font-medium pl-1">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span>요구사항의 기술적 제약사항 정확히 이해</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span>DB 구조 및 JWT 인증 관련 구체적 확인 질문 제시</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span>체계적인 주차별 마일스톤 및 리스크 대응책 작성</span>
              </li>
            </ul>
          </div>

          {/* Potential Concern */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
            <h3 className="font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> 확인 권장 사항 (발주자 검토 포인트)
            </h3>
            <p className="text-amber-950 font-medium leading-relaxed">
              • Deployment strategy requires additional confirmation (배포 전략 관련 발주자 추가 확인 권장)
            </p>
          </div>
        </div>

        {/* Important Disclaimer */}
        <div className="rounded-xl border border-app-border bg-app-surface-subtle p-3.5 text-center text-xs font-bold text-app-foreground flex items-center justify-center gap-2">
          <Info className="h-4 w-4 text-brand-500" />
          <span>AI는 원문 요약 보조 역할만 수행하며, 지원자 평가 및 최종 개발자 선정은 발주자가 직접 주관적으로 결정합니다.</span>
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

      {/* Candidate Raw Submission Modal (Matched 100% to Image 2 Wireframe) */}
      {detailModalCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-3xl border border-app-border bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-app-border/60 pb-4">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200/80">
                  <Eye className="h-3.5 w-3.5 text-amber-500" /> 지원자 제출 원문 열람
                </span>
                <h3 className="text-xl font-bold tracking-tight text-slate-900">
                  {detailModalCandidate.name} 지원자의 제출 내역
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setDetailModalCandidate(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content Scroll Area (Matching Image 2 Box Style 100%) */}
            <div className="flex-1 overflow-y-auto space-y-5 text-xs pr-1">
              {/* 01. 제출된 확인 질문 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-500 font-black border border-amber-200 text-xs">
                    ?
                  </div>
                  <span>01. 제출된 확인 질문</span>
                </div>

                <div className="space-y-3 font-semibold text-slate-800">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 leading-relaxed shadow-2xs">
                    <strong>Q1.</strong> 인증 처리 방식에서 JWT 토큰의 만료 시간 및 Refresh 토큰 보관 위치에 대한 기준이 선호되시는 방식이 있으신가요?
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 leading-relaxed shadow-2xs">
                    <strong>Q2.</strong> PostgreSQL 데이터베이스의 초동 스키마 마이그레이션 도구로 Prisma ORM을 사용하는 것에 동의하시나요?
                  </div>
                </div>
              </div>

              {/* 02. 요구사항 이해 요약 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <FileText className="h-5 w-5 text-amber-500" />
                  <span>02. 요구사항 이해 요약</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-800 font-medium leading-relaxed shadow-2xs">
                  본 프로젝트는 쇼핑몰 MVP 서비스 구축을 목적으로 하며, 핵심 사용자 흐름인 회원가입/로그인, 상품 목록/상세, 장바구니, 주문 결제 및 관리자 관리 페이지를 8주 이내에 구축하는 것을 목표로 합니다.
                </div>
              </div>

              {/* 03. 실행 계획 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Briefcase className="h-5 w-5 text-amber-500" />
                  <span>03. 실행 계획</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 font-mono text-slate-800 font-medium space-y-1.5 shadow-2xs">
                  <p>→ 환경 구성: Next.js 및 TypeScript 개발 환경 초기화</p>
                  <p>→ DB: PostgreSQL 데이터베이스 스키마 설계 및 Prisma 설정</p>
                  <p>→ API: 회원 인증 및 상품/장바구니 RESTful API 구현</p>
                </div>
              </div>

              {/* 04. 예상 리스크 및 대응방안 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  <span>04. 예상 리스크 및 대응방안</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                        <th className="p-3">Risk</th>
                        <th className="p-3 w-20">Impact</th>
                        <th className="p-3">Mitigation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                      <tr>
                        <td className="p-3 font-semibold text-slate-900">결제 API 연동 지연</td>
                        <td className="p-3">
                          <span className="rounded bg-rose-100 px-2 py-0.5 font-bold text-rose-800 text-[11px]">High</span>
                        </td>
                        <td className="p-3">Mock API로 선개발</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-900">DB 구조 변경</td>
                        <td className="p-3">
                          <span className="rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-800 text-[11px]">Medium</span>
                        </td>
                        <td className="p-3">초기 Schema 확정</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions (Navy Close Button) */}
            <div className="border-t border-app-border pt-4 text-right">
              <button
                type="button"
                onClick={() => setDetailModalCandidate(null)}
                className="rounded-xl bg-slate-900 px-7 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-md"
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
