import Link from "next/link";
import { CircleAlert, Plus, FolderKanban } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { listCompanyWorkspaceProjects } from "@/lib/backend";

import { ProjectDashboard } from "./project-dashboard";

export default async function ProjectsPage() {
  const result = await listCompanyWorkspaceProjects();
  const activeProjects = (result.ok ? result.data : []).filter((project) => project.lifecycleStage !== "completed");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <PageHeader
        title="프로젝트"
        description="선정된 개발자와 합의한 업무, 검수 현황과 다음 행동을 실제 프로젝트 기록으로 확인합니다."
        actions={
          <Link
            href="/company/projects/new"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 px-4 text-xs sm:text-sm font-semibold text-white shadow-xs hover:shadow-md transition-all duration-200"
          >
            <Plus className="size-4" />새 프로젝트
          </Link>
        }
      />

      {!result.ok ? (
        <div className="mt-7 flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-danger">
          <CircleAlert className="size-5 shrink-0" />
          <p className="text-sm">{result.error.message}</p>
        </div>
      ) : activeProjects.length === 0 ? (
        <div className="mt-7 rounded-xl border border-dashed border-app-border-strong p-16 text-center bg-white shadow-xs max-w-2xl mx-auto space-y-4">
          <div className="size-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <FolderKanban className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="text-base text-app-foreground">아직 프로젝트가 없습니다.</p>
            <p className="text-xs sm:text-sm text-app-muted max-w-sm mx-auto leading-relaxed">
              새로운 프로젝트를 등록하면 지원자 모집부터 SOW 합의, 자동 검수 및 정산까지 LinKross의 통합 관리가 시작됩니다.
            </p>
          </div>
          <Link
            href="/company/projects/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 px-4 text-xs font-semibold text-white transition-all shadow-xs"
          >
            <Plus className="size-4" /> 첫 프로젝트 만들기
          </Link>
        </div>
      ) : (
        <ProjectDashboard projects={activeProjects} />
      )}
    </div>
  );
}
