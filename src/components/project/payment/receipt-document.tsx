import { BrandLogo } from "@/components/layout/brand-logo";
import { BASE_SEPOLIA_EXPLORER_URL } from "@/config/testnet";

export function ReceiptDocument({
  projectTitle,
  milestoneCode,
  milestoneTitle,
  amountUsdc,
  toAddress,
  txHash,
  blockNumber,
  completedAt,
  paymentId,
}: {
  projectTitle: string;
  milestoneCode: string;
  milestoneTitle: string;
  amountUsdc: number;
  toAddress: string;
  txHash: string;
  blockNumber: number;
  completedAt: string;
  paymentId: string;
}) {
  const confirmedAt = new Date(completedAt).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
  const receiptNumber = `LK-${paymentId.slice(0, 8).toUpperCase()}`;

  return (
    <div className="mt-3 rounded-control border border-app-border-strong bg-app-surface p-5">
      <div className="flex items-start justify-between gap-4 border-b border-app-border pb-4">
        <BrandLogo />
        <div className="text-right">
          <p className="text-sm font-black text-app-foreground">지급 증빙</p>
          <p className="text-xs text-app-muted">Payment Receipt</p>
          <p className="mt-1 text-xs text-app-muted">No. {receiptNumber}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-b border-app-border pb-4 text-sm">
        <ReceiptRow label="프로젝트" value={projectTitle} />
        <ReceiptRow label="마일스톤" value={`${milestoneCode} · ${milestoneTitle}`} />
        <ReceiptRow label="지급 금액" value={`${amountUsdc.toLocaleString()} USDC`} />
        <ReceiptRow label="지급 수단" value="USDC · Base Sepolia 테스트넷" />
      </dl>

      <div className="mt-4">
        <p className="text-xs font-bold tracking-[0.1em] text-app-muted uppercase">온체인 검증 정보</p>
        <dl className="mt-3 grid gap-3 text-sm">
          <ReceiptRow label="수신 지갑" value={toAddress} mono />
          <ReceiptRow label="트랜잭션 해시" value={txHash} mono />
          <ReceiptRow label="블록 번호" value={String(blockNumber)} />
          <ReceiptRow label="확정 시각" value={confirmedAt} />
          <ReceiptRow label="원장 링크" value={`${BASE_SEPOLIA_EXPLORER_URL}/tx/${txHash}`} mono />
        </dl>
      </div>

      <p className="mt-5 border-t border-app-border pt-3 text-xs leading-5 text-app-muted">
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
