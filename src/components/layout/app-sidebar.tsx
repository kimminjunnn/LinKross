import { CircleHelp } from "lucide-react";

import { SidebarNavigation } from "@/components/layout/sidebar-navigation";
import {
  workspaceNavigation,
  type WorkspaceRole,
} from "@/config/navigation";

const sidebarCopy = {
  company: {
    navigation: "주요 메뉴",
    title: "도움이 필요하신가요?",
    description: "합의한 완료 조건과 다음 행동을 기준으로 프로젝트를 확인하세요.",
  },
  freelancer: {
    navigation: "Primary navigation",
    title: "Need help?",
    description:
      "Use the agreed acceptance criteria and next action to stay on track.",
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

        <div className="mt-auto pt-8">
          <div className="rounded-card border border-accent-100 bg-accent-50 p-4">
            <div className="flex items-center gap-2 text-sm text-accent-800">
              <CircleHelp aria-hidden="true" className="size-4" />
              {copy.title}
            </div>
            <p className="mt-2 text-xs leading-5 text-accent-800/80">
              {copy.description}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
