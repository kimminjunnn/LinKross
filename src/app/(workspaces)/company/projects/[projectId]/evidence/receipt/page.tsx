import Link from "next/link";
import { CircleAlert } from "lucide-react";

import { ReceiptDocument } from "@/components/project/payment/receipt-document";
import { ReceiptPrintButton } from "@/components/project/payment/receipt-print-button";
import { getProjectCommissionChargesByPayment, getProjectFinancialWorkspace } from "@/lib/backend";

export default async function AllPaymentReceiptsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [result, commissionResult] = await Promise.all([
    getProjectFinancialWorkspace(projectId),
    getProjectCommissionChargesByPayment(projectId),
  ]);

  if (!result.ok) {
    return <div className="flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-sm font-bold text-danger"><CircleAlert className="size-5 shrink-0" />{result.error.message}</div>;
  }
  const commissionByPaymentId = commissionResult.ok ? commissionResult.data : {};

  const verifiedEntries = result.data.milestones.filter(
    (milestone): milestone is typeof milestone & {
      payment: NonNullable<typeof milestone.payment> & { toAddress: string; externalReference: string; blockNumber: number; completedAt: string };
    } =>
      milestone.payment?.method === "wallet_testnet" &&
      milestone.payment.status === "completed" &&
      milestone.payment.toAddress !== null &&
      milestone.payment.externalReference !== null &&
      milestone.payment.blockNumber !== null &&
      milestone.payment.completedAt !== null,
  );

  if (verifiedEntries.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm font-bold text-app-foreground">아직 온체인으로 검증된 지급 기록이 없습니다.</p>
        <p className="mt-2 text-sm text-app-muted">지갑 송금 검증이 완료된 이후에 영수증을 발급할 수 있습니다.</p>
        <Link href={`/company/projects/${projectId}/evidence`} className="mt-4 inline-block text-sm font-bold text-brand-700 hover:underline">
          증빙 화면으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/company/projects/${projectId}/evidence`} className="text-sm font-bold text-app-muted hover:text-app-foreground">
          ← 증빙 화면으로
        </Link>
        <ReceiptPrintButton />
      </div>

      <div className="space-y-8">
        {verifiedEntries.map((milestone, index) => (
          <div key={milestone.id} className={index < verifiedEntries.length - 1 ? "break-after-page" : undefined}>
            <ReceiptDocument
              projectTitle={result.data.projectTitle}
              milestoneCode={milestone.code}
              milestoneTitle={milestone.title}
              amountUsdc={milestone.payment.amount}
              toAddress={milestone.payment.toAddress}
              txHash={milestone.payment.externalReference}
              blockNumber={milestone.payment.blockNumber}
              completedAt={milestone.payment.completedAt}
              paymentId={milestone.payment.id}
              platformCommission={commissionByPaymentId[milestone.payment.id] ?? null}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
