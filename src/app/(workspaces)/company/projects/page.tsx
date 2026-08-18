import Link from "next/link";
import { ArrowRight, CircleAlert, Plus } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { StatusBadge } from "@/components/project/status-badge";
import { mapLifecycleStageToProjectStatus } from "@/config/project-lifecycle";
import { listCompanyWorkspaceProjects } from "@/lib/backend";

const LIFECYCLE_LABEL: Record<string, string> = {
  preparing: "착수 준비",
  in_progress: "진행 중",
  completed: "완료",
  cancelled: "취소",
  archived: "보관",
};

export default async function ProjectsPage() {
  const result = await listCompanyWorkspaceProjects();

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="프로젝트"
        description="선정된 개발자와 합의한 업무, 검수 현황과 다음 행동을 실제 프로젝트 기록으로 확인합니다."
        actions={
          <Link
            href="/company/projects/new"
            className="inline-flex min-h-11 items-center gap-2 rounded-control bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600"
          >
            <Plus className="size-4" />새 프로젝트
          </Link>
        }
      />

      {!result.ok ? (
        <div className="mt-7 flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-danger">
          <CircleAlert className="size-5 shrink-0" />
          <p className="text-sm font-bold">{result.error.message}</p>
        </div>
      ) : result.data.length === 0 ? (
        <div className="mt-7 rounded-card border border-dashed border-app-border-strong p-10 text-center">
          <p className="font-bold text-app-foreground">아직 프로젝트가 없습니다.</p>
          <p className="mt-2 text-sm text-app-muted">프로젝트를 등록하면 모집부터 지급 증빙까지 이곳에 이어집니다.</p>
        </div>
      ) : (
        <div className="mt-7 space-y-4">
          {result.data.map((project) => {
            const status = mapLifecycleStageToProjectStatus(project.lifecycleStage);
            const nextHref =
              project.lifecycleStage === "preparing"
                ? `/company/projects/${project.id}/sow`
                : `/company/projects/${project.id}/verification`;
            const amount = project.budgetMaxAmount == null
              ? `${project.budgetAmount.toLocaleString()} ${project.currency}`
              : `${project.budgetAmount.toLocaleString()}–${project.budgetMaxAmount.toLocaleString()} ${project.currency}`;

            return (
              <article key={project.id} className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={project.lifecycleStage === "completed" ? "success" : "brand"}>
                        {LIFECYCLE_LABEL[project.lifecycleStage] ?? status}
                      </StatusBadge>
                      <span className="text-xs font-semibold text-app-muted">
                        수행 제안서 {project.proposalCount}건
                      </span>
                    </div>
                    <h2 className="mt-3 truncate text-xl font-black text-app-foreground">{project.title}</h2>
                    <p className="mt-2 text-sm text-app-muted">계약 기준 금액 {amount}</p>
                  </div>
                  {project.lifecycleStage === "preparing" ? (
                    <Link
                      href={nextHref}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-control border border-brand-200 bg-brand-50/50 px-5 text-sm font-bold text-brand-700 hover:bg-brand-100/70 hover:border-brand-300 transition-all duration-200 group"
                    >
                      업무 명세서 확인
                      <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ) : (
                    <Link
                      href={nextHref}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-600 shadow-sm hover:shadow transition-all duration-200 group"
                    >
                      검수 현황 확인
                      <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
