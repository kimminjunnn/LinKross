import { CircleAlert, FileArchive } from "lucide-react";

import { getProjectFinancialWorkspace, listFreelancerCommissionCharges } from "@/lib/backend";

import { FreelancerInvoicePanel } from "../invoice-panel";

export default async function FreelancerProjectEvidencePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [result, commissionChargesResult] = await Promise.all([
    getProjectFinancialWorkspace(projectId),
    listFreelancerCommissionCharges(),
  ]);

  if (!result.ok) {
    return (
      <div className="flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-danger">
        <CircleAlert aria-hidden="true" className="size-5 shrink-0" />
        <p className="text-sm">{result.error.message}</p>
      </div>
    );
  }

  const workspace = result.data;
  const hasApprovedMilestone = workspace.milestones.some(
    (milestone) => milestone.status === "approved",
  );
  const commissionChargesByPaymentId = Object.fromEntries(
    (commissionChargesResult.ok ? commissionChargesResult.data : []).map((charge) => [charge.paymentId, charge]),
  );

  return (
    <div className="space-y-6">
      {hasApprovedMilestone ? (
        <FreelancerInvoicePanel workspace={workspace} commissionChargesByPaymentId={commissionChargesByPaymentId} />
      ) : (
        <div className="rounded-card border border-dashed border-app-border-strong bg-app-surface-subtle p-10 text-center">
          <p className="text-sm text-app-foreground">No milestones are ready for payment yet.</p>
          <p className="mt-1.5 text-sm text-app-muted">
            You can submit an invoice after the client reviews the verification results and approves a milestone.
          </p>
        </div>
      )}

      <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-2">
          <FileArchive aria-hidden="true" className="size-5 text-brand-600" />
          <h2 className="text-xl font-semibold text-app-foreground">Evidence bundles</h2>
        </div>
        {workspace.evidenceBundles.length === 0 ? (
          <p className="mt-4 rounded-control border border-dashed border-app-border-strong p-4 text-sm text-app-muted">
            No evidence bundle has been generated yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {workspace.evidenceBundles.map((bundle) => (
              <article key={bundle.id} className="rounded-control border border-app-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-app-foreground">
                    Evidence bundle v{bundle.versionNumber}
                  </h3>
                  <span className="rounded-full bg-app-surface-subtle px-3 py-1 text-xs text-app-muted">
                    {bundle.status.replaceAll("_", " ")}
                  </span>
                </div>
                {bundle.sha256 ? (
                  <p className="mt-2 break-all font-mono text-xs text-app-muted">SHA-256 {bundle.sha256}</p>
                ) : null}
                {bundle.errorMessage ? (
                  <p className="mt-2 text-sm text-danger">{bundle.errorMessage}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
