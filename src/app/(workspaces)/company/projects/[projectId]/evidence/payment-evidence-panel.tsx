"use client";

import { useState } from "react";
import { Clock3, ExternalLink, FileArchive, FileText, ReceiptText } from "lucide-react";

import { ReceiptDocument } from "@/components/project/payment/receipt-document";
import { StatusBadge } from "@/components/project/status-badge";
import { BASE_SEPOLIA_EXPLORER_URL } from "@/config/testnet";
import { paymentMethodLabel } from "@/config/payment-method";
import type { FinancialMilestoneRecord } from "@/lib/backend";

export function PaymentEvidencePanel({ milestones }: { milestones: FinancialMilestoneRecord[] }) {
  return (
    <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-control bg-brand-50 text-brand-700"><FileArchive className="size-5" /></span>
        <div>
          <h2 className="text-lg font-black text-app-foreground">지급 증빙</h2>
          <p className="mt-1 text-xs text-app-muted">마일스톤별 지급 명세서</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {milestones.length === 0 ? (
          <p className="rounded-control border border-dashed border-app-border-strong p-3 text-sm text-app-muted">마일스톤이 아직 없습니다.</p>
        ) : (
          milestones.map((milestone) => <PaymentEvidenceCard key={milestone.id} milestone={milestone} />)
        )}
      </div>
    </section>
  );
}

function PaymentEvidenceCard({ milestone }: { milestone: FinancialMilestoneRecord }) {
  const [showReceipt, setShowReceipt] = useState(false);
  const payment = milestone.payment;

  if (!payment || payment.status !== "completed") {
    return (
      <div className="flex gap-3 rounded-control border border-app-border p-3">
        <ReceiptText className="mt-0.5 size-4 shrink-0 text-app-muted" />
        <div>
          <p className="text-sm font-bold text-app-foreground">지급 명세서</p>
          <p className="mt-1 text-xs text-app-muted">{milestone.code} {payment ? paymentStatusText(payment.status) : "지급 대기"}</p>
        </div>
        <Clock3 className="ml-auto size-4 shrink-0 text-warning" />
      </div>
    );
  }

  const matchesAgreedAmount = payment.amount >= milestone.amount;

  return (
    <article className="rounded-control border border-app-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-app-foreground">{milestone.code} 지급 명세서</p>
        <StatusBadge tone="success">지급 완료</StatusBadge>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
        <EvidenceField label="합의 금액" value={`${milestone.amount.toLocaleString()} ${milestone.currency}`} />
        <EvidenceField label="실제 지급 금액" value={`${payment.amount.toLocaleString()} ${payment.currency}`} />
        <EvidenceField label="대조 결과" value={matchesAgreedAmount ? "일치" : "⚠️ 차액 발생"} />
        <EvidenceField label="지급 수단" value={paymentMethodLabel[payment.method]} />
        {payment.completedAt && (
          <EvidenceField
            label="확정 시각"
            value={new Date(payment.completedAt).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })}
          />
        )}
        {payment.externalReference && (
          <div className="col-span-2">
            <dt className="text-xs font-bold text-app-muted">{payment.method === "wallet_testnet" ? "트랜잭션 해시" : "참조값"}</dt>
            <dd className="mt-1 break-all font-mono text-xs text-app-foreground">{payment.externalReference}</dd>
          </div>
        )}
      </dl>

      {payment.method === "wallet_testnet" && payment.externalReference && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <a
            href={`${BASE_SEPOLIA_EXPLORER_URL}/tx/${payment.externalReference}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline"
          >
            Basescan에서 보기
            <ExternalLink className="size-3.5" />
          </a>
          {payment.toAddress && payment.blockNumber && payment.completedAt && (
            <button
              type="button"
              onClick={() => setShowReceipt((value) => !value)}
              className="inline-flex items-center gap-1 text-xs font-bold text-app-foreground hover:underline"
            >
              <FileText className="size-3.5" />
              {showReceipt ? "영수증 닫기" : "영수증 보기"}
            </button>
          )}
        </div>
      )}

      {showReceipt && payment.toAddress && payment.externalReference && payment.blockNumber && payment.completedAt && (
        <ReceiptDocument
          projectTitle={milestone.title}
          milestoneCode={milestone.code}
          milestoneTitle={milestone.title}
          amountUsdc={payment.amount}
          toAddress={payment.toAddress}
          txHash={payment.externalReference}
          blockNumber={payment.blockNumber}
          completedAt={payment.completedAt}
          paymentId={payment.id}
        />
      )}
    </article>
  );
}

function paymentStatusText(status: string) {
  if (status === "requested") return "지급 요청됨";
  if (status === "processing") return "지급 처리 중";
  if (status === "failed") return "지급 실패";
  return "지급 대기";
}

function EvidenceField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold text-app-muted">{label}</dt>
      <dd className="mt-1 break-all text-xs text-app-foreground">{value}</dd>
    </div>
  );
}
