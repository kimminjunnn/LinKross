import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { ProjectTabs } from "@/components/project/project-tabs";
import { StatusBadge } from "@/components/project/status-badge";

export default async function ProjectDetailLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}>) {
  const { projectId } = await params;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <nav aria-label="현재 위치" className="flex items-center gap-1 text-xs font-semibold text-app-muted">
        <Link href="/projects" className="hover:text-brand-700">프로젝트</Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <span>고객 포털 MVP</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black tracking-tight text-app-foreground sm:text-4xl">
          고객 포털 MVP
        </h1>
        <StatusBadge tone="brand">준비 중</StatusBadge>
      </div>

      <div className="mt-7 rounded-card border border-app-border bg-app-surface px-3 sm:px-5">
        <ProjectTabs projectId={projectId} />
      </div>

      <div className="mt-5">{children}</div>
    </div>
  );
}
