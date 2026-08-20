import { SidebarNavigation } from "@/components/layout/sidebar-navigation";
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

  return (
    <aside className="hidden w-[var(--app-sidebar-width)] shrink-0 border-r border-app-border bg-app-surface lg:flex lg:flex-col print:hidden">
      <div className="sticky top-[var(--app-header-height)] flex max-h-[calc(100vh-var(--app-header-height))] min-h-[calc(100vh-var(--app-header-height))] flex-col overflow-y-auto px-3 py-5">
        <SidebarNavigation
          sections={workspaceNavigation[workspace]}
          ariaLabel={copy.navigation}
        />
      </div>
    </aside>
  );
}
