"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileCheck,
  Briefcase,
  ShieldAlert,
  UserCheck,
  Award,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  X,
  FileSpreadsheet,
  Clock,
  Code2,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  INITIAL_CANDIDATES,
  CandidateComparisonItem,
  saveSelectedCandidateId,
  getSelectedCandidateId,
} from "@/lib/comparison";

export default function CandidateDetailedEvaluationScreen() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = (params.assessmentId as string) || "ast_sample_01";
  const candidateId = (params.candidateId as string) || "cand_gupta_haep";

  const [candidate, setCandidate] = useState<CandidateComparisonItem | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Accordion Expanded States (Default all open)
  const [accordionOpen, setAccordionOpen] = useState({
    q1: true,
    q2: true,
    q3: true,
    q4: true,
  });

  // Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    const found = INITIAL_CANDIDATES.find((c) => c.id === candidateId) || INITIAL_CANDIDATES[0];
    setCandidate(found);

    const saved = getSelectedCandidateId();
    if (saved) {
      setSelectedId(saved);
    }
  }, [candidateId]);

  if (!candidate) {
    return (
      <div className="mx-auto max-w-4xl py-16 text-center">
        <h2 className="text-xl font-bold text-app-foreground">지원자 정보를 찾을 수 없습니다.</h2>
        <Link
          href={`/talent-assessment/${assessmentId}/candidates`}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-bold text-white"
        >
          <ArrowLeft className="h-4 w-4" /> 지원자 비교표로 돌아가기
        </Link>
      </div>
    );
  }

  const toggleAccordion = (key: keyof typeof accordionOpen) => {
    setAccordionOpen((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectDeveloper = () => {
    saveSelectedCandidateId(candidate.id);
    setSelectedId(candidate.id);
    setIsSuccessModalOpen(true);
  };

  const isSelected = selectedId === candidate.id;
  const details = candidate.details;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-24">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-medium text-app-muted">
        <Link href="/projects" className="hover:text-app-foreground transition-colors">
          Projects
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/projects" className="hover:text-app-foreground transition-colors">
          쇼핑몰 MVP
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href={`/talent-assessment/${assessmentId}/candidates`}
          className="hover:text-app-foreground transition-colors"
        >
          지원자 비교
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-bold text-app-foreground">{candidate.name}</span>
      </nav>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-800 border border-amber-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Strong Candidate
            </span>
            <span className="text-xs text-app-muted">• 평판 {candidate.rating} / 5.0</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-app-foreground sm:text-3xl">
            지원자 상세 평가
          </h1>
          <p className="mt-1 text-sm text-app-muted">
            지원자 <strong className="text-app-foreground font-semibold">{candidate.name}</strong>의 평가 점수 산출 근거 및 제출 원문 내역입니다.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs font-semibold text-app-muted">최종 점수</span>
            <p className="text-3xl font-black text-brand-600 font-mono tracking-tight">
              {candidate.finalScore}점
            </p>
          </div>

          {isSelected ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-5 py-3 text-xs font-extrabold text-emerald-800 border border-emerald-200">
              <UserCheck className="h-4 w-4 text-emerald-600" /> 선정 완료됨
            </span>
          ) : (
            <button
              type="button"
              onClick={handleSelectDeveloper}
              className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-brand-500 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-brand-600 active:scale-[0.98] transition-all"
            >
              <UserCheck className="h-4 w-4" />
              개발자로 선정
            </button>
          )}
        </div>
      </header>

      {/* Candidate Profile Card */}
      <section className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white font-extrabold text-xl shadow-md">
              {candidate.avatar}
            </div>
            <div>
              <h2 className="text-xl font-bold text-app-foreground">{candidate.name}</h2>
              <p className="text-xs font-semibold text-brand-600 mt-0.5">
                {details?.role || "Full-stack Developer"} • 경력 {details?.experience || "7 years"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {(details?.skills || ["React", "Node.js", "PostgreSQL"]).map((skill, idx) => (
                  <span
                    key={idx}
                    className="rounded-md border border-app-border bg-app-surface-subtle px-2 py-0.5 text-[11px] font-semibold text-app-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t sm:border-t-0 border-app-border pt-4 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end text-xs">
            <div>
              <span className="text-app-muted">과제 소요 시간</span>
              <p className="font-mono font-bold text-app-foreground mt-0.5 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-brand-500" />
                {details?.assessmentTime || candidate.submissionTime}
              </p>
            </div>
            <div className="h-8 w-px bg-app-border" />
            <div>
              <span className="text-app-muted">검증 상태</span>
              <p className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> 평가 완료
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Score Overview */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-app-muted">Score Overview</h2>
        
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-app-border bg-app-surface p-4 text-center">
            <span className="text-xs text-app-muted font-medium">요구사항 이해도</span>
            <p className="text-2xl font-extrabold text-app-foreground mt-1 font-mono">
              {candidate.scores.requirements} <span className="text-xs font-normal text-app-muted">/ 100</span>
            </p>
          </div>

          <div className="rounded-xl border border-app-border bg-app-surface p-4 text-center">
            <span className="text-xs text-app-muted font-medium">질문 능력</span>
            <p className="text-2xl font-extrabold text-app-foreground mt-1 font-mono">
              {candidate.scores.questions} <span className="text-xs font-normal text-app-muted">/ 100</span>
            </p>
          </div>

          <div className="rounded-xl border border-app-border bg-app-surface p-4 text-center">
            <span className="text-xs text-app-muted font-medium">작업 계획</span>
            <p className="text-2xl font-extrabold text-app-foreground mt-1 font-mono">
              {candidate.scores.workPlan} <span className="text-xs font-normal text-app-muted">/ 100</span>
            </p>
          </div>

          <div className="rounded-xl border border-app-border bg-app-surface p-4 text-center">
            <span className="text-xs text-app-muted font-medium">리스크 대응</span>
            <p className="text-2xl font-extrabold text-app-foreground mt-1 font-mono">
              {candidate.scores.risk} <span className="text-xs font-normal text-app-muted">/ 100</span>
            </p>
          </div>
        </div>

        {/* Total Score Summary Bar */}
        <div className="flex items-center justify-between rounded-xl border border-app-border bg-app-surface-subtle px-6 py-4 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-app-muted">기본 점수:</span>{" "}
              <span className="font-bold font-mono text-app-foreground">{candidate.baseScore}</span>
            </div>
            <div>
              <span className="text-app-muted">페널티:</span>{" "}
              <span className="font-bold font-mono text-rose-600">
                {candidate.penalty ? candidate.penalty.score : 0}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-app-foreground">최종 점수:</span>
            <span className="text-xl font-black font-mono text-brand-600">{candidate.finalScore}점</span>
          </div>
        </div>
      </section>

      {/* Detailed Candidate Responses (4 Expandable Accordion Sections) */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-app-muted">
          Detailed Candidate Responses (세부 제출 내역)
        </h2>

        {/* 01 확인 질문 */}
        <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggleAccordion("q1")}
            className="w-full flex items-center justify-between p-5 text-left bg-app-surface hover:bg-app-surface-subtle/50 transition-colors border-b border-app-border"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 font-bold text-xs">
                01
              </div>
              <div>
                <h3 className="font-bold text-sm text-app-foreground">확인 질문</h3>
                <p className="text-xs text-app-muted">요구사항 모호성 및 기술적 이슈에 대한 사전에 필요한 질의</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-brand-600 font-mono">{candidate.scores.questions} / 100점</span>
              {accordionOpen.q1 ? <ChevronUp className="h-4 w-4 text-app-muted" /> : <ChevronDown className="h-4 w-4 text-app-muted" />}
            </div>
          </button>

          {accordionOpen.q1 && (
            <div className="p-6 space-y-4 text-xs">
              <ul className="space-y-2.5">
                {[
                  "상품 재고는 실시간으로 관리해야 하나요?",
                  "결제 기능은 실제 PG 연동까지 포함하나요?",
                  "관리자 페이지 권한은 몇 단계인가요?",
                ].map((q, idx) => (
                  <li key={idx} className="rounded-xl border border-app-border bg-app-surface-subtle p-3.5 font-medium text-app-foreground flex items-start gap-2">
                    <span className="font-bold text-brand-500">Q{idx + 1}.</span>
                    <span>“{q}”</span>
                  </li>
                ))}
              </ul>

              {/* Evaluator Comment */}
              <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 text-brand-900">
                <span className="font-bold text-[11px] uppercase tracking-wider text-brand-700 block mb-1">Evaluator Comment</span>
                <p className="font-semibold text-xs">
                  “{details?.evaluatorComments.questions || "프로젝트 범위와 기술 구현에 직접 영향을 주는 적절한 질문입니다."}”
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 02 요구사항 이해 요약 */}
        <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggleAccordion("q2")}
            className="w-full flex items-center justify-between p-5 text-left bg-app-surface hover:bg-app-surface-subtle/50 transition-colors border-b border-app-border"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 font-bold text-xs">
                02
              </div>
              <div>
                <h3 className="font-bold text-sm text-app-foreground">요구사항 이해 요약</h3>
                <p className="text-xs text-app-muted">발주자 요구사항 및 핵심 서비스 범주의 재정의</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-brand-600 font-mono">95 / 100점</span>
              {accordionOpen.q2 ? <ChevronUp className="h-4 w-4 text-app-muted" /> : <ChevronDown className="h-4 w-4 text-app-muted" />}
            </div>
          </button>

          {accordionOpen.q2 && (
            <div className="p-6 space-y-4 text-xs">
              <div className="rounded-xl border border-app-border bg-app-surface-subtle p-4 font-medium text-app-foreground leading-relaxed whitespace-pre-wrap">
                본 프로젝트는 쇼핑몰 MVP 서비스 구축을 목적으로 하며, 핵심 사용자 흐름인 회원가입/로그인, 상품 목록/상세, 장바구니, 주문 결제 및 관리자 관리 페이지를 8주 이내에 구축하는 것을 목표로 합니다. RESTful API와 PostgreSQL DB를 기반으로 확장 가능하고 깔끔한 아키텍처를 설계하겠습니다.
              </div>

              {/* Evaluator Comment */}
              <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 text-brand-900">
                <span className="font-bold text-[11px] uppercase tracking-wider text-brand-700 block mb-1">Evaluator Comment</span>
                <p className="font-semibold text-xs">
                  “{details?.evaluatorComments.summary || "핵심 기능과 주요 제약사항을 정확하게 파악함."}”
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 03 실행 계획 (Vertical Timeline) */}
        <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggleAccordion("q3")}
            className="w-full flex items-center justify-between p-5 text-left bg-app-surface hover:bg-app-surface-subtle/50 transition-colors border-b border-app-border"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 font-bold text-xs">
                03
              </div>
              <div>
                <h3 className="font-bold text-sm text-app-foreground">실행 계획 (Vertical Timeline)</h3>
                <p className="text-xs text-app-muted">주차별 개발 마일스톤 및 아키텍처 파이프라인</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-brand-600 font-mono">90 / 100점</span>
              {accordionOpen.q3 ? <ChevronUp className="h-4 w-4 text-app-muted" /> : <ChevronDown className="h-4 w-4 text-app-muted" />}
            </div>
          </button>

          {accordionOpen.q3 && (
            <div className="p-6 space-y-6 text-xs">
              {/* Vertical Timeline */}
              <div className="relative border-l-2 border-brand-200 ml-4 space-y-6 pl-6 py-2">
                {(details?.timeline || [
                  "환경 구성",
                  "DB Schema",
                  "Backend API",
                  "Frontend",
                  "Integration",
                  "Testing",
                  "Deployment",
                ]).map((step, idx) => (
                  <div key={idx} className="relative flex items-center gap-3">
                    <div className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white font-bold text-[10px] shadow-sm">
                      {idx + 1}
                    </div>
                    <div className="rounded-xl border border-app-border bg-app-surface px-4 py-2.5 font-bold text-app-foreground shadow-2xs">
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 04 예상 리스크 및 대응방안 */}
        <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggleAccordion("q4")}
            className="w-full flex items-center justify-between p-5 text-left bg-app-surface hover:bg-app-surface-subtle/50 transition-colors border-b border-app-border"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 font-bold text-xs">
                04
              </div>
              <div>
                <h3 className="font-bold text-sm text-app-foreground">예상 리스크 및 대응방안</h3>
                <p className="text-xs text-app-muted">잠재적 기술/일정 위험요소 사전 식별 및 연동 모듈 방안</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-brand-600 font-mono">88 / 100점</span>
              {accordionOpen.q4 ? <ChevronUp className="h-4 w-4 text-app-muted" /> : <ChevronDown className="h-4 w-4 text-app-muted" />}
            </div>
          </button>

          {accordionOpen.q4 && (
            <div className="p-6 space-y-4 text-xs">
              <div className="overflow-x-auto rounded-xl border border-app-border bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-app-border bg-app-surface-subtle text-app-muted font-semibold">
                      <th className="p-3">Risk</th>
                      <th className="p-3 w-24">Impact</th>
                      <th className="p-3">Mitigation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border font-medium">
                    {(details?.detailedRisks || [
                      { risk: "결제 API 연동 지연", impact: "High", mitigation: "Mock API로 선개발" },
                      { risk: "DB 구조 변경", impact: "Medium", mitigation: "초기 Schema 확정" },
                      { risk: "인증 오류", impact: "High", mitigation: "JWT 테스트 시나리오 작성" },
                    ]).map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-semibold text-app-foreground">{row.risk}</td>
                        <td className="p-3">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${
                              row.impact === "High"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {row.impact}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700">{row.mitigation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Final Evaluation Summary Card */}
      <section className="rounded-[var(--radius-card)] border border-brand-200 bg-gradient-to-br from-brand-50/50 via-white to-amber-50/30 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-brand-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white font-bold shadow-md">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-app-foreground">종합 평가</h2>
              <p className="text-xs text-app-muted">4개 영역 항목 및 루브릭 결과 통합 평가입니다.</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-app-muted">종합 평가 점수</span>
            <p className="text-3xl font-black text-brand-600 font-mono">{candidate.finalScore} / 100</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Strengths */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
            <h3 className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Strengths (강점)
            </h3>
            <ul className="space-y-1.5 text-emerald-950 font-medium pl-1">
              {(details?.strengths || [
                "요구사항 분석 능력",
                "실무적인 질문",
                "단계적인 작업 계획",
                "리스크 사전 대응",
              ]).map((s, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Potential Concern */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
            <h3 className="font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Potential Concern (우려 사항)
            </h3>
            <p className="text-amber-950 font-medium leading-relaxed">
              △ {details?.potentialConcern || "실제 개발 속도는 프로젝트 진행 중 확인 필요"}
            </p>
          </div>
        </div>
      </section>

      {/* Bottom Developer Selection Bar */}
      <div className="sticky bottom-4 z-40 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-app-border bg-white/95 p-4 sm:p-5 shadow-xl backdrop-blur-md">
        <p className="text-xs font-semibold text-app-foreground text-center sm:text-left">
          이 지원자를 본 프로젝트의 개발자로 선정하시겠습니까?
        </p>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Link
            href={`/talent-assessment/${assessmentId}/candidates`}
            className="inline-flex items-center gap-1 rounded-[var(--radius-control)] border border-app-border bg-app-surface px-4 py-2.5 text-xs font-bold text-app-foreground hover:bg-app-surface-subtle transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> 뒤로가기
          </Link>

          <button
            type="button"
            onClick={() => router.push(`/talent-assessment/${assessmentId}/candidates`)}
            className="rounded-[var(--radius-control)] border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
          >
            선정하지 않음
          </button>

          {isSelected ? (
            <button
              type="button"
              onClick={() => router.push("/projects/proj_01/sow")}
              className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              업무 명세서 생성하기
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSelectDeveloper}
              className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-brand-500 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-600 active:scale-[0.98] transition-all"
            >
              <UserCheck className="h-4 w-4" />
              개발자로 선정
            </button>
          )}
        </div>
      </div>

      {/* Success Modal on Selection */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-app-border bg-white p-6 shadow-2xl space-y-5 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-app-foreground">
                {candidate.name}이 프로젝트 개발자로 선정되었습니다!
              </h3>
              <p className="text-xs text-app-muted">
                선정 일시: {new Date().toLocaleString("ko-KR")}
              </p>
            </div>

            <p className="text-xs text-app-muted leading-relaxed">
              이제 지원자가 제출한 사전 과제 답변과 요구사항을 바탕으로 다음 단계인 SOW(업무 명세서) 및 마일스톤 초안 작성을 진행합니다.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push("/projects/proj_01/sow")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-brand-500 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-brand-600 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
                업무 명세서 생성하기
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
