import { CircleAlert } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { listCompanyWorkspaceProjects } from "@/lib/backend";

import { CompanyProjectList } from "../projects/project-list";

export default async function ProjectHistoryPage() {
  const result = await listCompanyWorkspaceProjects();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <PageHeader
        title="프로젝트 히스토리"
        description="정산까지 모두 완료되어 종료 처리된 프로젝트만 모아서 확인합니다."
      />

      {!result.ok ? (
        <div className="flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-danger">
          <CircleAlert className="size-5 shrink-0" />
          <p className="text-sm">{result.error.message}</p>
        </div>
      ) : (
        <CompanyProjectList
          projects={result.data.filter((project) => project.lifecycleStage === "completed")}
          emptyMessage="아직 완료 처리된 프로젝트가 없습니다."
        />
      )}
    </div>
  );
}
