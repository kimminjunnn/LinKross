import { notFound, redirect } from "next/navigation";

import { getDefaultProjectTabSegment, isProjectTabAvailable } from "@/config/project-navigation";
import { mapLifecycleStageToProjectStatus } from "@/config/project-lifecycle";
import { getCompanyProjectDetail } from "@/lib/backend";

export default async function VerificationLayout({
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

  if (!isProjectTabAvailable(status, "verification")) {
    const segment = getDefaultProjectTabSegment(status);
    redirect(`/company/projects/${projectId}/${segment}`);
  }

  return children;
}
