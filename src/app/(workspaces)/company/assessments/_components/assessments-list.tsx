"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown, CircleAlert, Eye, Plus } from "lucide-react";

import { StatusBadge } from "@/components/project/status-badge";
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
          <h1 className="text-2xl font-bold tracking-tight text-app-foreground sm:text-3xl">
            진행 전 프로젝트
          </h1>
          <p className="mt-1.5 text-sm text-app-muted">
            본 개발 착수 전 요구사항 이해도와 실무 대응력을 기준으로 지원자를 비교하고 선정합니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/company/projects/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-brand-500 px-5 text-xs font-semibold text-white! shadow-xs transition-colors hover:bg-brand-600"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            새 프로젝트 만들기
          </Link>
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
              className="appearance-none rounded-[var(--radius-control)] border border-app-border bg-app-surface px-4 py-2.5 pr-8 text-xs text-app-foreground focus:border-brand-500 focus:outline-none transition-colors cursor-pointer shadow-2xs"
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
          <p className="text-sm text-red-800">{result.error.message}</p>
        </div>
      ) : sortedProjects.length === 0 ? (
        <div className="rounded-card border border-dashed border-app-border-strong bg-app-surface-subtle p-10 text-center">
          <p className="text-sm text-app-foreground">현재 모집 중인 프로젝트가 없습니다.</p>
          <p className="mt-1.5 text-sm text-app-muted">
            새 프로젝트를 등록하면 모집 마감 전까지 이 화면에서 지원자 현황을 확인할 수 있습니다.
          </p>
          <Link
            href="/company/projects/new"
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-semibold text-white! shadow-sm transition-colors hover:bg-brand-600"
          >
            <Plus aria-hidden="true" className="size-4" />
            새 프로젝트 만들기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedProjects.map((project) => {
            const statusMeta = STATUS_LABEL[project.status];
            return (
              <article
                key={project.id}
                className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
                    <span className="text-xs font-mono text-app-muted">ID: {project.id}</span>
                  </div>

                  <h2 className="text-xl font-semibold tracking-tight text-app-foreground truncate">
                    {project.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-6 text-xs text-app-muted border-t border-app-border/60 pt-3">
                    <div>
                      제출 인원: <strong className="text-app-foreground ml-1">{project.proposalCount}명</strong>
                    </div>
                    <div>
                      모집 마감일: <strong className="text-app-foreground font-mono ml-1">{formatDate(project.recruitmentEndAt)}</strong>
                    </div>
                    <div>
                      예산: <strong className="text-app-foreground ml-1">{formatBudget(project)}</strong>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3 border-t md:border-t-0 border-app-border pt-4 md:pt-0">
                  <Link
                    href={`/company/assessments/${project.id}/candidates`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-slate-900 bg-slate-900 px-6 text-xs font-semibold text-white! hover:bg-slate-800 transition-colors shadow-xs"
                  >
                    <Eye className="h-4 w-4" />
                    지원자 현황 보기
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
