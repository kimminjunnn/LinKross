"use client";

import { useState } from "react";

import { projectStatuses } from "@/config/project-lifecycle";
import type { Project, ProjectStatus } from "@/data/projects";

import { ProjectCard } from "./project-card";

const FILTERS = [
  "전체",
  projectStatuses.preparing,
  projectStatuses.inProgress,
  projectStatuses.completed,
  projectStatuses.cancelled,
] as const;

type ProjectFilter = (typeof FILTERS)[number];

export function ProjectList({ projects }: { projects: readonly Project[] }) {
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>("전체");
  const filteredProjects =
    activeFilter === "전체"
      ? projects
      : projects.filter((project) => project.status === activeFilter);

  const counts: Record<ProjectFilter, number> = {
    전체: projects.length,
    [projectStatuses.preparing]: countProjectsByStatus(projects, projectStatuses.preparing),
    [projectStatuses.inProgress]: countProjectsByStatus(projects, projectStatuses.inProgress),
    [projectStatuses.completed]: countProjectsByStatus(projects, projectStatuses.completed),
    [projectStatuses.cancelled]: countProjectsByStatus(projects, projectStatuses.cancelled),
  };

  return (
    <>
      <div
        className="mt-7 flex gap-2 overflow-x-auto pb-1"
        aria-label="프로젝트 상태 필터"
      >
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter;

          return (
            <button
              key={filter}
              type="button"
              aria-controls="project-list"
              aria-pressed={isActive}
              onClick={() => setActiveFilter(filter)}
              className={`min-h-10 shrink-0 rounded-control px-4 text-sm font-bold transition-colors ${
                isActive
                  ? "bg-app-foreground text-white"
                  : "border border-app-border-strong bg-app-surface text-app-muted hover:text-app-foreground"
              }`}
            >
              {filter} {counts[filter]}
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        {activeFilter} 프로젝트 {filteredProjects.length}개를 표시합니다.
      </p>

      <div id="project-list" className="mt-5 space-y-4">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        ) : (
          <div className="rounded-card border border-dashed border-app-border-strong bg-app-surface p-10 text-center text-sm font-semibold text-app-muted">
            해당 상태의 프로젝트가 없습니다.
          </div>
        )}
      </div>
    </>
  );
}

function countProjectsByStatus(
  projects: readonly Project[],
  status: ProjectStatus,
) {
  return projects.filter((project) => project.status === status).length;
}
