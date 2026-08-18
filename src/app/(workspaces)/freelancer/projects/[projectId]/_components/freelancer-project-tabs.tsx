"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TAB_ITEMS = [
  { label: "Project", segment: "" },
  { label: "Milestones · Verification", segment: "verification" },
  { label: "Payments · Evidence", segment: "evidence" },
] as const;

export function FreelancerProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const basePath = `/freelancer/projects/${projectId}`;

  return (
    <nav aria-label="Freelancer project details" className="mt-6 border-b border-app-border">
      <ul className="grid grid-cols-3 sm:flex">
        {TAB_ITEMS.map((tab) => {
          const href = tab.segment ? `${basePath}/${tab.segment}` : basePath;
          const isActive = tab.segment
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname === href;

          return (
            <li key={tab.label}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex min-h-14 items-center justify-center px-2 text-center text-xs font-bold leading-4 transition-colors sm:min-w-40 sm:px-5 sm:text-sm ${
                  isActive
                    ? "text-brand-700"
                    : "text-app-muted hover:text-app-foreground"
                }`}
              >
                {tab.label}
                {isActive ? (
                  <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-0.5 rounded-pill bg-brand-500 sm:inset-x-5" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
