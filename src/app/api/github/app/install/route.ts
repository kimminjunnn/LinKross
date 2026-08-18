import { NextRequest, NextResponse } from "next/server";

import { getProjectGitHubAppInstallationUrl } from "@/lib/backend/verification";
import { isUuid } from "@/lib/backend/validation";

export const runtime = "nodejs";

const INSTALL_PROJECT_COOKIE = "linkross_github_install_project";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId") ?? "";
  if (!isUuid(projectId)) {
    return NextResponse.json({ message: "올바른 프로젝트 ID가 아닙니다." }, { status: 400 });
  }

  const result = await getProjectGitHubAppInstallationUrl(projectId);
  if (!result.ok) {
    const redirectUrl = new URL(`/company/projects/${projectId}/verification`, request.url);
    redirectUrl.searchParams.set("github", "install-error");
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.redirect(result.data.url);
  response.cookies.set(INSTALL_PROJECT_COOKIE, projectId, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/api/github/app/setup",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
