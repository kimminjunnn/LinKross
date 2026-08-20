"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Users2, Wallet } from "lucide-react";

import { mapLifecycleStageToProjectStatus } from "@/config/project-lifecycle";
import type { CompanyProjectSummary } from "@/lib/backend";

const LIFECYCLE_LABEL: Record<string, string> = {
  preparing: "착수 준비",
  in_progress: "진행 중",
  completed: "완료",
  cancelled: "취소",
  archived: "보관",
};

export function ProjectListTabs({ projects }: { projects: CompanyProjectSummary[] }) {
  const [tab, setTab] = useState<"active" | "history">("active");
  const activeProjects = projects.filter((project) => project.lifecycleStage !== "completed");
  const historyProjects = projects.filter((project) => project.lifecycleStage === "completed");
  const visibleProjects = tab === "active" ? activeProjects : historyProjects;

  return (
    <div>
      <div className="flex gap-1 border-b border-app-border">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={`min-h-10 border-b-2 px-4 text-sm font-semibold transition-colors ${
            tab === "active" ? "border-brand-500 text-brand-700" : "border-transparent text-app-muted hover:text-app-foreground"
          }`}
        >
          진행 중 ({activeProjects.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={`min-h-10 border-b-2 px-4 text-sm font-semibold transition-colors ${
            tab === "history" ? "border-brand-500 text-brand-700" : "border-transparent text-app-muted hover:text-app-foreground"
          }`}
        >
          프로젝트 히스토리 ({historyProjects.length})
        </button>
      </div>

      {visibleProjects.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-app-border-strong bg-app-surface p-10 text-center text-sm text-app-muted">
          {tab === "active" ? "진행 중인 프로젝트가 없습니다." : "완료된 프로젝트가 아직 없습니다."}
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {visibleProjects.map((project) => {
            const status = mapLifecycleStageToProjectStatus(project.lifecycleStage);
            const nextHref =
              project.lifecycleStage === "preparing"
                ? `/company/projects/${project.id}/sow`
                : `/company/projects/${project.id}/verification`;
            const amount = project.budgetMaxAmount == null
              ? `${project.budgetAmount.toLocaleString()} ${project.currency}`
              : `${project.budgetAmount.toLocaleString()}–${project.budgetMaxAmount.toLocaleString()} ${project.currency}`;

            const isCompleted = project.lifecycleStage === "completed";
            const isPreparing = project.lifecycleStage === "preparing";

            return (
              <article
                key={project.id}
                className="group rounded-xl border border-app-border bg-app-surface p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-300"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        isCompleted
                          ? "bg-green-50 text-green-700 border-green-200"
                          : isPreparing
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-brand-50 text-brand-700 border-brand-100"
                      }`}>
                        <span className={`size-1.5 rounded-full ${
                          isCompleted ? "bg-green-500" : isPreparing ? "bg-amber-500" : "bg-brand-500 animate-pulse"
                        }`} />
                        {LIFECYCLE_LABEL[project.lifecycleStage] ?? status}
                      </span>

                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-100/70 border border-slate-200/50 px-2 py-0.5 rounded-md">
                        <Users2 className="size-3 text-slate-400" />
                        제안서 {project.proposalCount}건
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-semibold text-app-foreground leading-snug truncate group-hover:text-brand-600 transition-colors">
                      {project.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-app-muted">
                      <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md text-slate-600">
                        <Wallet className="size-3.5 text-slate-400" />
                        계약금: {amount}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <CalendarDays className="size-3.5" />
                        등록일: {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start lg:self-center shrink-0">
                    {project.lifecycleStage === "preparing" ? (
                      <Link
                        href={nextHref}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50/50 hover:bg-brand-100/75 hover:border-brand-300 px-5 text-xs sm:text-sm font-semibold text-brand-700 hover:text-brand-800 transition-all duration-200 group shadow-xs active:scale-[0.98]"
                      >
                        업무 명세서 확인
                        <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : (
                      <Link
                        href={nextHref}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 px-5 text-xs sm:text-sm font-semibold text-white transition-all duration-200 group shadow-xs hover:shadow-md active:scale-[0.98]"
                      >
                        {isCompleted ? "증빙 확인" : "검수 현황 확인"}
                        <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
