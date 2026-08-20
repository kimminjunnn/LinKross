import { CommissionPaymentForm } from "@/components/project/payment/commission-payment-form";
import type { CommissionChargeRecord } from "@/lib/backend";

const STATUS_LABEL: Record<CommissionChargeRecord["status"], string> = {
  pending: "Unpaid",
  paid: "Paid",
  waived: "Waived",
};

export function CommissionChargeRow({ charge }: { charge: CommissionChargeRecord }) {
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

      <div className="mt-4 sm:mt-0 sm:w-72 sm:shrink-0">
        <CommissionPaymentForm charge={charge} />
      </div>
    </article>
  );
}
