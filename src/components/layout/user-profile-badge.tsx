"use client";

import { Loader2 } from "lucide-react";
import { useLayoutEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { WorkspaceRole } from "@/config/navigation";
import {
  ONBOARDING_PROFILE_STORAGE_KEY,
  buildDisplayFromPendingProfile,
  type CurrentUserDisplay,
  type PendingOnboardingProfile,
} from "@/lib/onboarding-storage";

// sessionStorage 체크는 클라이언트에서만 의미가 있다. useLayoutEffect는 서버에서
// 아무 동작도 안 하고 경고만 띄우므로, 서버 렌더 시점엔 빈 함수로 대체한다.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : () => {};

export function UserProfileBadge({
  initialDisplay,
  workspace,
}: {
  initialDisplay: CurrentUserDisplay | null;
  workspace: WorkspaceRole;
}) {
  const [display, setDisplay] = useState(initialDisplay);
  const [isSyncing, setIsSyncing] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const raw = sessionStorage.getItem(ONBOARDING_PROFILE_STORAGE_KEY);
    if (!raw) {
      return;
    }

    // 대기 중인 온보딩 값이 있으면 옛 이름이 잠깐이라도 보이지 않고
    // 페인트 전에 바로 스피너로 시작한다.
    setIsSyncing(true);

    let pending: PendingOnboardingProfile;
    try {
      pending = JSON.parse(raw) as PendingOnboardingProfile;
    } catch {
      sessionStorage.removeItem(ONBOARDING_PROFILE_STORAGE_KEY);
      setIsSyncing(false);
      return;
    }

    if (pending.role !== workspace) {
      setIsSyncing(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsSyncing(false);
        return;
      }

      const table = pending.role === "company" ? "company_profiles" : "freelancer_profiles";
      const { error } = await supabase.from(table).upsert({ id: user.id, ...pending.data }, { onConflict: "id" });

      if (!error) {
        sessionStorage.removeItem(ONBOARDING_PROFILE_STORAGE_KEY);
        // Supabase 재조회 없이, 방금 저장한 값 그대로 화면에 반영한다.
        setDisplay(buildDisplayFromPendingProfile(pending));
      }

      setIsSyncing(false);
    })();
  }, [workspace]);

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-full bg-brand-50 text-brand-700">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        </span>
        <div className="hidden leading-tight md:block">
          <p className="text-sm font-bold text-app-foreground">
            {workspace === "freelancer" ? "Loading profile" : "정보 불러오는 중"}
          </p>
          <p className="mt-0.5 text-xs text-app-muted">
            {workspace === "freelancer" ? "Please wait" : "잠시만요"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-full bg-brand-100 text-xs font-black text-brand-800"
      >
        {display?.initial ?? "?"}
      </span>
      <div className="hidden leading-tight md:block">
        <p className="text-sm font-bold text-app-foreground">
          {display?.name ?? (workspace === "freelancer" ? "Guest" : "게스트")}
        </p>
        <p className="mt-0.5 text-xs text-app-muted">
          {workspace === "freelancer" ? "Freelancer" : (display?.roleLabel ?? "")}
        </p>
      </div>
    </div>
  );
}
