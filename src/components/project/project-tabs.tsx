"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { projectTabs } from "@/config/project-navigation";

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="프로젝트 상세 메뉴" className="overflow-x-auto border-b border-app-border">
      <ul className="flex min-w-max">
        {projectTabs.map((tab) => {
          const href = `/projects/${projectId}/${tab.segment}`;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={tab.segment} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex min-h-14 min-w-40 items-center justify-center px-5 text-sm font-bold transition-colors ${
                  isActive
                    ? "text-brand-700"
                    : "text-app-muted hover:text-app-foreground"
                }`}
              >
                {tab.label}
                {isActive ? (
                  <span className="absolute inset-x-5 bottom-0 h-0.5 rounded-pill bg-brand-500" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
