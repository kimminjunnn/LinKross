"use client";

import { useState } from "react";
import { ArrowRight, FolderKanban } from "lucide-react";

import type { FreelancerProjectSummary } from "@/lib/backend";

export function ProjectListTabs({ projects }: { projects: FreelancerProjectSummary[] }) {
  const [tab, setTab] = useState<"active" | "history">("active");
  const activeProjects = projects.filter((project) => project.lifecycleStage !== "completed");
  const historyProjects = projects.filter((project) => project.lifecycleStage === "completed");
  const visibleProjects = tab === "active" ? activeProjects : historyProjects;

  return (
    <div className="mt-8">
      <div className="flex gap-1 border-b border-app-border">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={`min-h-10 border-b-2 px-4 text-sm font-semibold transition-colors ${
            tab === "active" ? "border-brand-500 text-brand-700" : "border-transparent text-app-muted hover:text-app-foreground"
          }`}
        >
          Active ({activeProjects.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={`min-h-10 border-b-2 px-4 text-sm font-semibold transition-colors ${
            tab === "history" ? "border-brand-500 text-brand-700" : "border-transparent text-app-muted hover:text-app-foreground"
          }`}
        >
          Project history ({historyProjects.length})
        </button>
      </div>

      {visibleProjects.length === 0 ? (
        <div className="mt-6 rounded-card border border-dashed border-app-border-strong p-10 text-center">
          <FolderKanban className="mx-auto size-9 text-app-muted" />
          <h2 className="mt-4 font-semibold text-app-foreground">
            {tab === "active" ? "No active projects" : "No completed projects yet"}
          </h2>
          <p className="mt-2 text-sm text-app-muted">
            {tab === "active"
              ? "A project appears here after the client selects your submitted proposal."
              : "Completed projects will show up here once the client marks them as done."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {visibleProjects.map((project) => (
            <article key={project.projectId} className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-app-muted">{project.organizationName}</p>
                  <h2 className="mt-1 text-xl font-semibold text-app-foreground">{project.title}</h2>
                  <p className="mt-2 text-sm text-app-muted">
                    {project.approvedMilestoneCount}/{project.milestoneCount} milestones approved · {project.lifecycleStage.replaceAll("_", " ")}
                  </p>
                </div>
                <a href={`/freelancer/projects/${project.projectId}`} className="primary-action inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-control px-5 text-sm font-semibold">
                  Open workspace <ArrowRight className="size-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
