"use client";

import { Sheet } from "lucide-react";

import { buildSimplifiedLedgerCsv, downloadSimplifiedLedgerCsv, type LedgerPerspective } from "@/lib/simplified-ledger";
import type { FinancialMilestoneRecord } from "@/lib/backend";

export function SimplifiedLedgerButton({
  milestones,
  counterparty,
  perspective,
  projectTitle,
}: {
  milestones: FinancialMilestoneRecord[];
  counterparty: string;
  perspective: LedgerPerspective;
  projectTitle: string;
}) {
  const hasApprovedInvoice = milestones.some((milestone) => milestone.invoice?.status === "approved");

  return (
    <button
      type="button"
      disabled={!hasApprovedInvoice}
      onClick={() => {
        const csv = buildSimplifiedLedgerCsv(milestones, counterparty, perspective);
        downloadSimplifiedLedgerCsv(csv, `간편장부_${projectTitle}.csv`);
      }}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-app-border-strong px-3 text-xs font-bold text-app-foreground disabled:cursor-not-allowed disabled:opacity-45"
      title={hasApprovedInvoice ? undefined : "승인된 인보이스가 있어야 내보낼 수 있습니다."}
    >
      <Sheet className="size-3.5" />
      간편장부용 CSV
    </button>
  );
}
