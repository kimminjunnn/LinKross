import { ArrowLeftRight, Bell, LogOut } from "lucide-react";

import { switchWorkspace } from "@/app/actions/workspace";
import { BrandLogo } from "@/components/layout/brand-logo";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { UserProfileBadge } from "@/components/layout/user-profile-badge";
import type { WorkspaceRole } from "@/config/navigation";
import { getCurrentUserDisplay } from "@/lib/profile-display";

export async function AppHeader({ workspace }: { workspace: WorkspaceRole }) {
  const currentUser = await getCurrentUserDisplay(workspace);
  const isFreelancer = workspace === "freelancer";
  const otherWorkspace = isFreelancer ? "company" : "freelancer";

  return (
    <header className="sticky top-0 z-40 h-[var(--app-header-height)] border-b border-app-border bg-app-surface print:hidden">
      <div className="mx-auto flex h-full w-full max-w-[var(--app-max-width)]">
        <div className="flex items-center gap-2 px-3 sm:px-4 lg:w-[var(--app-sidebar-width)] lg:border-r lg:border-app-border lg:px-5">
          <MobileNavigation workspace={workspace} />
          <BrandLogo
            ariaLabel={isFreelancer ? "Go to freelancer home" : "기업 홈으로 이동"}
            href={isFreelancer ? "/freelancer" : "/company"}
          />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-4 px-3 sm:px-5 lg:px-6">
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="relative grid size-10 place-items-center rounded-control text-app-muted">
              <Bell aria-hidden="true" className="size-5" />
              <span
                aria-hidden="true"
                className="absolute right-2 top-2 size-1.5 rounded-full bg-brand-500 ring-2 ring-app-surface"
              />
              <span className="sr-only">
                {isFreelancer ? "You have unread notifications" : "읽지 않은 알림이 있습니다"}
              </span>
            </div>

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
