"use client";

import { SidebarNavigation } from "@/components/layout/sidebar-navigation";
import { useSidebarState } from "@/components/layout/sidebar-state";
import {
  workspaceNavigation,
  type WorkspaceRole,
} from "@/config/navigation";

const sidebarCopy = {
  company: {
    navigation: "주요 메뉴",
  },
  freelancer: {
    navigation: "Primary navigation",
  },
} as const;

export function AppSidebar({ workspace }: { workspace: WorkspaceRole }) {
  const copy = sidebarCopy[workspace];
  const { isCollapsed } = useSidebarState();

  return (
    <aside
      id="desktop-sidebar"
      aria-label={copy.navigation}
      className={`sticky top-[var(--app-header-height)] hidden h-[calc(100vh-var(--app-header-height))] shrink-0 self-start overflow-hidden border-r border-app-border bg-app-surface transition-[width] duration-200 motion-reduce:transition-none lg:flex lg:flex-col print:hidden ${
        isCollapsed
          ? "w-[var(--app-sidebar-collapsed-width)]"
          : "w-[var(--app-sidebar-width)]"
      }`}
    >
      <div
        className={`flex h-full flex-col overflow-y-auto py-4 ${
          isCollapsed ? "px-2" : "px-3"
        }`}
      >
        <SidebarNavigation
          sections={workspaceNavigation[workspace]}
          ariaLabel={copy.navigation}
          isCollapsed={isCollapsed}
        />
      </div>
    </aside>
  );
}
