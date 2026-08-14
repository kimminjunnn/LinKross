import { notFound, redirect } from "next/navigation";

import { isProjectPreparing, mapLifecycleStageToProjectStatus } from "@/config/project-lifecycle";
import { getCompanyProjectDetail } from "@/lib/backend";

export default async function ApprovalLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}>) {
  const { projectId } = await params;
  const result = await getCompanyProjectDetail(projectId);

  if (!result.ok) {
    notFound();
  }

  const status = mapLifecycleStageToProjectStatus(result.data.lifecycleStage);

  if (!isProjectPreparing(status)) {
    redirect(`/company/projects/${projectId}/sow`);
  }

  return children;
}
