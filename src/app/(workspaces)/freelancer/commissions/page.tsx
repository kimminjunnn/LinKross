import { CircleAlert, Receipt } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { listFreelancerCommissionCharges } from "@/lib/backend";

import { CommissionChargeRow } from "./commission-charge-row";

export default async function FreelancerCommissionsPage() {
  const result = await listFreelancerCommissionCharges();

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      <PageHeader
        title="Platform commission"
        description="LinKross charges a 7% platform commission on each completed milestone payment. Pay it via your own means, then report it here."
      />

      {!result.ok ? (
        <div className="mt-8 flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-sm text-danger">
          <CircleAlert className="size-5 shrink-0" />{result.error.message}
        </div>
      ) : result.data.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-app-border-strong p-10 text-center">
          <Receipt className="mx-auto size-8 text-app-muted" />
          <h2 className="mt-3 font-semibold text-app-foreground">No commission charges yet</h2>
          <p className="mt-1 text-sm text-app-muted">A charge is created automatically when a milestone payment is completed.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-card border border-app-border bg-app-surface shadow-card">
          <div className="divide-y divide-app-border">
            {result.data.map((charge) => (
              <CommissionChargeRow key={charge.id} charge={charge} />
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 text-xs leading-5 text-app-muted">
        This report is entered by the freelancer. LinKross does not automatically verify the actual bank transfer.
        VAT shown here is an illustrative estimate (LinKross has not registered as a taxable business yet) and is not an official tax invoice.
      </p>
    </div>
  );
}
