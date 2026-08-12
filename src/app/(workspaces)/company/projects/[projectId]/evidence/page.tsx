import Link from "next/link";
import { Clock3, Download, ExternalLink, FileArchive, FileText, ReceiptText } from "lucide-react";

import { StatusBadge } from "@/components/project/status-badge";
import { WalletTransferPanel } from "@/components/project/payment/wallet-transfer-panel";
import { BASE_SEPOLIA_EXPLORER_URL } from "@/config/testnet";
import { getMilestonePayment, listMilestoneIds, type MilestonePayment } from "@/lib/milestones";
import { getVerifiedPayment, type VerifiedPayment } from "@/lib/payments";

export default async function EvidencePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const milestoneIds = listMilestoneIds();
  const paymentEntries = await Promise.all(
    milestoneIds.map(async (milestoneId) => ({
      milestoneId,
      milestone: getMilestonePayment(milestoneId)!,
      payment: await getVerifiedPayment(milestoneId),
    })),
  );

  const m1Payment = paymentEntries.find((entry) => entry.milestoneId === "M1")?.payment;
  const m2Payment = paymentEntries.find((entry) => entry.milestoneId === "M2")?.payment;
  const hasAnyPayment = paymentEntries.some((entry) => entry.payment);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
        <p className="text-xs font-bold tracking-[0.1em] text-brand-700 uppercase">Human approval required</p>
        <h2 className="mt-2 text-xl font-black text-app-foreground">승인 및 지급 상태</h2>
        <p className="mt-2 text-sm leading-6 text-app-muted">자동 검증 결과는 판단 근거이며, 최종 승인과 지급 결정은 발주자가 수행합니다.</p>

        <div className="mt-6 space-y-3">
          <article className="rounded-control border border-app-border bg-app-surface-subtle p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black text-app-foreground">M1 · 초기 시스템 구현</h3>
                <StatusBadge tone="success">검수 완료</StatusBadge>
              </div>
              <p className="mt-2 text-sm text-app-muted">승인 금액 1,000 USDC · 인보이스 확인 완료</p>
            </div>
            <WalletTransferPanel
              milestoneId="M1"
              initialPayment={m1Payment ? { txHash: m1Payment.txHash, amountUsdc: m1Payment.amountUsdc } : null}
            />
          </article>
          <article className="rounded-control border border-app-border bg-app-surface-subtle p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black text-app-foreground">M2 · 핵심 기능</h3>
                <StatusBadge tone="success">검수 완료</StatusBadge>
              </div>
              <p className="mt-2 text-sm text-app-muted">승인 금액 1,200 USDC · 인보이스 확인 완료</p>
            </div>
            <WalletTransferPanel
              milestoneId="M2"
              initialPayment={m2Payment ? { txHash: m2Payment.txHash, amountUsdc: m2Payment.amountUsdc } : null}
            />
          </article>
        </div>
      </section>

      <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-brand-50 text-brand-700"><FileArchive className="size-5" /></span>
          <div>
            <h2 className="text-lg font-black text-app-foreground">지급 증빙</h2>
            <p className="mt-1 text-xs text-app-muted">마일스톤별 지급 명세서</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {paymentEntries.map((entry) => (
            <PaymentEvidenceCard key={entry.milestoneId} projectId={projectId} {...entry} />
          ))}
        </div>

        {hasAnyPayment ? (
          <Link
            href={`/company/projects/${projectId}/evidence/receipt`}
            target="_blank"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600"
          >
            <Download className="size-4" />
            지급 증빙 전체 PDF 다운로드
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="mt-5 inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-control border border-app-border bg-app-surface px-4 text-sm font-bold text-app-muted opacity-60"
          >
            <Download className="size-4" />
            지급 증빙 전체 PDF 다운로드
          </button>
        )}
      </section>
    </div>
  );
}

function PaymentEvidenceCard({
  projectId,
  milestoneId,
  milestone,
  payment,
}: {
  projectId: string;
  milestoneId: string;
  milestone: MilestonePayment;
  payment: VerifiedPayment | null;
}) {
  if (!payment) {
    return (
      <div className="flex gap-3 rounded-control border border-app-border p-3">
        <ReceiptText className="mt-0.5 size-4 shrink-0 text-app-muted" />
        <div>
          <p className="text-sm font-bold text-app-foreground">지급 명세서</p>
          <p className="mt-1 text-xs text-app-muted">{milestoneId} 지급 대기</p>
        </div>
        <Clock3 className="ml-auto size-4 shrink-0 text-warning" />
      </div>
    );
  }

  const matchesAgreedAmount = Number(payment.amountUsdc) >= Number(milestone.amountUsdc);

  return (
    <article className="rounded-control border border-app-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-app-foreground">{milestoneId} 지급 명세서</p>
        <StatusBadge tone="success">지급 완료</StatusBadge>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
        <EvidenceField label="합의 금액" value={`${milestone.amountUsdc} USDC`} />
        <EvidenceField label="실제 전송 금액" value={`${payment.amountUsdc} USDC`} />
        <EvidenceField label="대조 결과" value={matchesAgreedAmount ? "일치" : "⚠️ 차액 발생"} />
        <EvidenceField
          label="확정 시각"
          value={new Date(payment.verifiedAt).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })}
        />
        <div className="col-span-2">
          <dt className="text-xs font-bold text-app-muted">트랜잭션 해시</dt>
          <dd className="mt-1 break-all font-mono text-xs text-app-foreground">{payment.txHash}</dd>
        </div>
      </dl>

      <div className="mt-2 flex items-center gap-3">
        <a
          href={`${BASE_SEPOLIA_EXPLORER_URL}/tx/${payment.txHash}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline"
        >
          Basescan에서 보기
          <ExternalLink className="size-3.5" />
        </a>
        <Link
          href={`/company/projects/${projectId}/evidence/${milestoneId}/receipt`}
          target="_blank"
          className="inline-flex items-center gap-1 text-xs font-bold text-app-foreground hover:underline"
        >
          <FileText className="size-3.5" />
          영수증 보기
        </Link>
      </div>
    </article>
  );
}

function EvidenceField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold text-app-muted">{label}</dt>
      <dd className="mt-1 break-all text-xs text-app-foreground">{value}</dd>
    </div>
  );
}
