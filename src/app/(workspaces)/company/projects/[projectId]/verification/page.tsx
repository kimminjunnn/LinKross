import { AlertCircle } from "lucide-react";

import { getVerificationWorkspace } from "@/lib/backend";

import { CompanyVerificationWorkspace } from "./verification-workspace";

// 이 페이지의 검수 요청 Server Action이 격리 Sandbox 실행을 즉시 트리거한다.
// docs/VERIFICATION_RUNNER_CONTROL_PLANE.md의 Vercel Hobby 함수 실행 한도(300초)와 맞춘다.
export const maxDuration = 300;

export default async function VerificationPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ github?: string }>;
}) {
  const [{ projectId }, { github }] = await Promise.all([params, searchParams]);
  const result = await getVerificationWorkspace(projectId);

  if (!result.ok) {
    return (
      <div className="flex gap-3 rounded-card border border-app-border bg-app-surface p-5 text-sm text-app-foreground">
        <AlertCircle className="size-5 shrink-0 text-danger" />
        오류: {result.error.message}
      </div>
    );
  }

  if (!result.data.sowVersionId) {
    return (
      <div className="rounded-card border border-dashed border-app-border-strong bg-app-surface-subtle p-10 text-center">
        <p className="text-sm text-app-foreground">아직 승인된 업무 명세서가 없습니다.</p>
        <p className="mt-1.5 text-sm text-app-muted">
          발주자와 프리랜서가 같은 SOW 버전을 승인하면 저장소와 검수 제출을 연결할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      <CompanyVerificationWorkspace
        initialWorkspace={result.data}
        initialMessage={getGitHubSetupMessage(github)}
      />
    </div>
  );
}

function getGitHubSetupMessage(status: string | undefined): string | null {
  if (status === "installed") {
    return "GitHub App 설치가 끝났습니다. 아래에 설치 대상으로 선택한 저장소 URL을 입력해 연결을 완료해주세요.";
  }
  if (status === "install-error") {
    return "GitHub App 설치를 시작하지 못했습니다. App ID와 Private Key 서버 설정을 확인해주세요.";
  }
  if (status === "setup-error") {
    return "GitHub App 설치 완료 정보를 확인하지 못했습니다. 다시 설치해주세요.";
  }
  return null;
}
