"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardPlus, ArrowUpDown, Filter, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/project/status-badge";

const assessments = [
  {
    id: "ast_sample_01",
    projectName: "프로젝트 A (쇼핑몰 MVP 개발자 검증)",
    status: "응답 수집 중",
    tone: "brand" as const,
    candidates: 12,
    due: "2026.08.18",
    evidence: "질문 · 계획 · 리스크",
  },
  {
    id: "admin-automation",
    projectName: "프로젝트 B (정산 백오피스 개발자 검증)",
    status: "검토 대기",
    tone: "accent" as const,
    candidates: 6,
    due: "2026.08.23",
    evidence: "요구사항 이해 · 설계 판단",
  },
  {
    id: "brand-site",
    projectName: "프로젝트 C (브랜드 웹사이트 구축 검증)",
    status: "선정 완료",
    tone: "success" as const,
    candidates: 8,
    due: "2026.07.31",
    evidence: "비교 결과 보관",
  },
];

export default function AssessmentsPage() {
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-16">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-500 uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" /> Pre-verification Management
          </div>
          <h1 className="text-2xl font-black tracking-tight text-app-foreground sm:text-3xl">
            지원자 역량검증
          </h1>
          <p className="mt-1.5 text-sm text-app-muted">
            프로젝트 요구사항 이해도와 실무 대응력을 기준으로 지원자를 비교하고 선정합니다.
          </p>
        </div>

        {/* Actions Area */}
        <div className="flex items-center gap-3">
          {/* 최신순 필터 */}
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
              className="appearance-none rounded-[var(--radius-control)] border border-app-border bg-app-surface px-4 py-2.5 pr-8 text-xs font-bold text-app-foreground focus:border-brand-500 focus:outline-none transition-colors cursor-pointer"
            >
              <option value="latest">최신순</option>
              <option value="oldest">오래된순</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-app-muted" />
          </div>

          {/* 새 검증 과제 등록 */}
          <Link
            href="/talent-assessment/create"
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-600 active:scale-[0.98] transition-all shadow-md"
          >
            <ClipboardPlus className="size-4" />
            새 검증 과제 등록
          </Link>
        </div>
      </header>

      {/* Assessment Cards List */}
      <div className="grid gap-6 lg:grid-cols-2">
        {assessments.map((assessment) => (
          <article
            key={assessment.id}
            className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm hover:shadow-md transition-all space-y-4"
          >
            <div className="flex items-center justify-between">
              <StatusBadge tone={assessment.tone}>{assessment.status}</StatusBadge>
              <span className="text-xs font-mono text-app-muted">ID: {assessment.id}</span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-app-foreground">
              {assessment.projectName}
            </h2>

            <dl className="grid grid-cols-2 gap-4 border-y border-app-border py-4 text-xs">
              <div>
                <dt className="text-app-muted">제출 인원</dt>
                <dd className="mt-1 text-base font-extrabold text-app-foreground">
                  {assessment.candidates}명
                </dd>
              </div>
              <div>
                <dt className="text-app-muted">마감일</dt>
                <dd className="mt-1 text-base font-bold text-app-foreground font-mono">
                  {assessment.due}
                </dd>
              </div>
            </dl>

            <div className="flex items-center justify-between text-xs text-app-muted pt-1">
              <span>비교 근거 · <strong className="text-app-foreground font-medium">{assessment.evidence}</strong></span>
            </div>

            <Link
              href="/talent-assessment/ast_sample_01/candidates"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-app-border-strong bg-white text-sm font-bold text-app-foreground hover:border-brand-500 hover:text-brand-600 transition-colors shadow-xs"
            >
              지원자 응답 비교
              <ArrowRight className="size-4 text-brand-500" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
