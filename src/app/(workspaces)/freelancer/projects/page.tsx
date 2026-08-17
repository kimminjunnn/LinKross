import Link from "next/link";
import { ArrowRight, CircleAlert, FolderKanban } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { listFreelancerProjects } from "@/lib/backend";

export default async function FreelancerProjectsListPage() {
  const result = await listFreelancerProjects();

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      <PageHeader
        eyebrow="Developer Workspace"
        title="My Projects"
        description="Only projects where your proposal was selected are shown here."
      />

      {!result.ok ? (
        <div className="mt-8 flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-danger">
          <CircleAlert className="size-5 shrink-0" />
          <p className="text-sm font-bold">{result.error.message}</p>
        </div>
      ) : result.data.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-app-border-strong p-10 text-center">
          <FolderKanban className="mx-auto size-9 text-app-muted" />
          <h2 className="mt-4 font-black text-app-foreground">No selected projects yet</h2>
          <p className="mt-2 text-sm text-app-muted">A project appears after the client selects your submitted proposal.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {result.data.map((project) => (
            <article key={project.projectId} className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-700">{project.organizationName}</p>
                  <h2 className="mt-2 text-xl font-black text-app-foreground">{project.title}</h2>
                  <p className="mt-2 text-sm text-app-muted">
                    {project.approvedMilestoneCount}/{project.milestoneCount} milestones approved · {project.lifecycleStage.replaceAll("_", " ")}
                  </p>
                </div>
                <Link href={`/freelancer/projects/${project.projectId}`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-600">
                  Open workspace <ArrowRight className="size-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
