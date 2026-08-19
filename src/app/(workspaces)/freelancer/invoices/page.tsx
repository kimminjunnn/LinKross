import { CircleAlert, FileText } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { listFreelancerInvoices } from "@/lib/backend";

export default async function FreelancerInvoicesPage() {
  const result = await listFreelancerInvoices();

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      <PageHeader
        eyebrow="Financial records"
        title="Invoices & payment evidence"
        description="Invoices are linked to approved milestones. Payment status is recorded after the client processes it through their external payment method."
      />

      {!result.ok ? (
        <div className="mt-8 flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-sm text-danger">
          <CircleAlert className="size-5 shrink-0" />{result.error.message}
        </div>
      ) : result.data.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-app-border-strong p-10 text-center">
          <FileText className="mx-auto size-8 text-app-muted" />
          <h2 className="mt-3 font-semibold text-app-foreground">No invoices submitted</h2>
          <p className="mt-1 text-sm text-app-muted">Open an approved project milestone to submit its invoice.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-card border border-app-border bg-app-surface shadow-card">
          <div className="divide-y divide-app-border">
            {result.data.map((invoice) => (
              <article key={invoice.id} className="p-5 sm:flex sm:items-center sm:justify-between sm:gap-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-app-muted">{invoice.invoiceNumber}</span>
                    <span className="rounded-full bg-app-surface-subtle px-2.5 py-1 text-xs text-app-muted">{invoice.status}</span>
                  </div>
                  <h2 className="mt-2 font-semibold text-app-foreground">{invoice.milestoneCode} · {invoice.milestoneTitle}</h2>
                  <p className="mt-1 text-sm text-app-muted">{invoice.organizationName} · {invoice.projectTitle}</p>
                  {invoice.reviewNote && <p className="mt-2 text-xs text-warning">Client note: {invoice.reviewNote}</p>}
                </div>
                <div className="mt-4 sm:mt-0 sm:text-right">
                  <p className="text-lg font-semibold text-app-foreground">{invoice.amount.toLocaleString()} {invoice.currency}</p>
                  <p className="mt-1 text-xs text-app-muted">Submitted {new Date(invoice.submittedAt).toLocaleDateString("en-US")}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
