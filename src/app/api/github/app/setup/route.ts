import { NextRequest, NextResponse } from "next/server";

import { isUuid } from "@/lib/backend/validation";

export const runtime = "nodejs";

const INSTALL_PROJECT_COOKIE = "linkross_github_install_project";

export async function GET(request: NextRequest) {
  const projectId = request.cookies.get(INSTALL_PROJECT_COOKIE)?.value ?? "";
  const destination = isUuid(projectId)
    ? `/company/projects/${projectId}/verification`
    : "/company/projects";
  const redirectUrl = new URL(destination, request.url);

  // GitHub가 전달한 installation_id는 신뢰하거나 저장하지 않는다.
  // 실제 설치와 저장소 접근은 저장소 연결 시 GitHub API로 다시 검증한다.
  redirectUrl.searchParams.set("github", isInstallationCallback(request) ? "installed" : "setup-error");

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.delete(INSTALL_PROJECT_COOKIE);
  return response;
}

function isInstallationCallback(request: NextRequest): boolean {
  const installationId = request.nextUrl.searchParams.get("installation_id") ?? "";
  return /^\d+$/.test(installationId);
}
