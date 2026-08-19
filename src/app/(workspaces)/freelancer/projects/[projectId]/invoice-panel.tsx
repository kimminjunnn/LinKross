"use client";

import { useState, useTransition } from "react";
import { Banknote, FileText, Loader2 } from "lucide-react";

import { submitInvoiceAction } from "@/app/actions/finance";
import { SimplifiedLedgerButton } from "@/components/project/payment/simplified-ledger-button";
import { paymentStatusLabel } from "@/config/payment-status";
import type { ProjectFinancialWorkspace } from "@/lib/backend";

export function FreelancerInvoicePanel({ workspace }: { workspace: ProjectFinancialWorkspace }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const available = workspace.milestones.filter((milestone) => milestone.status === "approved");

  if (available.length === 0) return null;

  return (
    <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2"><FileText className="size-5 text-brand-600" /><h2 className="text-lg font-black text-app-foreground">Milestone invoices</h2></div>
        <SimplifiedLedgerButton milestones={workspace.milestones} counterparty={workspace.projectTitle} perspective="income" projectTitle={workspace.projectTitle} />
      </div>
      <p className="mt-1 text-sm text-app-muted">The agreed SOW amount and currency are copied from the approved milestone on the server. Invoices here are progress-confirmation records, not a formal tax invoice — issue that separately through your own accounting tools.</p>
      {message && <p className="mt-4 rounded-control bg-app-surface-subtle p-3 text-sm font-bold text-app-muted">{message}</p>}
      <div className="mt-5 space-y-3">
        {available.map((milestone) => (
          <article key={milestone.id} className="rounded-control border border-app-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><h3 className="font-black text-app-foreground">{milestone.code} · {milestone.title}</h3><p className="mt-1 text-sm text-app-muted">{milestone.amount.toLocaleString()} {milestone.currency}</p></div>
              {milestone.invoice && <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">{milestone.invoice.status}</span>}
            </div>
            {milestone.invoice?.status === "rejected" && (
              <p className="mt-3 rounded-control bg-danger/10 p-3 text-sm text-danger">
                Rejected{milestone.invoice.reviewNote ? `: ${milestone.invoice.reviewNote}` : ""} — fix the issue and submit a new invoice number below.
              </p>
            )}
            {(!milestone.invoice || milestone.invoice.status === "rejected") && (
              <form action={(formData) => startTransition(async () => {
                const vatAmount = Number(formData.get("vatAmount") ?? 0);
                const result = await submitInvoiceAction({ projectId: workspace.projectId, milestoneId: milestone.id, invoiceNumber: String(formData.get("invoiceNumber") ?? ""), externalReference: String(formData.get("externalReference") ?? ""), vatAmount: Number.isFinite(vatAmount) ? vatAmount : 0 });
                setMessage(result.ok ? "Invoice submitted for client review." : result.error.message);
              })} className="mt-4 grid gap-2 sm:grid-cols-2">
                <input name="invoiceNumber" required placeholder="Invoice number" className="min-h-10 rounded-control border border-app-border-strong px-3 text-sm" />
                <input name="externalReference" placeholder="External reference (optional)" className="min-h-10 rounded-control border border-app-border-strong px-3 text-sm" />
                <input name="vatAmount" type="number" min="0" step="0.01" placeholder="VAT amount (optional, 0 if none)" className="min-h-10 rounded-control border border-app-border-strong px-3 text-sm" />
                <button disabled={pending} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-brand-600 px-4 text-sm font-black text-white disabled:opacity-50">{pending && <Loader2 className="size-4 animate-spin" />}Submit</button>
              </form>
            )}
            {milestone.invoice && milestone.invoice.vatAmount > 0 && (
              <p className="mt-2 text-xs text-app-muted">공급가액 {milestone.invoice.amount.toLocaleString()} {milestone.invoice.currency} · 부가세 {milestone.invoice.vatAmount.toLocaleString()} {milestone.invoice.currency}</p>
            )}
            {milestone.payment && (
              <div className="mt-3 flex items-center justify-between rounded-control bg-app-surface-subtle p-3 text-sm">
                <span className="inline-flex items-center gap-2 font-bold text-app-muted"><Banknote className="size-4" />Payment status</span>
                <span className="font-black text-app-foreground">{paymentStatusLabel[milestone.payment.status]} · {milestone.payment.amount.toLocaleString()} {milestone.payment.currency}</span>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
