"use client";

import { useState, useTransition } from "react";
import { Banknote, CheckCircle2, Clock3, FileText, Loader2, PartyPopper, XCircle } from "lucide-react";

import { advancePaymentStatusAction, completeProjectAction, requestPaymentAction, reviewInvoiceAction } from "@/app/actions/finance";
import { paymentStatusLabel } from "@/config/payment-status";
import type { FinancialMilestoneRecord, PaymentRecordStatus, ProjectFinancialWorkspace } from "@/lib/backend";

export function CompanyFinancialWorkspace({ workspace }: { workspace: ProjectFinancialWorkspace }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const allMilestonesPaid = workspace.milestones.length > 0
    && workspace.milestones.every((milestone) => milestone.status === "approved" && milestone.payment?.status === "completed");

  return (
    <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
      <p className="text-xs font-semibold tracking-[0.1em] text-brand-700 uppercase">Human approval required</p>
      <h2 className="mt-2 text-xl font-semibold text-app-foreground">승인, 인보이스 및 지급 상태</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">실제 송금은 외부 결제 방식으로 처리하고, LinKross는 승인된 마일스톤과 인보이스 및 지급 참조값을 연결해 보여줍니다.</p>
      {message && <p className="mt-4 rounded-control bg-app-surface-subtle p-3 text-sm text-app-muted">{message}</p>}

      <div className="mt-6 space-y-3">
        {workspace.milestones.length === 0 ? (
          <p className="rounded-control border border-dashed border-app-border-strong p-5 text-sm text-app-muted">양측 승인된 SOW의 마일스톤이 아직 없습니다.</p>
        ) : workspace.milestones.map((milestone) => (
          <MilestoneFinanceCard
            key={milestone.id}
            milestone={milestone}
            pending={pending}
            review={(status, note) => startTransition(async () => {
              if (!milestone.invoice) return;
              const result = await reviewInvoiceAction({ projectId: workspace.projectId, invoiceId: milestone.invoice.id, status, reviewNote: note });
              setMessage(result.ok ? (status === "approved" ? "인보이스를 승인했습니다." : "인보이스를 반려했습니다.") : result.error.message);
            })}
            requestPayment={() => startTransition(async () => {
              const result = await requestPaymentAction({ projectId: workspace.projectId, milestoneId: milestone.id });
              setMessage(result.ok ? "지급을 요청했습니다." : result.error.message);
            })}
            advancePayment={(status, externalReference) => startTransition(async () => {
              if (!milestone.payment) return;
              const result = await advancePaymentStatusAction({ projectId: workspace.projectId, paymentId: milestone.payment.id, status, externalReference });
              setMessage(result.ok ? `지급 상태를 ${paymentStatusLabel[status]}(으)로 변경했습니다.` : result.error.message);
            })}
          />
        ))}
      </div>

      {workspace.lifecycleStage === "completed" ? (
        <div className="mt-5 flex items-center gap-2 rounded-control bg-accent-50 p-4 text-sm text-accent-700">
          <PartyPopper className="size-5" />프로젝트가 완료 처리되었습니다.
        </div>
      ) : allMilestonesPaid && (
        <div className="mt-5 rounded-control border border-app-border-strong bg-app-surface-subtle p-4">
          <p className="text-sm text-app-foreground">모든 마일스톤이 승인되고 지급까지 완료됐습니다.</p>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => {
              const result = await completeProjectAction(workspace.projectId);
              setMessage(result.ok ? "프로젝트를 완료 처리했습니다." : result.error.message);
            })}
            className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-accent-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <PartyPopper className="size-4" />}프로젝트 완료 처리
          </button>
        </div>
      )}
    </section>
  );
}

function MilestoneFinanceCard({ milestone, pending, review, requestPayment, advancePayment }: {
  milestone: FinancialMilestoneRecord;
  pending: boolean;
  review: (status: "approved" | "rejected", note: string) => void;
  requestPayment: () => void;
  advancePayment: (status: Exclude<PaymentRecordStatus, "requested">, externalReference?: string) => void;
}) {
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  return (
    <article className="rounded-control border border-app-border bg-app-surface-subtle p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-app-foreground">{milestone.code} · {milestone.title}</h3><span className="rounded-full bg-app-surface px-2.5 py-1 text-xs font-semibold text-app-muted">{milestone.status.replaceAll("_", " ")}</span></div>
          <p className="mt-2 text-sm text-app-muted">SOW 금액 {milestone.amount.toLocaleString()} {milestone.currency}</p>
        </div>
        {milestone.approvedAt ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-700"><CheckCircle2 className="size-4" />최종 승인</span> : <span className="inline-flex items-center gap-1 text-xs font-semibold text-app-muted"><Clock3 className="size-4" />승인 대기</span>}
      </div>

      {!milestone.invoice ? (
        <p className="mt-4 rounded-control border border-dashed border-app-border-strong bg-app-surface p-3 text-sm text-app-muted">프리랜서가 제출한 인보이스가 없습니다.</p>
      ) : (
        <div className="mt-4 rounded-control bg-app-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-app-foreground"><FileText className="size-4" />{milestone.invoice.invoiceNumber}</p>
            <span className="rounded-full bg-app-surface-subtle px-2.5 py-1 text-xs text-app-muted">{milestone.invoice.status}</span>
          </div>
          {milestone.invoice.status === "submitted" && (
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="검토 메모 (반려 시 필수)" className="min-h-10 rounded-control border border-app-border-strong px-3 text-sm" />
              <button type="button" disabled={pending} onClick={() => review("rejected", note)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-app-border-strong px-4 text-sm font-semibold text-app-foreground disabled:opacity-50"><XCircle className="size-4" />반려</button>
              <button type="button" disabled={pending} onClick={() => review("approved", note)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}승인</button>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 rounded-control bg-app-surface p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-2 font-semibold text-app-muted"><Banknote className="size-4" />지급 상태</span>
          <span className="text-app-foreground">
            {milestone.payment ? `${paymentStatusLabel[milestone.payment.status]} · ${milestone.payment.amount.toLocaleString()} ${milestone.payment.currency}` : "외부 지급 기록 없음"}
          </span>
        </div>

        {!milestone.payment ? (
          milestone.invoice?.status === "approved" && (
            <button type="button" disabled={pending} onClick={requestPayment} className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-50">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Banknote className="size-4" />}지급
            </button>
          )
        ) : (milestone.payment.status === "requested" || milestone.payment.status === "processing") && (
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="외부 송금 참조값 (선택)" className="min-h-10 rounded-control border border-app-border-strong px-3 text-sm" />
            {milestone.payment.status === "requested" && (
              <button type="button" disabled={pending} onClick={() => advancePayment("processing", reference)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-app-border-strong px-4 text-sm font-semibold text-app-foreground disabled:opacity-50">처리 중으로 변경</button>
            )}
            <button type="button" disabled={pending} onClick={() => advancePayment("completed", reference)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-accent-600 px-4 text-sm font-semibold text-white disabled:opacity-50">지급 완료 처리</button>
          </div>
        )}
      </div>
    </article>
  );
}
