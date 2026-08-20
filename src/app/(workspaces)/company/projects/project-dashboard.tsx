"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, FileText, FolderKanban, Users2, type LucideIcon } from "lucide-react";

import type { CompanyProjectSummary, CompanyProposalSummary } from "@/lib/backend";

import { CompanyProjectList } from "./project-list";

type FilterKey = "all" | "in_progress" | "preparing" | "with_proposals";

export function ProjectDashboard({
  projects,
  proposals,
}: {
  projects: CompanyProjectSummary[];
  proposals: CompanyProposalSummary[];
}) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const totalCount = projects.length;
  const inProgressCount = projects.filter((project) => project.lifecycleStage === "in_progress").length;
  const preparingCount = projects.filter((project) => project.lifecycleStage === "preparing").length;
  const submittedProposals = proposals.filter((proposal) => proposal.status === "submitted");

  const filteredProjects = projects.filter((project) => {
    if (filter === "in_progress") return project.lifecycleStage === "in_progress";
    if (filter === "preparing") return project.lifecycleStage === "preparing";
    return true;
  });

  const stats: Array<{ key: FilterKey; label: string; value: string; desc: string; icon: LucideIcon; color: string }> = [
    { key: "all", label: "전체 프로젝트", value: `${totalCount}건`, desc: "등록 및 진행 중인 전체 수", icon: FolderKanban, color: "text-slate-700 bg-slate-100 border-slate-200" },
    { key: "in_progress", label: "진행 중인 업무", value: `${inProgressCount}건`, desc: "실시간 빌드 검수 및 실행 중", icon: Clock, color: "text-brand-600 bg-brand-50 border-brand-100" },
    { key: "preparing", label: "착수 준비 중", value: `${preparingCount}건`, desc: "요구사항 및 SOW 합의 대기", icon: FileText, color: "text-amber-600 bg-amber-50 border-amber-100" },
    { key: "with_proposals", label: "제출된 수행 제안서", value: `${submittedProposals.length}건`, desc: "지원자가 보낸 프로젝트 수행서", icon: Users2, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
  ];

  const emptyMessage = filter === "all"
    ? "진행 중인 프로젝트가 없습니다. 완료된 프로젝트는 프로젝트 히스토리에서 확인할 수 있습니다."
    : "조건에 맞는 프로젝트가 없습니다.";

  return (
    <>
      {totalCount > 0 && (
        <section role="radiogroup" aria-label="프로젝트 필터" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const isActive = filter === stat.key;
            return (
              <button
                key={stat.key}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setFilter(stat.key)}
                className={`flex items-center justify-between gap-4 rounded-xl border p-5 text-left shadow-xs transition-all ${
                  isActive
                    ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500"
                    : "border-app-border bg-app-surface hover:border-slate-300 hover:bg-app-surface-subtle"
                }`}
              >
                <div className="space-y-1">
                  <p className="text-xs text-app-muted">{stat.label}</p>
                  <p className="text-xl leading-none font-semibold text-app-foreground sm:text-2xl">{stat.value}</p>
                  <p className="text-xs text-app-muted/80">{stat.desc}</p>
                </div>
                <div className={`shrink-0 rounded-xl border p-3 ${stat.color}`}>
                  <Icon className="size-5" />
                </div>
              </button>
            );
          })}
        </section>
      )}

      <div className="mt-8">
        {filter === "with_proposals" ? (
          <ProposalList proposals={submittedProposals} />
        ) : (
          <CompanyProjectList projects={filteredProjects} emptyMessage={emptyMessage} />
        )}
      </div>
    </>
  );
}

function ProposalList({ proposals }: { proposals: CompanyProposalSummary[] }) {
  if (proposals.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-app-border-strong bg-app-surface p-10 text-center text-sm text-app-muted">
        아직 제출된 수행 제안서가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {proposals.map((proposal) => (
        <Link
          key={proposal.proposalId}
          href={`/company/assessments/${proposal.projectId}/candidates`}
          className="group flex items-center justify-between gap-4 rounded-xl border border-app-border bg-app-surface p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md"
        >
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold text-slate-400">{proposal.projectTitle}</p>
            <h3 className="truncate text-base font-semibold text-app-foreground group-hover:text-brand-600">
              {proposal.freelancerDisplayName}
            </h3>
            {proposal.freelancerHeadline && <p className="truncate text-xs text-app-muted">{proposal.freelancerHeadline}</p>}
            <p className="text-xs text-slate-400">제출일: {new Date(proposal.submittedAt).toLocaleDateString()}</p>
          </div>
          <span className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 text-xs font-semibold text-white transition-all group-hover:bg-brand-600 sm:text-sm">
            제안서 확인
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}
