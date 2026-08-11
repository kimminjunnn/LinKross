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
} from "lucide-react";
import { INITIAL_CANDIDATES, CandidateComparisonItem, saveSelectedCandidateId } from "@/lib/comparison";

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.assessmentId as string;
  const candidateId = params.candidateId as string;

  const [candidate, setCandidate] = useState<CandidateComparisonItem | null>(null);

  useEffect(() => {
    const found = INITIAL_CANDIDATES.find((c) => c.id === candidateId);
    if (found) {
      setCandidate(found);
    }
  }, [candidateId]);

  if (!candidate) {
    return (
      <div className="mx-auto max-w-4xl py-16 text-center">
        <h2 className="text-xl font-bold text-app-foreground">지원자 정보를 찾을 수 없습니다.</h2>
        <Link
          href={`/talent-assessment/${assessmentId}/candidates`}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white"
        >
          <ArrowLeft className="h-4 w-4" /> 지원자 비교표로 돌아가기
        </Link>
      </div>
    );
  }

  const handleSelectDeveloper = () => {
    saveSelectedCandidateId(candidate.id);
    router.push(`/talent-assessment/${assessmentId}/candidates`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Back Button */}
      <Link
        href={`/talent-assessment/${assessmentId}/candidates`}
        className="inline-flex items-center gap-2 text-xs font-bold text-app-muted hover:text-app-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> 지원자 비교표로 돌아가기
      </Link>

      {/* Hero Header */}
      <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white font-extrabold text-lg shadow-md">
            {candidate.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-app-foreground">{candidate.name}</h1>
              {candidate.isRecommended && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-800 border border-amber-200">
                  ★ 추천 지원자
                </span>
              )}
            </div>
            <p className="text-xs text-app-muted mt-0.5 flex items-center gap-2">
              <span>평판: {candidate.rating} / 5.0</span> • <span>소요시간: {candidate.submissionTime}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-app-muted">최종 점수</span>
            <p className="text-2xl font-black text-brand-600 font-mono">{candidate.finalScore}점</p>
          </div>
          <button
            onClick={handleSelectDeveloper}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-600 transition-colors"
          >
            <UserCheck className="h-4 w-4" />
            개발자로 선정
          </button>
        </div>
      </div>

      {/* Score Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-app-border bg-app-surface p-4 text-center">
          <span className="text-xs text-app-muted">요구사항 이해</span>
          <p className="text-lg font-bold text-app-foreground mt-1">{candidate.scores.requirements}점</p>
        </div>
        <div className="rounded-xl border border-app-border bg-app-surface p-4 text-center">
          <span className="text-xs text-app-muted">확인 질문</span>
          <p className="text-lg font-bold text-app-foreground mt-1">{candidate.scores.questions}점</p>
        </div>
        <div className="rounded-xl border border-app-border bg-app-surface p-4 text-center">
          <span className="text-xs text-app-muted">작업 계획</span>
          <p className="text-lg font-bold text-app-foreground mt-1">{candidate.scores.workPlan}점</p>
        </div>
        <div className="rounded-xl border border-app-border bg-app-surface p-4 text-center">
          <span className="text-xs text-app-muted">리스크 대응</span>
          <p className="text-lg font-bold text-app-foreground mt-1">{candidate.scores.risk}점</p>
        </div>
      </div>

      {/* Answers Detail */}
      <div className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-app-foreground border-b border-app-border pb-3">
          실무 과제 제출 답변 원문
        </h2>

        <div className="space-y-4 text-xs">
          <div className="rounded-xl border border-app-border bg-app-surface-subtle p-4 space-y-2">
            <h3 className="font-bold text-sm text-app-foreground flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-brand-500" /> 1. 확인 질문
            </h3>
            <p className="text-app-muted leading-relaxed">
              • 인증 처리 방식에서 JWT 토큰의 만료 시간 및 Refresh 토큰 보관 위치에 대한 선호 기준이 있으신가요?<br />
              • PostgreSQL 데이터베이스 마이그레이션 도구로 Prisma ORM을 사용해도 되나요?
            </p>
          </div>

          <div className="rounded-xl border border-app-border bg-app-surface-subtle p-4 space-y-2">
            <h3 className="font-bold text-sm text-app-foreground flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-brand-500" /> 2. 요구사항 이해 요약
            </h3>
            <p className="text-app-muted leading-relaxed">
              본 프로젝트는 쇼핑몰 MVP 구축을 목적으로 하며, 8주 이내에 주요 사용자 흐름(인증, 카탈로그, 장바구니, 주문 결제 및 백오피스)을 성공적으로 구현하고자 합니다.
            </p>
          </div>

          <div className="rounded-xl border border-app-border bg-app-surface-subtle p-4 space-y-2">
            <h3 className="font-bold text-sm text-app-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-brand-500" /> 3. 실행 계획
            </h3>
            <p className="font-mono text-app-muted leading-relaxed">
              → 1주차: Next.js 개발 초기 환경 수립<br />
              → 2-3주차: PostgreSQL 스키마 및 REST API 구현<br />
              → 4-6주차: Frontend UI 마크업 및 주문 연동
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
