import { CheckCircle2, Clock3, FileArchive, FileText, ReceiptText } from "lucide-react";

import { StatusBadge } from "@/components/project/status-badge";
import { WalletTransferPanel } from "@/components/project/payment/wallet-transfer-panel";
import { DEMO_FREELANCER_ADDRESS } from "@/config/testnet";

const evidenceItems = [
  { icon: FileText, title: "승인된 업무 명세서", description: "양측 승인 · v1.2", ready: true },
  { icon: CheckCircle2, title: "검수 결과", description: "Commit SHA 및 테스트 로그", ready: true },
  { icon: ReceiptText, title: "인보이스와 지급 기록", description: "M1 지급 대기", ready: false },
];

export default function EvidencePage() {
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
            <WalletTransferPanel freelancerAddress={DEMO_FREELANCER_ADDRESS} amountUsdc="1" />
          </article>
          <article className="rounded-control border border-app-border bg-app-surface-subtle p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black text-app-foreground">M2 · 핵심 기능</h3>
                <StatusBadge tone="accent">검수 중</StatusBadge>
              </div>
              <p className="mt-2 text-sm text-app-muted">검수 완료 후 승인할 수 있습니다.</p>
            </div>
            <button type="button" disabled className="mt-4 min-h-10 rounded-control border border-app-border bg-app-surface px-4 text-sm font-bold text-app-muted opacity-60 sm:mt-0">승인 대기중</button>
          </article>
        </div>
      </section>

      <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-brand-50 text-brand-700"><FileArchive className="size-5" /></span>
          <div>
            <h2 className="text-lg font-black text-app-foreground">통합 증빙</h2>
            <p className="mt-1 text-xs text-app-muted">프로젝트별 단일 증빙 묶음</p>
          </div>
        </div>

        <ul className="mt-5 space-y-3">
          {evidenceItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className="flex gap-3 rounded-control border border-app-border p-3">
                <Icon className={`mt-0.5 size-4 shrink-0 ${item.ready ? "text-success" : "text-app-muted"}`} />
                <div>
                  <p className="text-sm font-bold text-app-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-app-muted">{item.description}</p>
                </div>
                {item.ready ? <CheckCircle2 className="ml-auto size-4 shrink-0 text-success" /> : <Clock3 className="ml-auto size-4 shrink-0 text-warning" />}
              </li>
            );
          })}
        </ul>

        <button type="button" disabled className="mt-5 min-h-11 w-full rounded-control bg-app-foreground px-4 text-sm font-bold text-white opacity-45">통합 증빙 PDF 생성</button>
        <p className="mt-2 text-center text-xs text-app-muted">모든 지급 기록이 완료되면 활성화됩니다.</p>
      </section>
    </div>
  );
}
