"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";

import { markCommissionChargePaidAction } from "@/app/actions/commission";
import type { CommissionChargeRecord } from "@/lib/backend";

const STATUS_LABEL: Record<CommissionChargeRecord["status"], string> = {
  pending: "Unpaid",
  paid: "Paid",
  waived: "Waived",
};

export function CommissionChargeRow({ charge }: { charge: CommissionChargeRecord }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isOverdue = charge.status === "pending" && new Date(charge.dueAt).getTime() < new Date().getTime();

  return (
    <article className="p-5 sm:flex sm:items-start sm:justify-between sm:gap-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              charge.status === "pending"
                ? "bg-danger/10 text-danger"
                : "bg-app-surface-subtle text-app-muted"
            }`}
          >
            {STATUS_LABEL[charge.status]}
          </span>
          {isOverdue ? <span className="text-xs text-danger">Overdue since {new Date(charge.dueAt).toLocaleDateString("en-US")}</span> : null}
        </div>
        <h2 className="mt-2 font-semibold text-app-foreground">{charge.milestoneTitle}</h2>
        <p className="mt-1 text-sm text-app-muted">{charge.projectTitle}</p>
        <p className="mt-2 text-xs text-app-muted">
          Commission (supply value) {charge.commissionAmount.toLocaleString()} {charge.currency} ({(charge.commissionRate * 100).toFixed(0)}% of {charge.baseAmount.toLocaleString()} {charge.currency})
          {" · "}VAT (10%) {charge.vatAmount.toLocaleString()} {charge.currency}
        </p>
        <p className="mt-1 text-xs font-semibold text-app-foreground">
          Total due: {(charge.commissionAmount + charge.vatAmount).toLocaleString()} {charge.currency}
        </p>
        {charge.paidReference ? <p className="mt-1 text-xs text-app-muted">Reference: {charge.paidReference}</p> : null}
      </div>

      <div className="mt-4 sm:mt-0 sm:w-64 sm:shrink-0">
        {charge.status === "pending" ? (
          <form
            action={(formData) => startTransition(async () => {
              const result = await markCommissionChargePaidAction({
                chargeId: charge.id,
                paidReference: String(formData.get("paidReference") ?? ""),
              });
              setMessage(result.ok ? "Reported as paid." : result.error.message);
            })}
            className="flex flex-col gap-2"
          >
            <input
              name="paidReference"
              required
              disabled={pending}
              placeholder="Transfer memo or receipt number"
              className="min-h-9 w-full rounded-control border border-app-border-strong px-3 text-xs disabled:opacity-50"
            />
            <button
              disabled={pending}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-control bg-brand-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Report as paid
            </button>
            {message ? <p className="text-xs text-app-muted">{message}</p> : null}
          </form>
        ) : (
          <p className="text-xs text-app-muted sm:text-right">
            {charge.status === "paid" && charge.paidAt ? `Paid ${new Date(charge.paidAt).toLocaleDateString("en-US")}` : null}
          </p>
        )}
      </div>
    </article>
  );
}
