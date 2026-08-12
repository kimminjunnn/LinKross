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
  HelpCircle,
  FileText,
  Briefcase,
  ShieldAlert,
  FileCheck,
  Check,
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
    status: "발주자 직접 검토 중",
    tone: "accent",
    candidatesCount: 3,
    due: "2026.08.18",
    evidence: "요약 · 계획 · 리스크",
    candidates: INITIAL_CANDIDATES,
  },
  {
    id: "admin-automation",
    projectName: "프로젝트 B (정산 백오피스 개발자 검증)",
    subTitle: "정산 백오피스 개발",
    status: "발주자 직접 검토 중",
    tone: "brand",
    candidatesCount: 2,
    due: "2026.08.23",
    evidence: "요구사항 이해 · 설계 판단",
    candidates: INITIAL_CANDIDATES.slice(1),
  },
  {
    id: "brand-site",
    projectName: "프로젝트 C (브랜드 사이트 개발자 검증)",
    subTitle: "브랜드 사이트 개발",
    status: "발주자 직접 검토 중",
    tone: "brand",
    candidatesCount: 1,
    due: "2026.07.31",
    evidence: "비교 결과 보관",
    candidates: [INITIAL_CANDIDATES[0]],
  },
];

export default function AssessmentsPage() {
  const router = useRouter();
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [selectedModalProject, setSelectedModalProject] = useState<ProjectAssessmentItem | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateComparisonItem | null>(null);

  const activeCandidate = selectedCandidate || (selectedModalProject?.candidates[0] ?? INITIAL_CANDIDATES[0]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-16">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-app-foreground sm:text-3xl">
            진행 전 프로젝트
          </h1>
          <p className="mt-1.5 text-sm text-app-muted">
            본 개발 착수 전 요구사항 이해도와 실무 대응력을 기준으로 지원자를 비교하고 선정합니다.
          </p>
        </div>

        {/* Top Actions: Right side filter */}
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

      {/* Horizontal Full-Width Cards */}
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
                onClick={() => {
                  setSelectedModalProject(item);
                  setSelectedCandidate(item.candidates[0] || INITIAL_CANDIDATES[0]);
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-slate-900 bg-slate-900 px-6 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Eye className="h-4 w-4" />
                지원자 현황 보기
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Candidate Submission Detail Modal (Submitted Questions Removed, Renumbered 01..03) */}
      {selectedModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-3xl border border-app-border bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-app-border/60 pb-4">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200/80">
                  <Eye className="h-3.5 w-3.5 text-amber-500" /> 지원자 응답 상세 열람
                </span>
                <h3 className="text-xl font-bold tracking-tight text-slate-900">
                  {activeCandidate.name} 지원자의 제출 내역
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedModalProject(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Candidate Selector Tabs */}
            {selectedModalProject.candidates.length > 1 && (
              <div className="rounded-2xl border border-app-border bg-slate-50/80 p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                  <span className="flex items-center gap-1.5 text-brand-600">
                    <Users className="h-3.5 w-3.5" /> 지원자 선택 (클릭 시 해당 지원자 제출 내역으로 전환):
                  </span>
                  <span className="text-slate-400 font-normal">지원자별 실무 응답을 직접 검토하세요</span>
                </div>

                <div className="flex items-center gap-2.5 overflow-x-auto pb-0.5">
                  {selectedModalProject.candidates.map((cand) => {
                    const isTabActive = cand.id === activeCandidate.id;
                    return (
                      <button
                        key={cand.id}
                        type="button"
                        onClick={() => setSelectedCandidate(cand)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          isTabActive
                            ? "bg-brand-500 text-white shadow-md ring-2 ring-brand-500/30 scale-[1.02]"
                            : "bg-white border border-slate-200 text-slate-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 shadow-2xs"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-extrabold ${
                            isTabActive ? "bg-white text-brand-600" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {isTabActive ? "✓" : cand.avatar}
                        </span>
                        <span>{cand.name}</span>
                        <span
                          className={`font-mono text-[11px] px-2 py-0.5 rounded-md ${
                            isTabActive ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          제출 완료
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Content Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-5 text-xs pr-1">
              {/* Submission Overview Status Box (3 Sections Summary) */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-100/70 p-4 grid grid-cols-3 text-center divide-x divide-slate-200">
                <div>
                  <span className="text-slate-500 font-medium block text-[11px] mb-1">01. 요구사항 이해</span>
                  <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" /> 작성 완료
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block text-[11px] mb-1">02. 작업 계획</span>
                  <span className="text-xs font-bold text-slate-900">
                    3단계 수립
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block text-[11px] mb-1">03. 리스크 대응</span>
                  <span className="text-xs font-bold text-slate-900">
                    2건 식별
                  </span>
                </div>
              </div>

              {/* 01. 요구사항 이해 요약 (Formerly 02) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <FileText className="h-5 w-5 text-amber-500" />
                  <span>01. 요구사항 이해 요약</span>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed">
                  본 프로젝트는 쇼핑몰 MVP 서비스 구축을 목적으로 하며, 핵심 사용자 흐름인 회원가입/로그인, 상품 목록/상세, 장바구니, 주문 결제 및 관리자 관리 페이지를 8주 이내에 구축하는 것을 목표로 합니다.
                </p>
              </div>

              {/* 02. 실행 계획 (Formerly 03) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Briefcase className="h-5 w-5 text-amber-500" />
                  <span>02. 실행 계획</span>
                </div>
                <div className="space-y-1.5 font-mono text-slate-700 font-medium">
                  <p>→ 환경 구성: Next.js 및 TypeScript 개발 환경 초기화</p>
                  <p>→ DB: PostgreSQL 데이터베이스 스키마 설계 및 Prisma 설정</p>
                  <p>→ API: 회원 인증 및 상품/장바구니 RESTful API 구현</p>
                </div>
              </div>

              {/* 03. 예상 리스크 및 대응방안 (Formerly 04) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  <span>03. 예상 리스크 및 대응방안</span>
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
