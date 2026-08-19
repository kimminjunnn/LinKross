import Link from "next/link";
import { 
  ArrowRight, 
  CircleAlert, 
  Plus, 
  FolderKanban, 
  Clock, 
  CheckCircle2, 
  Users2, 
  Wallet, 
  CalendarDays,
  FileText
} from "lucide-react";

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
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 px-4 text-xs sm:text-sm font-bold text-white shadow-xs hover:shadow-md transition-all duration-200"
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
              color: "text-indigo-650 bg-indigo-50 border-indigo-100"
            }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="rounded-xl border border-app-border bg-app-surface p-5 shadow-xs flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-app-muted">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-black text-app-foreground leading-none">{stat.value}</p>
                  <p className="text-[10px] text-app-muted/80">{stat.desc}</p>
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
        <div className="mt-7 flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-danger animate-fadeIn">
          <CircleAlert className="size-5 shrink-0" />
          <p className="text-sm font-bold">{result.error.message}</p>
        </div>
      ) : result.data.length === 0 ? (
        <div className="mt-7 rounded-xl border border-dashed border-app-border-strong p-16 text-center bg-white shadow-xs max-w-2xl mx-auto space-y-4 animate-fadeIn">
          <div className="size-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <FolderKanban className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="font-extrabold text-base text-app-foreground">아직 프로젝트가 없습니다.</p>
            <p className="text-xs sm:text-sm text-app-muted max-w-sm mx-auto leading-relaxed">
              새로운 프로젝트를 등록하면 지원자 모집부터 SOW 합의, 자동 검수 및 정산까지 LinKross의 통합 관리가 시작됩니다.
            </p>
          </div>
          <Link
            href="/company/projects/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 px-4 text-xs font-bold text-white transition-all shadow-xs"
          >
            <Plus className="size-4" /> 첫 프로젝트 만들기
          </Link>
        </div>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          {result.data.map((project) => {
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
                className="group rounded-xl border border-app-border bg-app-surface p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-slate-350 transition-all duration-300"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    {/* Badge row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        isCompleted
                          ? "bg-green-50 text-green-700 border-green-200"
                          : isPreparing
                          ? "bg-amber-55/10 text-amber-700 border-amber-250/20"
                          : "bg-brand-50 text-brand-700 border-brand-100"
                      }`}>
                        <span className={`size-1.5 rounded-full ${
                          isCompleted ? "bg-green-500" : isPreparing ? "bg-amber-500" : "bg-brand-500 animate-pulse"
                        }`} />
                        {LIFECYCLE_LABEL[project.lifecycleStage] ?? status}
                      </span>
                      
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-100/70 border border-slate-200/50 px-2 py-0.5 rounded-md">
                        <Users2 className="size-3 text-slate-400" />
                        제안서 {project.proposalCount}건
                      </span>
                    </div>

                    {/* Project Title */}
                    <h2 className="text-lg sm:text-xl font-extrabold text-app-foreground leading-snug truncate group-hover:text-brand-600 transition-colors">
                      {project.title}
                    </h2>

                    {/* Metadata line */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-app-muted">
                      <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md text-slate-600">
                        <Wallet className="size-3.5 text-slate-400" />
                        계약금: {amount}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                        <CalendarDays className="size-3.5" />
                        등록일: {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex items-center gap-3 self-start lg:self-center shrink-0">
                    {project.lifecycleStage === "preparing" ? (
                      <Link
                        href={nextHref}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50/50 hover:bg-brand-100/75 hover:border-brand-300 px-5 text-xs sm:text-sm font-bold text-brand-700 hover:text-brand-800 transition-all duration-200 group shadow-xs active:scale-[0.98]"
                      >
                        업무 명세서 확인
                        <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : (
                      <Link
                        href={nextHref}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 px-5 text-xs sm:text-sm font-bold text-white transition-all duration-200 group shadow-xs hover:shadow-md active:scale-[0.98]"
                      >
                        검수 현황 확인
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
