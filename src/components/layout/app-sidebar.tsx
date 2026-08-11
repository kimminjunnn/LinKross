import { CircleHelp } from "lucide-react";

import { SidebarNavigation } from "@/components/layout/sidebar-navigation";

export function AppSidebar() {
  return (
    <aside className="hidden w-[var(--app-sidebar-width)] shrink-0 border-r border-app-border bg-app-surface lg:flex lg:flex-col">
      <div className="sticky top-[var(--app-header-height)] flex max-h-[calc(100vh-var(--app-header-height))] min-h-[calc(100vh-var(--app-header-height))] flex-col overflow-y-auto px-3 py-5">
        <SidebarNavigation />

        <div className="mt-auto pt-8">
          <div className="rounded-card border border-accent-100 bg-accent-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-accent-800">
              <CircleHelp aria-hidden="true" className="size-4" />
              도움이 필요하신가요?
            </div>
            <p className="mt-2 text-xs leading-5 text-accent-800/80">
              합의한 완료 조건과 다음 행동을 기준으로 프로젝트를 확인하세요.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
