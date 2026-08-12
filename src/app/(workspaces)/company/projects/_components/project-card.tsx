import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";

import { ProgressSteps } from "@/components/project/progress-steps";
import { StatusBadge } from "@/components/project/status-badge";
import { projectStatuses } from "@/config/project-lifecycle";
import type { PreparationStep, Project } from "@/data/projects";

type PreparingProject = Extract<Project, { status: typeof projectStatuses.preparing }>;
type MilestoneProject = Exclude<Project, PreparingProject>;

export function ProjectCard({ project }: { project: Project }) {
  if (project.status === projectStatuses.preparing) {
    return <PreparingProjectCard project={project} />;
  }

  return <MilestoneProjectCard project={project} />;
}

function PreparingProjectCard({ project }: { project: PreparingProject }) {
  return (
    <article className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.8fr_1.55fr_auto] xl:items-center">
        <ProjectIdentity project={project} assigneeLabel="담당 프리랜서" />
        <ProjectFacts project={project} />

        <div>
          <p className="text-xs font-semibold text-app-muted">착수 준비 현황</p>
          <ol className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {project.preparation.steps.map((step) => (
              <PreparationStepItem key={step.id} step={step} />
            ))}
          </ol>
        </div>

        <ProjectActionLink
          href={project.preparation.action.href}
          label={project.preparation.action.label}
        />
      </div>
    </article>
  );
}

function MilestoneProjectCard({ project }: { project: MilestoneProject }) {
  return (
    <article className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.9fr_1fr_1fr_auto] xl:items-center">
        <ProjectIdentity project={project} assigneeLabel="담당 개발자" />
        <ProjectFacts project={project} />

        <dl className="grid grid-cols-2 gap-4 xl:grid-cols-1">
          <div>
            <dt className="text-xs font-semibold text-app-muted">현재 단계</dt>
            <dd className="mt-1 text-sm font-bold text-app-foreground">
              {project.current}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-app-muted">다음 행동</dt>
            <dd className="mt-1 text-sm font-bold text-brand-700">
              {project.next}
            </dd>
          </div>
        </dl>

        <ProgressSteps
          current={project.progress}
          total={project.total}
          label={`${project.progress}/${project.total}`}
        />

        <ProjectActionLink
          href={`/company/projects/${project.id}/sow`}
          label="상세 보기"
        />
      </div>
    </article>
  );
}

function ProjectIdentity({
  project,
  assigneeLabel,
}: {
  project: Project;
  assigneeLabel: string;
}) {
  return (
    <div>
      <StatusBadge tone={project.tone}>{project.status}</StatusBadge>
      <h2 className="mt-3 text-xl font-black tracking-tight text-app-foreground sm:text-2xl">
        {project.name}
      </h2>
      <p className="mt-3 text-sm text-app-muted">
        {assigneeLabel}{" "}
        <strong className="text-app-foreground">{project.assignee}</strong>
      </p>
    </div>
  );
}

function ProjectFacts({ project }: { project: Project }) {
  return (
    <dl className="grid grid-cols-2 gap-4 xl:grid-cols-1">
      <div>
        <dt className="text-xs font-semibold text-app-muted">프로젝트 기간</dt>
        <dd className="mt-1 text-sm font-bold text-app-foreground">
          {project.period}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-semibold text-app-muted">계약 금액</dt>
        <dd className="mt-1 text-sm font-bold text-app-foreground">
          {project.amount}
        </dd>
      </div>
    </dl>
  );
}

function PreparationStepItem({ step }: { step: PreparationStep }) {
  const statusLabel = {
    complete: "완료",
    current: "현재 단계",
    pending: "대기",
  }[step.status];

  return (
    <li
      aria-current={step.status === "current" ? "step" : undefined}
      className={`flex items-center gap-2 text-sm font-bold ${
        step.status === "pending" ? "text-app-muted" : "text-app-foreground"
      }`}
    >
      {step.status === "complete" ? (
        <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-success" />
      ) : (
        <Circle
          aria-hidden="true"
          className={`size-5 shrink-0 ${
            step.status === "current"
              ? "fill-brand-100 text-brand-500"
              : "text-app-border-strong"
          }`}
        />
      )}
      <span>
        <span className="sr-only">{statusLabel}: </span>
        {step.label}
      </span>
    </li>
  );
}

function ProjectActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-control bg-brand-500 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-600"
    >
      {label}
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  );
}
