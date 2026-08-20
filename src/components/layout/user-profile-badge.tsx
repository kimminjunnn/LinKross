"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";

import { syncPendingOnboardingProfileAction } from "@/app/actions/profiles";
import type { WorkspaceRole } from "@/config/navigation";
import {
  ONBOARDING_PROFILE_STORAGE_KEY,
  type CurrentUserDisplay,
  type PendingOnboardingProfile,
} from "@/lib/onboarding-storage";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : () => {};

export function UserProfileBadge({
  initialDisplay,
  workspace,
}: {
  initialDisplay: CurrentUserDisplay | null;
  workspace: WorkspaceRole;
}) {
  const router = useRouter();
  const [display, setDisplay] = useState(initialDisplay);
  const [isSyncing, setIsSyncing] = useState(false);

  useIsomorphicLayoutEffect(() => {
    let isMounted = true;
    const raw = sessionStorage.getItem(ONBOARDING_PROFILE_STORAGE_KEY);
    if (!raw) {
      return () => {
        isMounted = false;
      };
    }

    setIsSyncing(true);

    let pending: PendingOnboardingProfile;
    try {
      pending = JSON.parse(raw) as PendingOnboardingProfile;
    } catch {
      sessionStorage.removeItem(ONBOARDING_PROFILE_STORAGE_KEY);
      setIsSyncing(false);
      return () => {
        isMounted = false;
      };
    }

    if (pending.role !== workspace) {
      setIsSyncing(false);
      return () => {
        isMounted = false;
      };
    }

    (async () => {
      const result = await syncPendingOnboardingProfileAction(pending);

      if (result.ok) {
        sessionStorage.removeItem(ONBOARDING_PROFILE_STORAGE_KEY);
        if (isMounted) {
          setDisplay(result.data);
          router.refresh();
        }
      } else {
        console.error("[onboarding-profile-sync] profile sync failed", result.error);
      }

      if (isMounted) {
        setIsSyncing(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [router, workspace]);

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-full bg-brand-50 text-brand-700">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        </span>
        <div className="hidden leading-tight md:block">
          <p className="text-sm text-app-foreground">
            {workspace === "freelancer" ? "Loading profile" : "프로필 저장 중"}
          </p>
          <p className="mt-0.5 text-xs text-app-muted">
            {workspace === "freelancer" ? "Please wait" : "잠시만 기다려주세요"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-full bg-brand-100 text-xs text-brand-800"
      >
        {display?.initial ?? "?"}
      </span>
      <div className="hidden leading-tight md:block">
        <p className="text-sm text-app-foreground">
          {display?.name ?? (workspace === "freelancer" ? "Guest" : "게스트")}
        </p>
        <p className="mt-0.5 text-xs text-app-muted">
          {workspace === "freelancer" ? "Freelancer" : (display?.roleLabel ?? "")}
        </p>
      </div>
    </div>
  );
}
