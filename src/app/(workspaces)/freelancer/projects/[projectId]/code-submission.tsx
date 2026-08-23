"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CheckSquare,
  Clock3,
  ExternalLink,
  GitPullRequest,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Square,
  XCircle,
} from "lucide-react";

import { submitMilestonePullRequestAction } from "@/app/actions/verification";
import type {
  MilestoneSubmissionRecord,
  VerificationMilestoneRecord,
  VerificationResultRecord,
  VerificationRunRecord,
  VerificationWorkspace,
} from "@/lib/backend";

type StatusTone = "neutral" | "brand" | "success" | "warning" | "danger";

const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-app-surface-subtle text-app-muted",
  brand: "bg-brand-50 text-brand-700",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

export function FreelancerCodeSubmission({ initialWorkspace }: { initialWorkspace: VerificationWorkspace }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const anyRunInProgress = initialWorkspace.milestones.some((milestone) => {
      const latestRunStatus = milestone.submissions[0]?.runs[0]?.status;
      return (
        latestRunStatus !== undefined &&
        ["queued", "provisioning", "installing", "building", "running"].includes(latestRunStatus)
      );
    });
    if (!anyRunInProgress) return;

    const interval = window.setInterval(() => router.refresh(), 4000);
    return () => window.clearInterval(interval);
  }, [initialWorkspace.milestones, router]);

  return (
    <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
      <div className="flex items-start gap-3">
        <GitPullRequest aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <h2 className="text-lg font-semibold text-app-foreground">Code submission and verification</h2>
          <p className="mt-1 text-sm leading-6 text-app-muted">
            Submit an open PR from the official project repository. LinKross locks the immutable head Commit SHA. The client starts milestone verification from their review screen.
          </p>
        </div>
      </div>

      {initialWorkspace.repository ? (
        <a href={initialWorkspace.repository.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-control bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700">
          {initialWorkspace.repository.owner}/{initialWorkspace.repository.name}<ExternalLink aria-hidden="true" className="size-4" />
        </a>
      ) : (
        <div className="mt-4 flex items-start gap-3 rounded-control border border-dashed border-app-border-strong bg-app-surface-subtle p-4">
          <Clock3 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-app-muted" />
          <div>
            <p className="text-sm text-app-foreground">Waiting for the official repository</p>
            <p className="mt-1 text-sm leading-6 text-app-muted">
              The client must connect and confirm the GitHub repository before you can submit a PR.
            </p>
          </div>
        </div>
      )}

      {message ? (
        <p aria-live="polite" className="mt-4 rounded-control bg-app-surface-subtle p-3 text-sm text-app-muted">
          {message}
        </p>
      ) : null}

      <div className="mt-5 space-y-4">
        {initialWorkspace.milestones.length === 0 ? (
          <p className="rounded-control border border-dashed border-app-border-strong p-6 text-center text-sm text-app-muted">
            No milestones are available in the approved SOW.
          </p>
        ) : initialWorkspace.milestones.map((milestone) => (
          <SubmissionCard
            key={milestone.id}
            projectId={initialWorkspace.projectId}
            milestone={milestone}
            repositoryReady={Boolean(initialWorkspace.repository)}
            pending={pending}
            submit={(input) => startTransition(async () => {
              const result = await submitMilestonePullRequestAction(input);
              if (!result.ok) {
                setMessage(formatSubmissionError(result.error));
                return;
              }
              setMessage(`Submission saved at Commit ${result.data.headCommitSha}. Verification starts when the client requests it.`);
              router.refresh();
            })}
          />
        ))}
      </div>
    </section>
  );
}

function formatSubmissionError(error: { message: string; diagnosticCode?: string }) {
  return error.diagnosticCode
    ? `${error.message} (Diagnostic code: ${error.diagnosticCode})`
    : error.message;
}

