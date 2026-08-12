import { NextResponse } from "next/server";

import { isUserRole } from "@/config/roles";
import { getSafePathForRole } from "@/lib/auth-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const roleParam = url.searchParams.get("role");
  const role = roleParam && isUserRole(roleParam) ? roleParam : null;
  const requestedNextPath = url.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/onboarding?error=missing_code", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/onboarding?error=auth_failed", url.origin));
  }

  const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("id, active_role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (selectError) {
    console.error("[auth/callback] profiles 조회 실패", selectError);
    return NextResponse.redirect(new URL("/onboarding?error=profile_lookup_failed", url.origin));
  }

  if (!existingProfile) {
    if (!role) {
      return NextResponse.redirect(new URL("/onboarding?error=missing_role", url.origin));
    }

    const { error: insertError } = await supabase
      .from("profiles")
      .insert({ id: data.user.id, active_role: role });

    if (insertError) {
      console.error("[auth/callback] profiles 생성 실패", insertError);
      return NextResponse.redirect(new URL("/onboarding?error=profile_create_failed", url.origin));
    }
  }

  if (role) {
    const { error: roleInsertError } = await supabase
      .from("user_roles")
      .insert({ user_id: data.user.id, role });

    if (roleInsertError && roleInsertError.code !== "23505") {
      console.error("[auth/callback] 사용자 역할 추가 실패", roleInsertError);
      return NextResponse.redirect(
        new URL("/login?error=role_setup_failed", url.origin),
      );
    }

    const { error: activeRoleError } = await supabase
      .from("profiles")
      .update({ active_role: role })
      .eq("id", data.user.id);

    if (activeRoleError) {
      console.error("[auth/callback] 활성 역할 변경 실패", activeRoleError);
      return NextResponse.redirect(
        new URL("/login?error=role_setup_failed", url.origin),
      );
    }
  }

  const { data: roleRows, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id);

  if (rolesError) {
    console.error("[auth/callback] 사용자 역할 조회 실패", rolesError);
    return NextResponse.redirect(
      new URL("/login?error=role_setup_failed", url.origin),
    );
  }

  const roles = (roleRows ?? [])
    .map(({ role: storedRole }) => storedRole)
    .filter((storedRole) => isUserRole(storedRole));
  const storedActiveRole = existingProfile?.active_role;
  const effectiveRole =
    role ??
    (storedActiveRole &&
    isUserRole(storedActiveRole) &&
    roles.includes(storedActiveRole)
      ? storedActiveRole
      : roles[0]);

  if (!effectiveRole) {
    return NextResponse.redirect(new URL("/onboarding?error=missing_role", url.origin));
  }

  const nextPath = getSafePathForRole(requestedNextPath, effectiveRole);
  return NextResponse.redirect(new URL(nextPath, url.origin));
}
