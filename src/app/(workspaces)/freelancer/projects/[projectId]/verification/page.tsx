import { CircleAlert } from "lucide-react";

import { getVerificationWorkspace } from "@/lib/backend";

import { FreelancerCodeSubmission } from "../code-submission";

// 이 페이지의 PR 제출 Server Action이 격리 Sandbox 실행을 즉시 트리거한다.
// docs/VERIFICATION_RUNNER_CONTROL_PLANE.md의 Vercel Hobby 함수 실행 한도(300초)와 맞춘다.
export const maxDuration = 300;

export default async function FreelancerProjectVerificationPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const result = await getVerificationWorkspace(projectId);

  if (!result.ok) {
    return (
      <div className="flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-danger">
        <CircleAlert aria-hidden="true" className="size-5 shrink-0" />
        <p className="text-sm font-bold">{result.error.message}</p>
      </div>
    );
  }

  if (!result.data.sowVersionId) {
    return (
      <div className="rounded-card border border-dashed border-app-border-strong bg-app-surface-subtle p-10 text-center">
        <p className="text-sm font-bold text-app-foreground">There is no approved SOW yet.</p>
        <p className="mt-1.5 text-sm text-app-muted">
          You can submit a PR and request verification after both parties approve the same SOW version.
        </p>
      </div>
    );
  }

  return <FreelancerCodeSubmission initialWorkspace={result.data} />;
}
