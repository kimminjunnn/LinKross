import { redirect } from "next/navigation";

import { getDefaultProjectTabSegment } from "@/config/project-navigation";
import { mapLifecycleStageToProjectStatus } from "@/config/project-lifecycle";
import { getCompanyProjectDetail } from "@/lib/backend";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const result = await getCompanyProjectDetail(projectId);
  if (!result.ok) {
    redirect("/company/projects");
  }

  const segment = getDefaultProjectTabSegment(mapLifecycleStageToProjectStatus(result.data.lifecycleStage));
  redirect(`/company/projects/${projectId}/${segment}`);
}
