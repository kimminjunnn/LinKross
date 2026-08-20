"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronRight, Clock, FileText, FolderKanban, Users2, type LucideIcon } from "lucide-react";

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

type ProposalGroup = { projectTitle: string; isProjectSelected: boolean; items: CompanyProposalSummary[] };

function groupProposalsByProject(proposals: CompanyProposalSummary[]) {
  const groups = new Map<string, ProposalGroup>();
  for (const proposal of proposals) {
    const group = groups.get(proposal.projectId);
    if (group) group.items.push(proposal);
    else groups.set(proposal.projectId, { projectTitle: proposal.projectTitle, isProjectSelected: proposal.isProjectSelected, items: [proposal] });
  }
  return groups;
}

function ProposalList({ proposals }: { proposals: CompanyProposalSummary[] }) {
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(new Set());
  const [showSelected, setShowSelected] = useState(false);

  if (proposals.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-app-border-strong bg-app-surface p-10 text-center text-sm text-app-muted">
        아직 제출된 수행 제안서가 없습니다.
      </p>
    );
  }

  // proposals는 이미 제출일 최신순으로 정렬돼 있어서, 그룹을 처음 만든 순서가
  // 곧 "가장 최근에 제안서가 들어온 프로젝트 순"이 된다.
  const groups = [...groupProposalsByProject(proposals).entries()];
  const openGroups = groups.filter(([, group]) => !group.isProjectSelected);
  const selectedGroups = groups.filter(([, group]) => group.isProjectSelected);

  function toggleProject(projectId: string) {
    setExpandedProjectIds((previous) => {
      const next = new Set(previous);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {openGroups.length === 0 && (
        <p className="rounded-xl border border-dashed border-app-border-strong bg-app-surface p-10 text-center text-sm text-app-muted">
          아직 선정하지 않은 프로젝트의 제안서가 없습니다.
        </p>
      )}
      {openGroups.map(([projectId, group]) => (
        <ProposalGroupCard key={projectId} projectId={projectId} group={group} isOpen={expandedProjectIds.has(projectId)} onToggle={() => toggleProject(projectId)} />
      ))}

      {selectedGroups.length > 0 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowSelected((value) => !value)}
            className="flex items-center gap-1.5 text-sm font-semibold text-app-muted hover:text-app-foreground"
          >
            <ChevronDown className={`size-4 transition-transform ${showSelected ? "rotate-180" : ""}`} />
            이미 선정된 프로젝트 {selectedGroups.length}개 · 제안서 {selectedGroups.reduce((sum, [, group]) => sum + group.items.length, 0)}건 {showSelected ? "숨기기" : "보기"}
          </button>
          {showSelected && (
            <div className="mt-3 space-y-3">
              {selectedGroups.map(([projectId, group]) => (
                <ProposalGroupCard key={projectId} projectId={projectId} group={group} isOpen={expandedProjectIds.has(projectId)} onToggle={() => toggleProject(projectId)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProposalGroupCard({ projectId, group, isOpen, onToggle }: {
  projectId: string;
  group: ProposalGroup;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-xs">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-app-surface-subtle"
      >
        <div className="flex min-w-0 items-center gap-3">
          <ChevronRight className={`size-4 shrink-0 text-app-muted transition-transform ${isOpen ? "rotate-90" : ""}`} />
          <h3 className="truncate text-base font-semibold text-app-foreground">{group.projectTitle}</h3>
          {group.isProjectSelected && (
            <span className="shrink-0 rounded-full border border-accent-200 bg-accent-50 px-2 py-0.5 text-[11px] font-semibold text-accent-700">
              선정 완료
            </span>
          )}
        </div>
        <span className="shrink-0 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
          제안서 {group.items.length}건
        </span>
      </button>

      {isOpen && (
        <div className="divide-y divide-app-border border-t border-app-border">
          {group.items.map((proposal) => (
            <Link
              key={proposal.proposalId}
              href={`/company/assessments/${projectId}/candidates`}
              className="group flex items-center justify-between gap-4 p-4 pl-12 transition-colors hover:bg-app-surface-subtle"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-semibold text-app-foreground group-hover:text-brand-600">
                  {proposal.freelancerDisplayName}
                </p>
                {proposal.freelancerHeadline && <p className="truncate text-xs text-app-muted">{proposal.freelancerHeadline}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-slate-400">{new Date(proposal.submittedAt).toLocaleDateString()}</span>
                <ArrowRight className="size-4 text-app-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
