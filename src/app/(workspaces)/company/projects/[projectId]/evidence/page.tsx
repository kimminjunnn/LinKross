import { CircleAlert, FileArchive } from "lucide-react";

import { getProjectFinancialWorkspace } from "@/lib/backend";

import { CompanyFinancialWorkspace } from "./financial-workspace";

export default async function EvidencePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const result = await getProjectFinancialWorkspace(projectId);

  if (!result.ok) {
    return <div className="flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-sm font-bold text-danger"><CircleAlert className="size-5 shrink-0" />{result.error.message}</div>;
  }

  return (
    <div className="space-y-5">
      <CompanyFinancialWorkspace workspace={result.data} />
      <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
        <div className="flex items-start gap-3">
          <FileArchive className="mt-0.5 size-5 text-brand-600" />
          <div>
            <h2 className="font-black text-app-foreground">통합 증빙 번들</h2>
            {result.data.evidenceBundles.length === 0 ? (
              <p className="mt-1 text-sm leading-6 text-app-muted">아직 생성된 번들이 없습니다. PDF/파일 생성 Worker와 비공개 Storage 연결 후 다운로드를 제공할 수 있습니다.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {result.data.evidenceBundles.map((bundle) => (
                  <div key={bundle.id} className="rounded-control bg-app-surface-subtle p-3 text-sm">
                    <span className="font-black">v{bundle.versionNumber} · {bundle.status}</span>
                    {bundle.sha256 && <p className="mt-1 break-all font-mono text-xs text-app-muted">SHA-256 {bundle.sha256}</p>}
                    {bundle.errorMessage && <p className="mt-1 text-xs font-bold text-danger">{bundle.errorMessage}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
