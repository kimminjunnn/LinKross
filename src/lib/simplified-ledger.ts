import { paymentMethodLabel } from "@/config/payment-method";
import { paymentStatusLabel } from "@/config/payment-status";
import type { FinancialMilestoneRecord } from "@/lib/backend";

export type LedgerPerspective = "income" | "expense";

const LEDGER_HEADERS = ["일자", "계정과목", "거래내용", "거래처", "수입(금액)", "수입(부가세)", "비용(금액)", "비용(부가세)", "비고"] as const;

/**
 * 소득세법 시행규칙 별지 간편장부 서식(일자/계정과목/거래내용/거래처/수입·비용 금액·부가세/비고) 컬럼에 맞춘 CSV를 만든다.
 * 실제 신고 반영 여부는 사용자 책임이며, 이 데이터는 참고용 초안이다.
 */
export function buildSimplifiedLedgerCsv(
  milestones: FinancialMilestoneRecord[],
  counterparty: string,
  perspective: LedgerPerspective,
): string {
  const rows = milestones
    .filter((milestone) => milestone.invoice?.status === "approved")
    .map((milestone) => {
      const invoice = milestone.invoice!;
      const date = milestone.payment?.completedAt ?? invoice.reviewedAt ?? invoice.submittedAt;
      const description = `${milestone.code} ${milestone.title}`;
      const note = milestone.payment
        ? `지급수단 ${paymentMethodLabel[milestone.payment.method]} · ${paymentStatusLabel[milestone.payment.status]}`
        : "지급 전";
      const income = perspective === "income" ? [invoice.amount, invoice.vatAmount] : ["", ""];
      const expense = perspective === "expense" ? [invoice.amount, invoice.vatAmount] : ["", ""];
      return [
        date ? new Date(date).toLocaleDateString("ko-KR") : "-",
        perspective === "income" ? "용역수입" : "지급수수료",
        description,
        counterparty,
        ...income,
        ...expense,
        note,
      ];
    });

  const lines = [LEDGER_HEADERS, ...rows].map((row) =>
    row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
  );
  // Excel이 UTF-8을 한글 깨짐 없이 인식하도록 BOM을 붙인다.
  return `﻿${lines.join("\r\n")}`;
}

export function downloadSimplifiedLedgerCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
