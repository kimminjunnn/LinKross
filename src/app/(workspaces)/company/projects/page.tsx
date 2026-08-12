import { SlidersHorizontal } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { PROJECTS } from "@/data/projects";

import { ProjectList } from "./_components/project-list";

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

      <ProjectList projects={PROJECTS} />
    </div>
  );
}
