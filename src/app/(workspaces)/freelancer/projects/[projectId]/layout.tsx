import Link from "next/link";
import { ArrowLeft, CircleAlert } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { listFreelancerProjects } from "@/lib/backend";

import { FreelancerProjectTabs } from "./_components/freelancer-project-tabs";

export default async function FreelancerProjectDetailLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}>) {
  const { projectId } = await params;
  const result = await listFreelancerProjects();

  if (!result.ok) return <ProjectAccessError message={result.error.message} />;

  const project = result.data.find((item) => item.projectId === projectId);
  if (!project) return <ProjectAccessError message="The selected project could not be found." />;

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      <Link
        href="/freelancer/projects"
        className="inline-flex items-center gap-2 text-sm font-bold text-app-muted hover:text-brand-700"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        My projects
      </Link>

      <div className="mt-4">
        <PageHeader
          eyebrow={project.organizationName}
          title={project.title}
          description="Review the project agreement, milestone verification, payments, and evidence in one continuous record."
        />
      </div>

      <FreelancerProjectTabs projectId={projectId} />
      <div className="mt-6">{children}</div>
    </div>
  );
}

function ProjectAccessError({ message }: { message: string }) {
  return (
    <div className="mx-auto w-full max-w-4xl rounded-card border border-danger/30 bg-danger/10 p-6 text-danger">
      <div className="flex gap-3">
        <CircleAlert aria-hidden="true" className="size-5 shrink-0" />
        <p className="text-sm font-bold">{message}</p>
      </div>
    </div>
  );
}
