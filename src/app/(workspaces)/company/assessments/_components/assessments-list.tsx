"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown, CalendarDays, CircleAlert, Eye, Plus, Users2, Wallet } from "lucide-react";

import type { BackendResult, CompanyProjectSummary } from "@/lib/backend";

const STATUS_LABEL: Record<CompanyProjectSummary["status"], { label: string; tone: "accent" | "brand" }> = {
  recruiting: { label: "모집 중", tone: "accent" },
  closed: { label: "모집 마감", tone: "brand" },
};

function formatBudget(project: CompanyProjectSummary) {
  const min = `$${project.budgetAmount.toLocaleString()}`;
  if (project.budgetMaxAmount == null) return min;
  return `${min} ~ $${project.budgetMaxAmount.toLocaleString()}`;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return value.slice(0, 10);
}

function getDDayLabel(endDateStr: string | null) {
  if (!endDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = new Date(endDateStr);
  endDate.setHours(0, 0, 0, 0);
  
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "마감됨";
  if (diffDays === 0) return "오늘 마감";
  if (diffDays === 1) return "내일 마감";
  return `D-${diffDays}`;
}

export function AssessmentsList({
  result,
}: {
  result: BackendResult<CompanyProjectSummary[]>;
}) {
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

  const projects = result.ok ? result.data : [];
  const sortedProjects = [...projects].sort((a, b) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortOrder === "latest" ? -diff : diff;
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-16">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-app-foreground sm:text-3xl">
            진행 전 프로젝트
          </h1>
          <p className="mt-1.5 text-sm text-app-muted">
            본 개발 착수 전 요구사항 이해도와 실무 대응력을 기준으로 지원자를 비교하고 선정합니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/company/projects/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-brand-500 px-5 text-xs font-bold text-white! shadow-xs transition-colors hover:bg-brand-600"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            새 프로젝트 만들기
          </Link>
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

      {!result.ok ? (
        <div className="flex items-start gap-3 rounded-card border border-red-200 bg-red-50 p-4">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-red-600" />
          <p className="text-sm font-bold text-red-800">{result.error.message}</p>
        </div>
      ) : sortedProjects.length === 0 ? (
        <div className="rounded-card border border-dashed border-app-border-strong bg-app-surface-subtle p-10 text-center">
          <p className="text-sm font-bold text-app-foreground">현재 모집 중인 프로젝트가 없습니다.</p>
          <p className="mt-1.5 text-sm text-app-muted">
            새 프로젝트를 등록하면 모집 마감 전까지 이 화면에서 지원자 현황을 확인할 수 있습니다.
          </p>
          <Link
            href="/company/projects/new"
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-black text-white! shadow-sm transition-colors hover:bg-brand-600"
          >
            <Plus aria-hidden="true" className="size-4" />
            새 프로젝트 만들기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedProjects.map((project) => {
            const statusMeta = STATUS_LABEL[project.status];
            const ddayLabel = getDDayLabel(project.recruitmentEndAt);
            const isUrgent = ddayLabel === "오늘 마감" || ddayLabel === "내일 마감" || ddayLabel === "D-2";

            return (
              <article
                key={project.id}
                className="group rounded-xl border border-app-border bg-app-surface p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-slate-350 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-4 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      project.status === "recruiting"
                        ? "bg-accent-50 text-accent-700 border-accent-200"
                        : "bg-brand-50 text-brand-700 border-brand-100"
                    }`}>
                      <span className={`size-1.5 rounded-full ${
                        project.status === "recruiting" ? "bg-accent-500 animate-pulse" : "bg-brand-500"
                      }`} />
                      {statusMeta.label}
                    </span>
                    
                    {ddayLabel && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        isUrgent
                          ? "bg-red-50 text-red-700 border-red-200"
                          : ddayLabel === "마감됨"
                          ? "bg-slate-100 text-slate-500 border-slate-200"
                          : "bg-amber-50 text-amber-750 border-amber-200"
                      }`}>
                        {ddayLabel}
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-100/70 border border-slate-200/50 px-2 py-0.5 rounded-md font-mono">
                      #LK-{project.id.slice(0, 8)}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-extrabold text-app-foreground leading-snug truncate group-hover:text-brand-600 transition-colors">
                    {project.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-app-muted">
                    <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-md text-slate-600">
                      <Users2 className="size-3.5 text-slate-400" />
                      제출 인원: <strong className="text-app-foreground font-extrabold ml-1">{project.proposalCount}명</strong>
                    </span>
                    {project.recruitmentEndAt && (
                      <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-md text-slate-600">
                        <CalendarDays className="size-3.5 text-slate-400" />
                        마감일: <strong className="text-app-foreground font-bold font-mono ml-1">{formatDate(project.recruitmentEndAt)}</strong>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-md text-slate-600">
                      <Wallet className="size-3.5 text-slate-400" />
                      예산: <strong className="text-app-foreground font-semibold ml-1">{formatBudget(project)}</strong>
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3 border-t md:border-t-0 border-app-border pt-4 md:pt-0">
                  <Link
                    href={`/company/assessments/${project.id}/candidates`}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 px-5 text-xs sm:text-sm font-bold text-white transition-all duration-200 group shadow-xs hover:shadow-md active:scale-[0.98]"
                  >
                    지원자 현황 보기
                    <Eye className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
