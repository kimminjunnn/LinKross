import Link from "next/link";
import { ArrowLeft, CircleAlert } from "lucide-react";

import { getEvidenceBundleDetail } from "@/lib/backend";

export default async function EvidenceBundleDetailPage({ params }: { params: Promise<{ projectId: string; bundleId: string }> }) {
  const { projectId, bundleId } = await params;
  const result = await getEvidenceBundleDetail(projectId, bundleId);

  if (!result.ok) {
    return <div className="flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-sm font-bold text-danger"><CircleAlert className="size-5 shrink-0" />{result.error.message}</div>;
  }

  const bundle = result.data;

  return (
    <div className="space-y-5">
      <Link href={`/company/projects/${projectId}/evidence`} className="inline-flex items-center gap-2 text-sm font-bold text-app-muted hover:text-app-foreground"><ArrowLeft className="size-4" />증빙 목록으로</Link>

      <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
        <h1 className="text-xl font-black text-app-foreground">통합 증빙 번들 v{bundle.versionNumber}</h1>
        <p className="mt-1 text-sm text-app-muted">상태 {bundle.status} · 생성 {new Date(bundle.requestedAt).toLocaleString("ko-KR")}</p>
        {bundle.sha256 && <p className="mt-2 break-all rounded-control bg-app-surface-subtle p-3 font-mono text-xs text-app-muted">SHA-256 {bundle.sha256}</p>}
        {bundle.errorMessage && <p className="mt-2 text-sm font-bold text-danger">{bundle.errorMessage}</p>}
        <p className="mt-3 text-xs leading-5 text-app-muted">이 문서는 프로젝트 진행 확인 자료이며 법률, 세무 판단 또는 정식 전자계약을 대체하지 않습니다.</p>
      </section>

      {bundle.payload && <BundleContent payload={bundle.payload} />}
    </div>
  );
}

function BundleContent({ payload }: { payload: Record<string, unknown> }) {
  const project = payload.project as { title?: string } | null;
  const requirementVersion = payload.requirementVersion as Record<string, unknown> | null;
  const selection = payload.selection as { selectedAt?: string; proposal?: { content?: string; submittedAt?: string } } | null;
  const sow = payload.sow as { versionNumber?: number; approvedAt?: string; approvals?: Array<{ approver_role: string; approved_at: string }> } | null;
  const milestones = (payload.milestones as Array<Record<string, unknown>>) ?? [];
  const invoices = (payload.invoices as Array<Record<string, unknown>>) ?? [];
  const payments = (payload.payments as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="space-y-4">
      <Section title="프로젝트 및 요구사항">
        <p className="text-sm font-bold text-app-foreground">{project?.title ?? "-"}</p>
        {requirementVersion && <p className="mt-1 text-sm text-app-muted">{String(requirementVersion.goal ?? "")}</p>}
      </Section>

      <Section title="선정된 수행 제안서">
        {selection ? (
          <div>
            <p className="text-xs text-app-muted">선정일 {selection.selectedAt ? new Date(selection.selectedAt).toLocaleString("ko-KR") : "-"}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-app-foreground">{selection.proposal?.content ?? "원문을 찾지 못했습니다."}</p>
          </div>
        ) : <p className="text-sm text-app-muted">선정 기록이 없습니다.</p>}
      </Section>

      <Section title="SOW 승인">
        {sow ? (
          <div>
            <p className="text-sm text-app-muted">승인일 {sow.approvedAt ? new Date(sow.approvedAt).toLocaleString("ko-KR") : "-"}</p>
            <ul className="mt-2 space-y-1 text-sm">
              {(sow.approvals ?? []).map((approval, index) => (
                <li key={index} className="text-app-foreground">{approval.approver_role} 승인 · {new Date(approval.approved_at).toLocaleString("ko-KR")}</li>
              ))}
            </ul>
          </div>
        ) : <p className="text-sm text-app-muted">승인된 SOW가 없습니다.</p>}
      </Section>

      <Section title="마일스톤 검수 결과">
        <div className="space-y-3">
          {milestones.length === 0 && <p className="text-sm text-app-muted">마일스톤이 없습니다.</p>}
          {milestones.map((milestone) => {
            const submissions = (milestone.submissions as Array<Record<string, unknown>>) ?? [];
            const finalDecision = milestone.finalDecision as Record<string, unknown> | null;
            return (
              <div key={String(milestone.id)} className="rounded-control bg-app-surface-subtle p-3">
                <p className="font-black text-app-foreground">{String(milestone.code)} · {String(milestone.title)} <span className="ml-2 text-xs font-bold text-app-muted">{String(milestone.status)}</span></p>
                {submissions[0] && (
                  <p className="mt-1 text-xs text-app-muted">PR #{String(submissions[0].pull_request_number)} · commit {String(submissions[0].head_commit_sha).slice(0, 12)}</p>
                )}
                {finalDecision && <p className="mt-1 text-xs font-bold text-accent-700">최종 승인 · {new Date(String(finalDecision.decided_at)).toLocaleString("ko-KR")}</p>}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="인보이스 및 지급">
        <div className="space-y-2 text-sm">
          {invoices.length === 0 && payments.length === 0 && <p className="text-app-muted">인보이스/지급 기록이 없습니다.</p>}
          {invoices.map((invoice) => (
            <p key={String(invoice.id)} className="text-app-foreground">인보이스 {String(invoice.invoice_number)} · {String(invoice.status)} · {String(invoice.amount)} {String(invoice.currency)}</p>
          ))}
          {payments.map((payment) => (
            <p key={String(payment.id)} className="text-app-foreground">지급 {String(payment.status)} · {String(payment.amount_usdc)} {String(payment.currency)}</p>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
      <h2 className="font-black text-app-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
