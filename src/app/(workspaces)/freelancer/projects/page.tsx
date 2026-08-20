import { CircleAlert } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { listFreelancerProjects } from "@/lib/backend";

import { ProjectListTabs } from "./project-list-tabs";

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
          <p className="text-sm">{result.error.message}</p>
        </div>
      ) : (
        <ProjectListTabs projects={result.data} />
      )}
    </div>
  );
}
