import { AlertCircle, TestTube2 } from "lucide-react";

import { getVerificationWorkspace } from "@/lib/backend";

import { CompanyVerificationWorkspace } from "./verification-workspace";

export default async function VerificationPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const result = await getVerificationWorkspace(projectId);

  if (!result.ok) {
    return (
      <div className="flex gap-3 rounded-card border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-800">
        <AlertCircle className="size-5 shrink-0" />
        {result.error.message}
      </div>
    );
  }

  if (!result.data.sowVersionId) {
    return (
      <div className="rounded-card border border-dashed border-app-border-strong bg-app-surface-subtle p-10 text-center">
        <p className="text-sm font-bold text-app-foreground">아직 승인된 업무 명세서가 없습니다.</p>
        <p className="mt-1.5 text-sm text-app-muted">
          발주자와 프리랜서가 같은 SOW 버전을 승인하면 저장소와 검수 제출을 연결할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      <CompanyVerificationWorkspace initialWorkspace={result.data} />
      <section className="rounded-card border border-accent-200 bg-accent-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-control bg-accent-100 text-accent-800">
            <TestTube2 className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-black text-accent-900">검수 결과와 최종 승인은 분리됩니다.</h2>
            <p className="mt-1 text-sm leading-6 text-accent-800">
              실행 결과와 증거를 확인한 뒤 발주자가 직접 승인하거나 수정 요청합니다. Runner가 연결되기 전에는
              요청만 대기열에 저장되며 통과 결과를 임의로 만들지 않습니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
