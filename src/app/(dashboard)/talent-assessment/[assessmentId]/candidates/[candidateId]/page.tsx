"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileCheck,
  Briefcase,
  ShieldAlert,
  UserCheck,
  FileSpreadsheet,
  Check,
} from "lucide-react";
import {
  INITIAL_CANDIDATES,
  CandidateComparisonItem,
  getSelectedCandidateId,
  saveSelectedCandidateId,
} from "@/lib/comparison";

export default function CandidateDetailedEvaluationPage() {
  const params = useParams();
  const router = useRouter();

  const candidateId = (params.candidateId as string) || "c1";
  const candidate = INITIAL_CANDIDATES.find((c) => c.id === candidateId) || INITIAL_CANDIDATES[0];

  const [isSelected, setIsSelected] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedId = getSelectedCandidateId();
    if (savedId === candidate.id) {
      setIsSelected(true);
    }
  }, [candidate.id]);

  const handleSelectCandidate = () => {
    saveSelectedCandidateId(candidate.id);
    setIsSelected(true);
    setToastMessage(`'${candidate.name}' 지원자가 개발자로 선정되었습니다.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-700 bg-emerald-900 px-5 py-3.5 text-white shadow-xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div className="space-y-4">
        <Link
          href="/talent-assessment/ast_sample_01/candidates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-app-muted hover:text-app-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> 지원자 비교 대시보드로 돌아가기
        </Link>

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-app-muted uppercase mb-1">
              Projects / 쇼핑몰 MVP / 지원자 비교 / {candidate.name}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-app-foreground sm:text-3xl">
              지원자 상세 제출 내역
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {isSelected ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-4 py-2 text-xs font-extrabold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> 개발자로 선정됨
                </span>
                <button
                  onClick={() => router.push("/projects/proj_01/sow")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  SOW 생성
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSelectCandidate}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-brand-600 active:scale-[0.98] transition-all"
              >
                <UserCheck className="h-4 w-4" />
                개발자로 선정
              </button>
            )}
          </div>
        </header>
      </div>

      {/* Candidate Profile Card */}
      <section className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-white text-lg font-black shadow-sm">
            {candidate.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-app-foreground">{candidate.name}</h2>
              {candidate.isRecommended && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800 border border-amber-200">
                  실무 답변 양호
                </span>
              )}
            </div>
            <p className="text-xs text-app-muted mt-1">
              Full-stack Developer • 경력 7년 • React / Node.js / PostgreSQL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 border-app-border pt-4 md:pt-0 text-xs">
          <div>
            <span className="text-app-muted block">평판</span>
            <div className="mt-1 flex items-center gap-1 text-sm font-bold text-amber-600">
              <Star className="h-4 w-4 fill-amber-400 stroke-amber-500" />
              <span>{candidate.rating.toFixed(1)} / 5.0</span>
            </div>
          </div>

          <div>
            <span className="text-app-muted block">제출 소요시간</span>
            <span className="mt-1 font-mono font-bold text-sm text-app-foreground block">
              {candidate.submissionTime}
            </span>
          </div>

          <div>
            <span className="text-app-muted block">제출 상태</span>
            <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 text-xs">
              <Check className="h-3 w-3 stroke-[3]" /> 작성 완료
            </span>
          </div>
        </div>
      </section>

      {/* Submission Status Overview (Score Numbers Removed) */}
      <section className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-app-foreground border-b border-app-border pb-3">
          지원자 제출 내역 구조 요약
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="rounded-xl border border-app-border bg-slate-50 p-4">
            <span className="text-xs text-app-muted font-medium block mb-1">01. 요구사항 이해</span>
            <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
              <Check className="h-3.5 w-3.5 stroke-[3]" /> 작성 완료
            </span>
          </div>
          <div className="rounded-xl border border-app-border bg-slate-50 p-4">
            <span className="text-xs text-app-muted font-medium block mb-1">02. 확인 질문</span>
            <span className="text-xs font-bold text-slate-900">
              2개 항목 작성
            </span>
          </div>
          <div className="rounded-xl border border-app-border bg-slate-50 p-4">
            <span className="text-xs text-app-muted font-medium block mb-1">03. 작업 계획</span>
            <span className="text-xs font-bold text-slate-900">
              3단계 수립
            </span>
          </div>
          <div className="rounded-xl border border-app-border bg-slate-50 p-4">
            <span className="text-xs text-app-muted font-medium block mb-1">04. 리스크 대응</span>
            <span className="text-xs font-bold text-slate-900">
              2건 식별
            </span>
          </div>
        </div>
      </section>

      {/* Candidate Raw Response Evidence Sections */}
      <section className="space-y-6">
        <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-app-foreground flex items-center gap-2 border-b border-app-border pb-3">
            <HelpCircle className="h-5 w-5 text-amber-500" />
            01. 제출된 확인 질문
          </h3>
          <ul className="space-y-3 text-xs">
            <li className="bg-app-surface-subtle p-4 rounded-xl border border-app-border text-app-foreground font-medium">
              <strong className="text-brand-600 block mb-1">Q1. JWT 인증 토큰 관리</strong>
              인증 처리 방식에서 JWT 토큰의 만료 시간 및 Refresh 토큰 보관 위치에 대한 기준이 선호되시는 방식이 있으신가요?
            </li>
            <li className="bg-app-surface-subtle p-4 rounded-xl border border-app-border text-app-foreground font-medium">
              <strong className="text-brand-600 block mb-1">Q2. DB 마이그레이션 도구</strong>
              PostgreSQL 데이터베이스의 초동 스키마 마이그레이션 도구로 Prisma ORM을 사용하는 것에 동의하시나요?
            </li>
          </ul>
        </div>

        <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-app-foreground flex items-center gap-2 border-b border-app-border pb-3">
            <FileCheck className="h-5 w-5 text-amber-500" />
            02. 요구사항 이해 요약
          </h3>
          <p className="text-xs text-app-foreground leading-relaxed font-medium bg-app-surface-subtle p-4 rounded-xl border border-app-border">
            본 프로젝트는 쇼핑몰 MVP 서비스 구축을 목적으로 하며, 핵심 사용자 흐름인 회원가입/로그인, 상품 목록/상세, 장바구니, 주문 결제 및 관리자 관리 페이지를 8주 이내에 구축하는 것을 목표로 합니다.
          </p>
        </div>

        <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-app-foreground flex items-center gap-2 border-b border-app-border pb-3">
            <Briefcase className="h-5 w-5 text-amber-500" />
            03. 실행 계획
          </h3>
          <div className="text-xs text-app-foreground font-mono leading-relaxed bg-app-surface-subtle p-4 rounded-xl border border-app-border space-y-1">
            <p>→ 환경 구성: Next.js 및 TypeScript 개발 환경 초기화</p>
            <p>→ DB: PostgreSQL 데이터베이스 스키마 설계 및 Prisma 설정</p>
            <p>→ API: 회원 인증 및 상품/장바구니 RESTful API 구현</p>
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-app-foreground flex items-center gap-2 border-b border-app-border pb-3">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            04. 예상 리스크 및 대응방안
          </h3>
          <div className="overflow-x-auto rounded-xl border border-app-border">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-app-border bg-slate-50 text-app-muted font-semibold">
                  <th className="p-3">Risk</th>
                  <th className="p-3 w-20">Impact</th>
                  <th className="p-3">Mitigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border font-medium">
                <tr>
                  <td className="p-3 font-semibold text-app-foreground">결제 API 연동 지연</td>
                  <td className="p-3">
                    <span className="rounded bg-rose-100 px-2 py-0.5 font-bold text-rose-800 text-[11px]">High</span>
                  </td>
                  <td className="p-3 text-app-muted">Mock API로 선개발</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-app-foreground">DB 구조 변경</td>
                  <td className="p-3">
                    <span className="rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-800 text-[11px]">Medium</span>
                  </td>
                  <td className="p-3 text-app-muted">초기 Schema 확정</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
