"use client";

import { useEffect } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ONBOARDING_PROFILE_STORAGE_KEY,
  type PendingOnboardingProfile,
} from "@/lib/onboarding-storage";

// 로그인 전 온보딩 폼에서 임시 저장해둔 값을, 로그인 완료 후 이 컴포넌트가
// 마운트되는 시점에 읽어서 해당 역할의 프로필 테이블에 반영한다.
export function OnboardingProfileSync() {
  useEffect(() => {
    const raw = sessionStorage.getItem(ONBOARDING_PROFILE_STORAGE_KEY);
    if (!raw) {
      return;
    }

    let pending: PendingOnboardingProfile;
    try {
      pending = JSON.parse(raw) as PendingOnboardingProfile;
    } catch {
      sessionStorage.removeItem(ONBOARDING_PROFILE_STORAGE_KEY);
      return;
    }

    const supabase = createSupabaseBrowserClient();

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const table = pending.role === "company" ? "company_profiles" : "freelancer_profiles";
      const { error } = await supabase.from(table).upsert({ id: user.id, ...pending.data }, { onConflict: "id" });

      if (!error) {
        sessionStorage.removeItem(ONBOARDING_PROFILE_STORAGE_KEY);
      }
    })();
  }, []);

  return null;
}
