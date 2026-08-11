import { NextResponse } from "next/server";

import { isUserRole } from "@/config/roles";
import { getSafeInternalPath } from "@/lib/auth-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const roleParam = url.searchParams.get("role");
  const role = roleParam && isUserRole(roleParam) ? roleParam : null;
  const nextPath = getSafeInternalPath(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", url.origin));
  }

  const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (selectError) {
    console.error("[auth/callback] profiles 조회 실패", selectError);
    return NextResponse.redirect(new URL("/login?error=profile_lookup_failed", url.origin));
  }

  // 이미 프로필이 있으면 role 쿼리 파라미터는 무시한다 — 기존 사용자의 역할을 URL 조작으로 바꿀 수 없게 한다.
  if (!existingProfile) {
    if (!role) {
      return NextResponse.redirect(new URL("/login?error=missing_role", url.origin));
    }

    const { error: insertError } = await supabase.from("profiles").insert({ id: data.user.id, role });

    if (insertError) {
      console.error("[auth/callback] profiles 생성 실패", insertError);
      return NextResponse.redirect(new URL("/login?error=profile_create_failed", url.origin));
    }
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}
