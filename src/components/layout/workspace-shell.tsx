import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarStateProvider } from "@/components/layout/sidebar-state";
import type { WorkspaceRole } from "@/config/navigation";

export function WorkspaceShell({
  children,
  workspace,
}: {
  children: React.ReactNode;
  workspace: WorkspaceRole;
}) {
  const shell = (
    <div className="flex min-h-screen flex-col bg-app-canvas">
      <AppHeader workspace={workspace} />
      <div className="mx-auto flex w-full max-w-[var(--app-max-width)] flex-1">
        {workspace !== "freelancer" && <AppSidebar workspace={workspace} />}
        <main
          id="main-content"
          className="flex min-w-0 flex-1 flex-col px-[var(--app-content-padding)] py-6 lg:py-8"
        >
          {children}
        </main>
      </div>
      <AppFooter />
    </div>
  );

  return workspace === "company" ? (
    <SidebarStateProvider>{shell}</SidebarStateProvider>
  ) : (
    shell
  );
}