function SubmissionCard({ projectId, milestone, repositoryReady, pending, submit }: {
  projectId: string;
  milestone: VerificationMilestoneRecord;
  repositoryReady: boolean;
  pending: boolean;
  submit: (input: { projectId: string; milestoneId: string; pullRequestUrl: string; claimedCriterionIds: string[]; implementationNote?: string }) => void;
}) {
  const latestSubmission = milestone.submissions[0];
  const currentDecision =
    milestone.decision?.submissionId === latestSubmission?.id ? milestone.decision : null;
  const status = resolveMilestoneStatus(milestone, latestSubmission, currentDecision);
  const submissionClosed = status.key === "approved" || status.key === "cancelled";
  const [selectedCriterionIds, setSelectedCriterionIds] = useState<string[]>([]);
  const allCriteriaSelected =
    milestone.checklist.length > 0 && selectedCriterionIds.length === milestone.checklist.length;

  function toggleCriterion(criterionId: string, checked: boolean) {
    setSelectedCriterionIds((previous) =>
      checked ? [...previous, criterionId] : previous.filter((id) => id !== criterionId),
    );
  }

  function toggleAllCriteria() {
    setSelectedCriterionIds(allCriteriaSelected ? [] : milestone.checklist.map((criterion) => criterion.id));
  }

  function submitForm(formData: FormData) {
    submit({
      projectId,
      milestoneId: milestone.id,
      pullRequestUrl: String(formData.get("pullRequestUrl") ?? ""),
      claimedCriterionIds: formData.getAll("criterionId").map(String),
      implementationNote: String(formData.get("implementationNote") ?? ""),
    });
  }

  const prInputId = `milestone-pr-${milestone.id}`;
  const noteInputId = `milestone-note-${milestone.id}`;

  return (
    <article className="rounded-control border border-app-border p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-app-foreground">{milestone.code} · {milestone.title}</h3>
            <StatusPill label={status.label} tone={status.tone} />
          </div>
          <p className="mt-2 text-xs text-app-muted">
            {formatDateRange(milestone.startDate, milestone.endDate)} · {milestone.amount.toLocaleString()} {milestone.currency}
          </p>
        </div>
        <span className="text-xs text-app-muted">
          {milestone.submissions.length} {milestone.submissions.length === 1 ? "submission" : "submissions"}
        </span>
      </div>

      {currentDecision?.decision === "revision_required" ? (
        <div className="mt-4 flex items-start gap-3 rounded-control border border-danger/30 bg-danger/10 p-4 text-danger">
          <RotateCcw aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm">Changes requested by the client</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
              {currentDecision.reason || "Review the verification results and submit a new Commit SHA."}
            </p>
          </div>
        </div>
      ) : null}

      {latestSubmission ? <VerificationSummary milestone={milestone} submission={latestSubmission} /> : null}

      {!repositoryReady ? (
        <p className="mt-4 rounded-control bg-app-surface-subtle p-4 text-sm leading-6 text-app-muted">
          PR submission will become available after the client connects the official repository.
        </p>
      ) : submissionClosed ? (
        <p className="mt-4 flex items-center gap-2 rounded-control bg-success/10 p-4 text-sm text-success">
          <CheckCircle2 aria-hidden="true" className="size-5 shrink-0" />
          {status.key === "approved" ? "This milestone is approved. No further submission is required." : "This milestone is closed."}
        </p>
      ) : (
        <form action={submitForm} className="mt-5 space-y-4 border-t border-app-border pt-5">
          <div>
            <label htmlFor={prInputId} className="text-xs text-app-foreground">GitHub PR URL</label>
            <input id={prInputId} name="pullRequestUrl" type="url" required disabled={pending} placeholder="https://github.com/owner/repository/pull/123" className="mt-2 min-h-11 w-full rounded-control border border-app-border-strong px-3 text-sm disabled:opacity-50" />
          </div>
          <fieldset disabled={pending} className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <legend className="text-xs text-app-foreground">Criteria completed in this PR</legend>
              {milestone.checklist.length > 0 ? (
                <button
                  type="button"
                  onClick={toggleAllCriteria}
                  aria-pressed={allCriteriaSelected}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-control border border-app-border-strong px-2.5 text-xs font-semibold text-app-foreground disabled:opacity-50"
                >
                  {allCriteriaSelected ? (
                    <Square aria-hidden="true" className="size-3.5" />
                  ) : (
                    <CheckSquare aria-hidden="true" className="size-3.5" />
                  )}
                  {allCriteriaSelected ? "Clear all" : "Select all"}
                </button>
              ) : null}
            </div>
            {milestone.checklist.map((criterion) => (
              <label key={criterion.id} className="flex items-start gap-2 rounded-control bg-app-surface-subtle p-3 text-sm text-app-muted">
                <input
                  type="checkbox"
                  name="criterionId"
                  value={criterion.id}
                  checked={selectedCriterionIds.includes(criterion.id)}
                  onChange={(event) => toggleCriterion(criterion.id, event.target.checked)}
                  className="mt-1"
                />
                <span>{criterion.description}</span>
              </label>
            ))}
          </fieldset>
          <div>
            <label htmlFor={noteInputId} className="text-xs text-app-foreground">Implementation note <span className="text-app-muted">(optional)</span></label>
            <textarea id={noteInputId} name="implementationNote" disabled={pending} placeholder="Known limitations or test instructions" className="mt-2 min-h-24 w-full rounded-control border border-app-border-strong p-3 text-sm disabled:opacity-50" />
          </div>
          <button disabled={pending} className="inline-flex min-h-11 items-center gap-2 rounded-control bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-50">
            {pending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <GitPullRequest aria-hidden="true" className="size-4" />}Submit PR
          </button>
          <p className="text-xs leading-5 text-app-muted">
            A new Commit SHA creates the next submission attempt. Verification does not start on submission — the client runs it against this Commit SHA.
          </p>
        </form>
      )}

      {milestone.submissions.length > 0 ? (
        <details className="mt-5 border-t border-app-border pt-4">
          <summary className="cursor-pointer text-sm text-app-foreground">Submission history</summary>
          <div className="mt-3 space-y-3">
            {milestone.submissions.map((submission) => (
              <div key={submission.id} className="rounded-control bg-app-surface-subtle p-3 text-sm">
                <a href={submission.pullRequestUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                  PR #{submission.pullRequestNumber} · attempt {submission.attemptNumber}<ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
                <p className="mt-1 break-all font-mono text-xs text-app-muted">{submission.headCommitSha}</p>
                {submission.runs.map((run) => (
                  <p key={run.id} className="mt-2 flex items-center gap-2 text-xs text-app-muted">
                    <ShieldCheck aria-hidden="true" className="size-4" />Verification {run.attemptNumber}: {formatStatus(run.status)}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </article>
  );
}

function VerificationSummary({ milestone, submission }: {
  milestone: VerificationMilestoneRecord;
  submission: MilestoneSubmissionRecord;
}) {
  const latestRun = submission.runs[0];
  const resultsByCriterion = new Map(
    (latestRun?.results ?? []).map((result) => [result.criterionId, result]),
  );

  return (
    <section aria-label="Latest verification result" className="mt-4 rounded-control border border-app-border bg-app-surface-subtle p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-app-muted">Latest submitted Commit</p>
          <p className="mt-1 break-all font-mono text-xs text-app-foreground">{submission.headCommitSha}</p>
        </div>
        {latestRun ? <RunStatusPill run={latestRun} /> : <StatusPill label="Waiting for the client to verify" tone="neutral" />}
      </div>

      {latestRun?.errorSummary ? (
        <p className="mt-3 flex items-start gap-2 rounded-control bg-danger/10 p-3 text-sm leading-6 text-danger">
          <XCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{latestRun.errorSummary}
        </p>
      ) : null}

      <ul className="mt-4 space-y-2">
        {milestone.checklist.map((criterion) => {
          const result = resultsByCriterion.get(criterion.id);
          const claimed = submission.claimedCriterionIds.includes(criterion.id);
          const resultStatus = resolveCriterionStatus(result, claimed);
          return (
            <li key={criterion.id} className="rounded-control border border-app-border bg-app-surface p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 flex-1 text-sm leading-5 text-app-foreground">{criterion.description}</p>
                <StatusPill label={resultStatus.label} tone={resultStatus.tone} />
              </div>
              {result?.observedResult ? <p className="mt-2 text-xs leading-5 text-app-muted">{result.observedResult}</p> : null}
              {result?.errorMessage ? <p className="mt-2 text-xs leading-5 text-danger">{result.errorMessage}</p> : null}
              {result?.evidence.some((artifact) => artifact.url) ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.evidence.map((artifact) => artifact.url ? (
                    <a key={artifact.id} href={artifact.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                      Open {formatStatus(artifact.type)}<ExternalLink aria-hidden="true" className="size-3" />
                    </a>
                  ) : null)}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {latestRun?.previewUrl ? (
        <a href={latestRun.previewUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
          Open preview<ExternalLink aria-hidden="true" className="size-3.5" />
        </a>
      ) : null}
    </section>
  );
}

function RunStatusPill({ run }: { run: VerificationRunRecord }) {
  const status = resolveRunStatus(run.status);
  return <StatusPill label={status.label} tone={status.tone} />;
}

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  return <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE_CLASS[tone]}`}>{label}</span>;
}

function resolveMilestoneStatus(
  milestone: VerificationMilestoneRecord,
  latestSubmission: MilestoneSubmissionRecord | undefined,
  currentDecision: VerificationMilestoneRecord["decision"],
) {
  if (currentDecision?.decision === "approved" || milestone.status === "approved") {
    return { key: "approved", label: "Approved", tone: "success" as const };
  }
  if (milestone.status === "cancelled") {
    return { key: "cancelled", label: "Cancelled", tone: "neutral" as const };
  }
  if (currentDecision?.decision === "revision_required") {
    return { key: "revision_required", label: "Changes requested", tone: "danger" as const };
  }
  const latestRun = latestSubmission?.runs[0];
  if (latestRun) {
    const runStatus = resolveRunStatus(latestRun.status);
    return { key: latestRun.status, ...runStatus };
  }
  if (latestSubmission) {
    return { key: "verification_ready", label: "Waiting for the client to verify", tone: "brand" as const };
  }
  return { key: "submission_required", label: "PR required", tone: "warning" as const };
}

function resolveRunStatus(status: VerificationRunRecord["status"]): { label: string; tone: StatusTone } {
  if (["queued", "provisioning", "installing", "building", "running"].includes(status)) {
    return { label: status === "queued" ? "Verification queued" : "Verification in progress", tone: "brand" };
  }
  if (status === "passed") return { label: "Passed", tone: "success" };
  if (status === "needs_review") return { label: "Client review needed", tone: "warning" };
  if (["failed", "timed_out"].includes(status)) return { label: status === "timed_out" ? "Timed out" : "Failed", tone: "danger" };
  return { label: "Cancelled", tone: "neutral" };
}

function resolveCriterionStatus(result: VerificationResultRecord | undefined, claimed: boolean): { label: string; tone: StatusTone } {
  if (!result || result.status === "not_run") {
    return claimed ? { label: "Submitted", tone: "brand" } : { label: "Not submitted", tone: "neutral" };
  }
  if (result.status === "passed") return { label: "Passed", tone: "success" };
  if (result.status === "failed") return { label: "Failed", tone: "danger" };
  if (result.status === "needs_review") return { label: "Client review needed", tone: "warning" };
  if (result.status === "running") return { label: "Running", tone: "brand" };
  return { label: "Queued", tone: "neutral" };
}

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) return "Schedule not set";
  return `${startDate ?? "-"} – ${endDate ?? "-"}`;
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}
