"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, UserRound } from "lucide-react";

import { BrandLogo } from "@/components/layout/brand-logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getDefaultPathForRole,
  getSafeInternalPath,
} from "@/lib/auth-redirect";
import { isUserRole, userRoles, type UserRole } from "@/config/roles";

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
  missing_code: "로그인 정보를 받지 못했습니다. 다시 시도해주세요.",
  missing_role: "역할 정보가 없어 계정을 만들 수 없습니다. 아래 버튼으로 다시 시도해주세요.",
  not_configured: "로그인 기능이 아직 준비되지 않았습니다.",
  profile_lookup_failed: "계정 정보를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
  profile_create_failed: "계정 생성에 실패했습니다. 잠시 후 다시 시도해주세요.",
  role_setup_failed:
    "역할을 설정하지 못했습니다. 다중 역할 데이터 마이그레이션을 확인한 뒤 다시 시도해주세요.",
};

const roleIcons: Record<UserRole, typeof Building2> = {
  company: Building2,
  freelancer: UserRound,
};

const roleButtonLabels: Record<UserRole, string> = {
  company: "기업으로 Google 로그인",
  freelancer: "프리랜서로 Google 로그인",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const requestedRoleParam = searchParams.get("role");
  const requestedRole =
    requestedRoleParam && isUserRole(requestedRoleParam)
      ? requestedRoleParam
      : null;
  const nextPath = getSafeInternalPath(
    searchParams.get("next"),
    requestedRole ? getDefaultPathForRole(requestedRole) : "/",
  );
  const availableRoles = requestedRole
    ? userRoles.filter((role) => role.value === requestedRole)
    : userRoles;
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorCode ? (ERROR_MESSAGES[errorCode] ?? "로그인 중 문제가 발생했습니다.") : null,
  );

  async function handleGoogleLogin(role: UserRole) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setErrorMessage(ERROR_MESSAGES.not_configured);
      return;
    }

    setErrorMessage(null);
    setPendingRole(role);

    const supabase = createSupabaseBrowserClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("role", role);
    callbackUrl.searchParams.set("next", nextPath);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl.toString() },
    });

    if (error) {
      setPendingRole(null);
      setErrorMessage("Google 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-app-canvas px-4">
      <div className="w-full max-w-sm rounded-card border border-app-border bg-app-surface p-6 shadow-card sm:p-8">
        <div className="flex justify-center">
          <BrandLogo size="large" />
        </div>
        <p className="mt-3 text-center text-sm leading-6 text-app-muted">사람을 고르고, 일을 합의하고, 결과물을 검증합니다.</p>

        <div className="mt-8 space-y-3">
          {availableRoles.map((role) => {
            const Icon = roleIcons[role.value];
            const isPending = pendingRole === role.value;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => handleGoogleLogin(role.value)}
                disabled={pendingRole !== null}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-control border border-app-border-strong bg-app-surface px-4 text-sm text-app-foreground hover:bg-app-surface-subtle disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon className="size-4" />
                {isPending ? "Google로 이동 중..." : roleButtonLabels[role.value]}
              </button>
            );
          })}
        </div>

        {errorMessage ? <p className="mt-5 text-center text-xs text-warning">{errorMessage}</p> : null}
      </div>
    </div>
  );
}
