import Link from "next/link";
import { CheckCircle2, Circle, ExternalLink, GitCommitHorizontal, HandCoins } from "lucide-react";

import { StatusBadge } from "@/components/project/status-badge";

const milestones = [
  {
    code: "M1",
    title: "초기 시스템 구현",
    period: "08.10 – 08.20",
    amount: "1,000 USDC",
    verification: "검수 완료",
    verificationTone: "success" as const,
    payment: "지급 대기",
    paymentTone: "warning" as const,
    commit: "a84f0c2",
    canPay: true,
  },
  {
    code: "M2",
    title: "핵심 기능 · 결과물",
    period: "08.21 – 09.01",
    amount: "1,200 USDC",
    verification: "검수 중",
    verificationTone: "accent" as const,
    payment: "미도래",
    paymentTone: "neutral" as const,
    commit: "c17bd91",
    canPay: false,
  },
  {
    code: "M3",
    title: "문서화 · 인수인계",
    period: "09.02 – 09.14",
    amount: "800 USDC",
    verification: "미제출",
    verificationTone: "neutral" as const,
    payment: "미도래",
    paymentTone: "neutral" as const,
    commit: null,
    canPay: false,
  },
];

export default async function VerificationPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
        {[
          ["현재 작업", "M2 · 핵심 기능 검수"],
          ["담당 개발자", "Sarah Lee"],
          ["다음 마감일", "2026.09.15 · D-6"],
          ["승인 예정 금액", "1,000 USDC"],
        ].map(([label, value]) => (
          <dl key={label}>
            <dt className="text-xs font-semibold text-app-muted">{label}</dt>
            <dd className="mt-2 text-base font-black text-app-foreground">{value}</dd>
          </dl>
        ))}
      </section>

      <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.1em] text-brand-700 uppercase">Commit SHA 기준 검증</p>
            <h2 className="mt-2 text-xl font-black text-app-foreground">마일스톤</h2>
            <p className="mt-2 text-sm leading-6 text-app-muted">코드 제출, 실행 검증, 사람의 승인과 지급 상태를 각각 확인합니다.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-semibold text-app-muted">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-success" />검수 완료</span>
            <span className="flex items-center gap-1.5"><Circle className="size-4 text-accent-500" />검수 중</span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-3">
          {milestones.map((milestone) => (
            <article key={milestone.code} className="flex flex-col rounded-card border border-app-border bg-app-surface-subtle p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-lg font-black text-brand-700">{milestone.code}</span>
                  <h3 className="mt-2 text-base font-black text-app-foreground">{milestone.title}</h3>
                </div>
                <StatusBadge tone={milestone.verificationTone}>{milestone.verification}</StatusBadge>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <dt className="text-app-muted">기간</dt>
                  <dd className="mt-1 font-bold text-app-foreground">{milestone.period}</dd>
                </div>
                <div>
                  <dt className="text-app-muted">금액</dt>
                  <dd className="mt-1 font-bold text-app-foreground">{milestone.amount}</dd>
                </div>
              </dl>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-app-border pt-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-app-muted">
                  <GitCommitHorizontal aria-hidden="true" className="size-4" />
                  {milestone.commit ?? "Commit 미제출"}
                </div>
                <StatusBadge tone={milestone.paymentTone}>{milestone.payment}</StatusBadge>
              </div>

              <div className="mt-auto grid gap-2 pt-4">
                <button
                  type="button"
                  disabled={!milestone.commit}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-app-border-strong bg-app-surface px-3 text-sm font-bold text-app-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  검증 결과 보기
                  <ExternalLink aria-hidden="true" className="size-4" />
                </button>

                {milestone.canPay ? (
                  <Link
                    href={{
                      pathname: `/projects/${projectId}/evidence`,
                      query: { milestone: milestone.code, action: "payment" },
                    }}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-brand-500 px-3 text-sm font-bold text-white hover:bg-brand-600"
                  >
                    <HandCoins aria-hidden="true" className="size-4" />
                    임시 지급하기
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
