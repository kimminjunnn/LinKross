import Link from "next/link";
import { ArrowRight, SlidersHorizontal } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { ProgressSteps } from "@/components/project/progress-steps";
import { StatusBadge } from "@/components/project/status-badge";

const filters = ["전체 3", "준비 중 1", "진행 중 1", "완료 1"];

import { PROJECTS } from "@/data/projects";

export default function ProjectsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="프로젝트"
        description="선정된 개발자와 합의한 업무, 검수 현황과 다음 행동을 한 화면에서 확인합니다."
        actions={
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-control border border-app-border-strong bg-app-surface px-4 text-sm font-bold text-app-foreground"
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            최신순
          </button>
        }
      />

      <div className="mt-7 flex gap-2 overflow-x-auto pb-1" aria-label="프로젝트 상태 필터">
        {filters.map((filter, index) => (
          <button
            key={filter}
            type="button"
            aria-pressed={index === 0}
            className={`min-h-10 shrink-0 rounded-control px-4 text-sm font-bold ${
              index === 0
                ? "bg-app-foreground text-white"
                : "border border-app-border-strong bg-app-surface text-app-muted hover:text-app-foreground"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {PROJECTS.map((project) => (
          <article
            key={project.id}
            className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6"
          >
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.9fr_1fr_1fr_auto] xl:items-center">
              <div>
                <StatusBadge tone={project.tone}>{project.status}</StatusBadge>
                <h2 className="mt-3 text-xl font-black tracking-tight text-app-foreground sm:text-2xl">
                  {project.name}
                </h2>
                <p className="mt-3 text-sm text-app-muted">
                  담당 개발자 <strong className="text-app-foreground">{project.assignee}</strong>
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-4 xl:grid-cols-1">
                <div>
                  <dt className="text-xs font-semibold text-app-muted">프로젝트 기간</dt>
                  <dd className="mt-1 text-sm font-bold text-app-foreground">{project.period}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-app-muted">계약 금액</dt>
                  <dd className="mt-1 text-sm font-bold text-app-foreground">{project.amount}</dd>
                </div>
              </dl>

              <dl className="grid grid-cols-2 gap-4 xl:grid-cols-1">
                <div>
                  <dt className="text-xs font-semibold text-app-muted">현재 단계</dt>
                  <dd className="mt-1 text-sm font-bold text-app-foreground">{project.current}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-app-muted">다음 행동</dt>
                  <dd className="mt-1 text-sm font-bold text-brand-700">{project.next}</dd>
                </div>
              </dl>

              <ProgressSteps
                current={project.progress}
                total={project.total}
                label={`${project.progress}/${project.total}`}
              />

              <Link
                href={`/projects/${project.id}/sow`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600"
              >
                상세 보기
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
