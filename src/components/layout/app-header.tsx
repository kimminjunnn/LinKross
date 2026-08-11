import { Bell } from "lucide-react";

import { BrandLogo } from "@/components/layout/brand-logo";
import { MobileNavigation } from "@/components/layout/mobile-navigation";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 h-[var(--app-header-height)] border-b border-app-border bg-app-surface">
      <div className="mx-auto flex h-full w-full max-w-[var(--app-max-width)]">
        <div className="flex items-center gap-2 px-3 sm:px-4 lg:w-[var(--app-sidebar-width)] lg:border-r lg:border-app-border lg:px-5">
          <MobileNavigation />
          <BrandLogo />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-4 px-3 sm:px-5 lg:px-6">
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="relative grid size-10 place-items-center rounded-control text-app-muted">
              <Bell aria-hidden="true" className="size-5" />
              <span
                aria-hidden="true"
                className="absolute right-2 top-2 size-1.5 rounded-full bg-brand-500 ring-2 ring-app-surface"
              />
              <span className="sr-only">읽지 않은 알림이 있습니다</span>
            </div>

            <div className="h-7 w-px bg-app-border" aria-hidden="true" />

            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="grid size-9 place-items-center rounded-full bg-brand-100 text-xs font-black text-brand-800"
              >
                박
              </span>
              <div className="hidden leading-tight md:block">
                <p className="text-sm font-bold text-app-foreground">박피오</p>
                <p className="mt-0.5 text-xs text-app-muted">PO</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
