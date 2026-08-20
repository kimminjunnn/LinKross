import Link from "next/link";
import { ChevronRight, CircleAlert, FileArchive, PartyPopper } from "lucide-react";

import { getProjectCommissionChargesByPayment, getProjectFinancialWorkspace } from "@/lib/backend";

import { GenerateEvidenceBundleButton } from "./bundle-actions";
import { CompanyFinancialWorkspace } from "./financial-workspace";
import { PaymentEvidencePanel } from "./payment-evidence-panel";
import { ProjectCompletionBanner } from "./project-completion-banner";

export default async function EvidencePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [result, commissionChargesResult] = await Promise.all([
    getProjectFinancialWorkspace(projectId),
    getProjectCommissionChargesByPayment(projectId),
  ]);

  if (!result.ok) {
    return <div className="flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-sm text-danger"><CircleAlert className="size-5 shrink-0" />{result.error.message}</div>;
  }
  const commissionChargesByPaymentId = commissionChargesResult.ok ? commissionChargesResult.data : {};
  const allMilestonesPaid = result.data.milestones.length > 0
    && result.data.milestones.every((milestone) => milestone.status === "approved" && milestone.payment?.status === "completed");

  return (
    <div className="space-y-5">
      {result.data.lifecycleStage === "completed" ? (
        <div className="flex items-center gap-2 rounded-card border border-accent-200 bg-accent-50 p-4 text-sm font-semibold text-accent-800">
          <PartyPopper className="size-5 shrink-0" />프로젝트가 완료 처리되었습니다.
        </div>
      ) : allMilestonesPaid && (
        <ProjectCompletionBanner projectId={projectId} />
      )}
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <CompanyFinancialWorkspace workspace={result.data} />
      <div className="space-y-5">
        <PaymentEvidencePanel projectId={projectId} milestones={result.data.milestones} commissionChargesByPaymentId={commissionChargesByPaymentId} />
        <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
          <div className="flex items-start gap-3">
            <FileArchive className="mt-0.5 size-5 text-brand-600" />
            <div className="w-full">
              <h2 className="font-semibold text-app-foreground">통합 증빙 번들</h2>
              <p className="mt-1 text-sm leading-6 text-app-muted">요구사항, 제안서, SOW 승인, 마일스톤 검수 결과, 인보이스와 지급 기록을 하나의 버전으로 묶어 보관합니다.</p>
              {result.data.evidenceBundles.length === 0 ? (
                <p className="mt-3 rounded-control border border-dashed border-app-border-strong p-3 text-sm text-app-muted">아직 생성된 번들이 없습니다.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {result.data.evidenceBundles.map((bundle) => (
                    <Link key={bundle.id} href={`/company/projects/${projectId}/evidence/bundles/${bundle.id}`} className="flex items-center justify-between rounded-control bg-app-surface-subtle p-3 text-sm hover:bg-app-surface">
                      <div>
                        <span>v{bundle.versionNumber} · {bundle.status}</span>
                        {bundle.sha256 && <p className="mt-1 break-all font-mono text-xs text-app-muted">SHA-256 {bundle.sha256}</p>}
                        {bundle.errorMessage && <p className="mt-1 text-xs text-danger">{bundle.errorMessage}</p>}
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-app-muted" />
                    </Link>
                  ))}
                </div>
              )}
              <GenerateEvidenceBundleButton projectId={projectId} />
            </div>
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}
