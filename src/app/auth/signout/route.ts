import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

async function signOutAndRedirect(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  // 폼 POST 이후에는 303으로 GET 전환해야 목적지에 POST가 재전송되지 않는다.
  // 로그아웃한 사용자는 신규 가입용 온보딩이 아니라 공개 홈으로 돌아간다.
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}

export const POST = signOutAndRedirect;
// 개발 중 브라우저 주소창으로 바로 로그아웃 테스트를 할 수 있도록 GET도 허용한다.
export const GET = signOutAndRedirect;
