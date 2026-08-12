import { BrandLogo } from "@/components/layout/brand-logo";
import { BASE_SEPOLIA_EXPLORER_URL } from "@/config/testnet";
import type { MilestonePayment } from "@/lib/milestones";
import type { VerifiedPayment } from "@/lib/payments";

export function ReceiptDocument({
  projectName,
  assignee,
  milestoneId,
  milestone,
  payment,
  recipientEmail,
  issuedAt,
}: {
  projectName: string;
  assignee: string;
  milestoneId: string;
  milestone: MilestonePayment;
  payment: VerifiedPayment;
  recipientEmail: string;
  issuedAt: string;
}) {
  const matchesAgreedAmount = Number(payment.amountUsdc) >= Number(milestone.amountUsdc);
  const confirmedAt = new Date(payment.verifiedAt).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
  const receiptNumber = `LK-${payment.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="rounded-card border border-app-border-strong bg-app-surface p-8 shadow-card">
      <div className="flex items-start justify-between gap-4 border-b border-app-border pb-6">
        <BrandLogo />
        <div className="text-right">
          <p className="text-lg font-black text-app-foreground">지급 증빙</p>
          <p className="text-xs text-app-muted">Payment Receipt</p>
          <p className="mt-1 text-xs text-app-muted">No. {receiptNumber}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-bold text-app-foreground">박피오 귀하</p>
        <p className="mt-0.5 text-xs text-app-muted">{recipientEmail}</p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-b border-app-border pb-6 text-sm">
        <ReceiptRow label="프로젝트" value={projectName} />
        <ReceiptRow label="담당 개발자" value={assignee} />
        <ReceiptRow label="마일스톤" value={milestoneId} />
        <ReceiptRow label="발급 시각" value={issuedAt} />
      </dl>

      <div className="mt-6">
        <p className="text-xs font-bold tracking-[0.1em] text-app-muted uppercase">지급 내역</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <ReceiptRow label="합의 금액" value={`${milestone.amountUsdc} USDC`} />
          <ReceiptRow label="실제 전송 금액" value={`${payment.amountUsdc} USDC`} />
          <ReceiptRow label="대조 결과" value={matchesAgreedAmount ? "일치 (온체인 검증됨)" : "⚠️ 차액 발생"} />
          <ReceiptRow label="지급 수단" value="USDC · Base Sepolia 테스트넷" />
        </dl>
      </div>

      <div className="mt-6">
        <p className="text-xs font-bold tracking-[0.1em] text-app-muted uppercase">온체인 검증 정보</p>
        <dl className="mt-3 grid gap-3 text-sm">
          <ReceiptRow label="수신 지갑" value={payment.toAddress} mono />
          <ReceiptRow label="트랜잭션 해시" value={payment.txHash} mono />
          <ReceiptRow label="블록 번호" value={String(payment.blockNumber)} />
          <ReceiptRow label="확정 시각" value={confirmedAt} />
          <ReceiptRow label="원장 링크" value={`${BASE_SEPOLIA_EXPLORER_URL}/tx/${payment.txHash}`} mono />
        </dl>
      </div>

      <p className="mt-8 border-t border-app-border pt-4 text-xs leading-5 text-app-muted">
        본 문서는 LinKross가 공개 원장에서 직접 조회·검증한 지급 정보를 기록한 프로젝트 진행 확인 자료입니다.
        LinKross는 자금을 보관하지 않으며, 실제 송금은 발주자의 지갑에서 직접 실행됩니다. 이 문서는 법률·세무 판단이나
        정식 전자계약을 대체하지 않습니다.
      </p>
    </div>
  );
}

function ReceiptRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-bold text-app-muted">{label}</dt>
      <dd className={`break-all text-app-foreground ${mono ? "font-mono text-xs" : "text-sm font-bold"}`}>{value}</dd>
    </div>
  );
}
