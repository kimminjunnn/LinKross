import Link from "next/link";
import {
  CircleAlert,
  Plus,
  FolderKanban,
  Clock,
  Users2,
  FileText
} from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { listCompanyWorkspaceProjects } from "@/lib/backend";

import { ProjectListTabs } from "./project-list-tabs";

export default async function ProjectsPage() {
  const result = await listCompanyWorkspaceProjects();

  // Calculate statistics for the top widgets
  const projects = result.ok ? result.data : [];
  const totalCount = projects.length;
  const inProgressCount = projects.filter(p => p.lifecycleStage === "in_progress").length;
  const preparingCount = projects.filter(p => p.lifecycleStage === "preparing").length;
  const totalProposals = projects.reduce((sum, p) => sum + (p.proposalCount || 0), 0);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      {/* Page Header */}
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

      {/* Top Summary Widgets (Deel / Remote style) */}
      {result.ok && totalCount > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
          {[
            {
              label: "전체 프로젝트",
              value: `${totalCount}건`,
              desc: "등록 및 진행 중인 전체 수",
              icon: FolderKanban,
              color: "text-slate-700 bg-slate-100 border-slate-200"
            },
            {
              label: "진행 중인 업무",
              value: `${inProgressCount}건`,
              desc: "실시간 빌드 검수 및 실행 중",
              icon: Clock,
              color: "text-brand-600 bg-brand-50 border-brand-100"
            },
            {
              label: "착수 준비 중",
              value: `${preparingCount}건`,
              desc: "요구사항 및 SOW 합의 대기",
              icon: FileText,
              color: "text-amber-600 bg-amber-50 border-amber-100"
            },
            {
              label: "제출된 수행 제안서",
              value: `${totalProposals}건`,
              desc: "지원자가 보낸 프로젝트 수행서",
              icon: Users2,
              color: "text-indigo-600 bg-indigo-50 border-indigo-100"
            }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="rounded-xl border border-app-border bg-app-surface p-5 shadow-xs flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-app-muted">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-semibold text-app-foreground leading-none">{stat.value}</p>
                  <p className="text-xs text-app-muted/80">{stat.desc}</p>
                </div>
                <div className={`p-3 rounded-xl border ${stat.color} shrink-0`}>
                  <Icon className="size-5" />
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Main Content Area */}
      {!result.ok ? (
        <div className="mt-7 flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-danger">
          <CircleAlert className="size-5 shrink-0" />
          <p className="text-sm">{result.error.message}</p>
        </div>
      ) : result.data.length === 0 ? (
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
        <ProjectListTabs projects={result.data} />
      )}
    </div>
  );
}
