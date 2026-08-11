"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpDown,
  Users,
  Eye,
  X,
  Star,
  Sparkles,
  CheckCircle2,
  Clock,
  Award,
  ChevronRight,
} from "lucide-react";
import { StatusBadge } from "@/components/project/status-badge";
import { INITIAL_CANDIDATES, CandidateComparisonItem } from "@/lib/comparison";

interface ProjectAssessmentItem {
  id: string;
  projectName: string;
  subTitle: string;
  status: string;
  tone: "brand" | "accent" | "success";
  candidatesCount: number;
  due: string;
  evidence: string;
  candidates: CandidateComparisonItem[];
}

const mockProjectAssessments: ProjectAssessmentItem[] = [
  {
    id: "ast_sample_01",
    projectName: "프로젝트 A (고객 포털 MVP 개발자 검증)",
    subTitle: "고객 포털 MVP 개발",
    status: "응답 검토 중",
    tone: "accent",
    candidatesCount: 12,
    due: "2026.08.18",
    evidence: "질문 · 계획 · 리스크",
    candidates: INITIAL_CANDIDATES,
  },
  {
    id: "admin-automation",
    projectName: "프로젝트 B (정산 백오피스 개발자 검증)",
    subTitle: "정산 백오피스 개발",
    status: "제출 중",
    tone: "brand",
    candidatesCount: 6,
    due: "2026.08.23",
    evidence: "요구사항 이해 · 설계 판단",
    candidates: INITIAL_CANDIDATES.slice(1),
  },
  {
    id: "brand-site",
    projectName: "프로젝트 C (브랜드 사이트 개발자 검증)",
    subTitle: "브랜드 사이트 개발",
    status: "선정 완료",
    tone: "success",
    candidatesCount: 8,
    due: "2026.07.31",
    evidence: "비교 결과 보관",
    candidates: [INITIAL_CANDIDATES[0]],
  },
];

export default function AssessmentsPage() {
  const router = useRouter();
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [selectedModalProject, setSelectedModalProject] = useState<ProjectAssessmentItem | null>(null);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-16">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-app-foreground sm:text-3xl">
            지원자 역량검증
          </h1>
          <p className="mt-1.5 text-sm text-app-muted">
            이력보다 요구사항을 이해하고 실행 계획과 위험을 설명하는 능력을 동일한 기준으로 비교합니다.
          </p>
        </div>

        {/* Top Actions: Right side filter (Orange creation button REMOVED as requested) */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
              className="appearance-none rounded-[var(--radius-control)] border border-app-border bg-app-surface px-4 py-2.5 pr-8 text-xs font-bold text-app-foreground focus:border-brand-500 focus:outline-none transition-colors cursor-pointer shadow-2xs"
            >
              <option value="latest">최신순</option>
              <option value="oldest">오래된순</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-app-muted" />
          </div>
        </div>
      </header>

      {/* Horizontal Full-Width Cards (1-Column Layout as in Design 2) */}
      <div className="space-y-4">
        {mockProjectAssessments.map((item) => (
          <article
            key={item.id}
            className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            {/* Left Content Area */}
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
                <span className="text-xs font-mono text-app-muted">ID: {item.id}</span>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-app-foreground truncate">
                {item.projectName}
              </h2>

              <div className="flex flex-wrap items-center gap-6 text-xs text-app-muted border-t border-app-border/60 pt-3">
                <div>
                  제출 인원: <strong className="text-app-foreground font-extrabold ml-1">{item.candidatesCount}명</strong>
                </div>
                <div>
                  마감일: <strong className="text-app-foreground font-bold font-mono ml-1">{item.due}</strong>
                </div>
                <div>
                  비교 근거: <strong className="text-app-foreground font-medium ml-1">{item.evidence}</strong>
                </div>
              </div>
            </div>

            {/* Right Action Button Area */}
            <div className="shrink-0 flex items-center gap-3 border-t md:border-t-0 border-app-border pt-4 md:pt-0">
              <button
                type="button"
                onClick={() => setSelectedModalProject(item)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-slate-900 bg-slate-900 px-6 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Eye className="h-4 w-4" />
                지원자 현황 보기
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Candidate Status Modal (지원자 현황 상세 모달) */}
      {selectedModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-2xl border border-app-border bg-white p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-app-border pb-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700">
                  <Users className="h-3.5 w-3.5 text-brand-500" /> 프로젝트 지원 현황
                </span>
                <h3 className="text-lg font-bold text-app-foreground mt-1">
                  {selectedModalProject.projectName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModalProject(null)}
                className="rounded-lg p-1.5 text-app-muted hover:bg-slate-100 hover:text-app-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Candidate List Body */}
            <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-2">
              <div className="flex items-center justify-between text-app-muted px-1 font-medium">
                <span>지원 제출 개발자 목록 ({selectedModalProject.candidates.length}명)</span>
                <span>실무 역량 평가 점수 기준</span>
              </div>

              {selectedModalProject.candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => {
                    setSelectedModalProject(null);
                    router.push(`/talent-assessment/${selectedModalProject.id}/candidates/${candidate.id}`);
                  }}
                  className="cursor-pointer rounded-xl border border-app-border bg-app-surface-subtle p-4 hover:border-brand-300 hover:bg-brand-50/20 transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white font-extrabold text-xs">
                      {candidate.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-app-foreground">{candidate.name}</span>
                        {candidate.isRecommended && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 border border-amber-200">
                            <Sparkles className="h-3 w-3 text-amber-600" /> 추천
                          </span>
                        )}
                        {candidate.status === "selected" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> 선정됨
                          </span>
                        )}
                      </div>
                      <p className="text-app-muted mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-1 text-amber-600 font-semibold">
                          <Star className="h-3 w-3 fill-amber-400 stroke-amber-500" />
                          {candidate.rating}
                        </span>
                        • <span>소요시간: {candidate.submissionTime}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-app-muted">최종 점수</span>
                      <p className="text-base font-black text-brand-600 font-mono">
                        {candidate.finalScore}점
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-app-muted" />
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer Actions */}
            <div className="border-t border-app-border pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedModalProject(null)}
                className="rounded-xl border border-app-border bg-app-surface px-4 py-2.5 text-xs font-semibold text-app-foreground hover:bg-app-surface-subtle transition-colors"
              >
                닫기
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetId = selectedModalProject.id;
                  setSelectedModalProject(null);
                  router.push(`/talent-assessment/${targetId}/candidates`);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-600 transition-colors shadow-md"
              >
                전체 지원자 비교 대시보드로 이동
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
