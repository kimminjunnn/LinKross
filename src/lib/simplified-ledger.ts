import type { PaymentMethod } from "@/lib/backend/contracts";
import type { FinancialMilestoneRecord } from "@/lib/backend";

export type LedgerPerspective = "income" | "expense";

const LEDGER_HEADERS = [
  "일자",
  "계정과목",
  "거래내용",
  "거래처",
  "수입(금액)",
  "수입(부가세)",
  "비용(금액)",
  "비용(부가세)",
  "고정자산증감(매매)(금액)",
  "고정자산증감(매매)(부가세)",
  "비고",
] as const;

const EVIDENCE_TYPE_LABEL: Record<PaymentMethod, string> = {
  wallet_testnet: "기타(온체인 송금내역)",
  bank_transfer: "계좌이체 영수증",
  card: "신용카드매출전표",
  other: "기타",
};

/**
 * 소득세법 시행규칙 별지 제82호서식(간편장부) 컬럼 구성(일자/계정과목/거래내용/거래처/수입·비용·고정자산증감 금액·부가세/비고-증빙종류)에 맞춘 CSV를 만든다.
 * LinKross는 사업용 유형·무형자산 매입을 다루지 않으므로 고정자산증감 칸은 항상 비워 서식만 맞춘다.
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
      const note = milestone.payment ? EVIDENCE_TYPE_LABEL[milestone.payment.method] : "지급 전";
      const income = perspective === "income" ? [invoice.amount, invoice.vatAmount] : ["", ""];
      const expense = perspective === "expense" ? [invoice.amount, invoice.vatAmount] : ["", ""];
      return [
        date ? new Date(date).toLocaleDateString("ko-KR") : "-",
        perspective === "income" ? "용역수입" : "지급수수료",
        description,
        counterparty,
        ...income,
        ...expense,
        "",
        "",
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
