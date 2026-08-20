"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, UserCheck } from "lucide-react";

import { approveSowAsFreelancerAction, requestSowRevisionAction } from "@/app/actions/sow";
import type { SowApprovalState } from "@/lib/backend";

export function FreelancerSowApprovalPanel({ initialState }: { initialState: SowApprovalState }) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revisionReason, setRevisionReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const isApproved = Boolean(state.approvals.freelancer);

  function approve() {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await approveSowAsFreelancerAction({
        projectId: state.projectId,
        sowVersionId: state.sowVersionId,
        contentHash: state.contentHash,
      });
      if (!result.ok) {
        setErrorMessage(result.error.message);
        return;
      }
      setState(result.data);
      if (
        result.data.status === "approved" ||
        (result.data.approvals.company && result.data.approvals.freelancer)
      ) {
        router.push(`/freelancer/projects/${result.data.projectId}/verification`);
      }
    });
  }

  function requestRevision() {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await requestSowRevisionAction({
        projectId: state.projectId,
        sowVersionId: state.sowVersionId,
        contentHash: state.contentHash,
        reason: revisionReason,
      });
      if (!result.ok) {
        setErrorMessage(result.error.message);
        return;
      }
      setState(result.data);
      setRevisionReason("");
    });
  }

  return (
    <div className="mt-5 space-y-4">
      <ApprovalRow
        roleLabel={state.participants.company.roleLabel}
        displayName={state.participants.company.displayName}
        complete={Boolean(state.approvals.company)}
      />
      <ApprovalRow
        roleLabel={state.participants.freelancer.roleLabel}
        displayName={state.participants.freelancer.displayName}
        complete={isApproved}
      />

      {errorMessage ? (
        <div className="flex gap-2 rounded-control border border-danger/30 bg-danger/10 p-3 text-danger">
          <CircleAlert className="size-4 shrink-0" /><p className="text-xs">{errorMessage}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={approve}
        disabled={isPending || isApproved || state.status !== "in_review"}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <UserCheck className="size-4" />
        {isApproved ? "SOW approved" : isPending ? "Saving approval..." : "Approve this exact SOW version"}
      </button>
      {!isApproved && state.status === "in_review" && (
        <div className="space-y-2 rounded-control border border-app-border p-3">
          <label htmlFor="sow-revision-reason" className="text-xs text-app-foreground">Request changes instead</label>
          <textarea id="sow-revision-reason" value={revisionReason} onChange={(event) => setRevisionReason(event.target.value)} placeholder="Explain the exact terms or acceptance criteria that need revision." className="min-h-24 w-full rounded-control border border-app-border-strong p-3 text-sm" />
          <button type="button" onClick={requestRevision} disabled={isPending || !revisionReason.trim()} className="min-h-10 w-full rounded-control border border-app-border-strong px-4 text-sm font-semibold text-app-foreground disabled:opacity-50">Request SOW revision</button>
        </div>
      )}
      {state.status === "revision_requested" && <p className="rounded-control bg-warning/10 p-3 text-xs text-warning">Revision requested. This reviewed version remains immutable; the client must prepare a new version.</p>}
      <p className="text-xs leading-5 text-app-muted">Approval is recorded against this version&apos;s immutable content hash. It does not approve payment.</p>
    </div>
  );
}

function ApprovalRow({
  roleLabel,
  displayName,
  complete,
}: {
  roleLabel: string;
  displayName: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-control border border-app-border p-3">
      <span>
        <span className="block text-xs font-medium text-app-muted">{roleLabel}</span>
        <span className="mt-1 block text-sm font-semibold text-app-foreground">{displayName}</span>
      </span>
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${complete ? "text-success" : "text-app-muted"}`}>
        <CheckCircle2 className="size-4" />{complete ? "Approved" : "Pending"}
      </span>
    </div>
  );
}
