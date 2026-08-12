import { notFound, redirect } from "next/navigation";

import { isProjectPreparing } from "@/config/project-lifecycle";
import { PROJECTS } from "@/data/projects";

export default async function ApprovalLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}>) {
  const { projectId } = await params;
  const project = PROJECTS.find((item) => item.id === projectId);

  if (!project) {
    notFound();
  }

  if (!isProjectPreparing(project.status)) {
    redirect(`/company/projects/${projectId}/sow`);
  }

  return children;
}
