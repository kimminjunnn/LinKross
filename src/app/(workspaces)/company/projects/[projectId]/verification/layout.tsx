import { notFound, redirect } from "next/navigation";

import { getDefaultProjectTabSegment, isProjectTabAvailable } from "@/config/project-navigation";
import { PROJECTS } from "@/data/projects";

export default async function VerificationLayout({
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

  if (!isProjectTabAvailable(project.status, "verification")) {
    const segment = getDefaultProjectTabSegment(project.status);
    redirect(`/company/projects/${projectId}/${segment}`);
  }

  return children;
}
