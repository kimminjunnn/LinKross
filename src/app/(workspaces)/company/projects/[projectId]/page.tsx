import { redirect } from "next/navigation";

import { getDefaultProjectTabSegment } from "@/config/project-navigation";
import { PROJECTS } from "@/data/projects";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = PROJECTS.find((item) => item.id === projectId);

  if (!project) {
    redirect("/company/projects");
  }

  const segment = getDefaultProjectTabSegment(project.status);
  redirect(`/company/projects/${projectId}/${segment}`);
}
