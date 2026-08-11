import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

async function signOutAndRedirect(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/onboarding", new URL(request.url).origin));
}

export const POST = signOutAndRedirect;
// 개발 중 브라우저 주소창으로 바로 로그아웃 테스트를 할 수 있도록 GET도 허용한다.
export const GET = signOutAndRedirect;
