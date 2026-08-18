import { ArrowLeftRight, LogOut } from "lucide-react";

import { switchWorkspace } from "@/app/actions/workspace";
import { BrandLogo } from "@/components/layout/brand-logo";
import { HeaderTabs } from "@/components/layout/header-tabs";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { UserProfileBadge } from "@/components/layout/user-profile-badge";
import type { WorkspaceRole } from "@/config/navigation";
import { listCompanyNotifications, listFreelancerNotifications } from "@/lib/backend";
import { getCurrentUserDisplay } from "@/lib/profile-display";

export async function AppHeader({ workspace }: { workspace: WorkspaceRole }) {
  const currentUser = await getCurrentUserDisplay(workspace);
  const isFreelancer = workspace === "freelancer";
  const otherWorkspace = isFreelancer ? "company" : "freelancer";
  const notificationHref = isFreelancer ? "/freelancer/notifications" : "/company/notifications";
  const notifications = isFreelancer
    ? await listFreelancerNotifications()
    : await listCompanyNotifications();
  const actionNotificationIds = notifications.ok
    ? notifications.data
        .filter((notification) => notification.requiresAction)
        .map((notification) => notification.id)
    : [];

  return (
    <header className="sticky top-0 z-40 h-[var(--app-header-height)] border-b border-app-border bg-app-surface print:hidden">
      <div className="mx-auto flex h-full w-full max-w-[var(--app-max-width)]">
        <div
          className={`flex items-center gap-2 px-3 sm:px-4 lg:px-5 ${
            isFreelancer
              ? "lg:w-auto lg:border-r-0"
              : "lg:w-[var(--app-sidebar-width)] lg:border-r lg:border-app-border"
          }`}
        >
          <MobileNavigation workspace={workspace} />
          <BrandLogo
            ariaLabel={isFreelancer ? "Go to freelancer home" : "기업 홈으로 이동"}
            href={isFreelancer ? "/freelancer" : "/company"}
          />
          {isFreelancer && <HeaderTabs />}
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-4 px-3 sm:px-5 lg:px-6">
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <NotificationBell
              actionNotificationIds={actionNotificationIds}
              href={notificationHref}
              workspace={workspace}
            />

            <div className="h-7 w-px bg-app-border" aria-hidden="true" />

            <UserProfileBadge
              initialDisplay={currentUser}
              workspace={workspace}
            />

            <form action={switchWorkspace}>
              <input type="hidden" name="role" value={otherWorkspace} />
              <button
                type="submit"
                aria-label={
                  isFreelancer
                    ? "Switch to company workspace"
                    : "프리랜서 워크스페이스로 전환"
                }
                className="grid size-10 place-items-center rounded-control text-app-muted hover:bg-app-surface-subtle hover:text-app-foreground"
              >
                <ArrowLeftRight aria-hidden="true" className="size-5" />
              </button>
            </form>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                aria-label={isFreelancer ? "Sign out" : "로그아웃"}
                className="grid size-10 place-items-center rounded-control text-app-muted hover:bg-app-surface-subtle hover:text-app-foreground"
              >
                <LogOut aria-hidden="true" className="size-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
