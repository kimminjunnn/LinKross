"use client";

import { useState, useTransition } from "react";
import { ExternalLink, GitPullRequest, Loader2, ShieldCheck } from "lucide-react";

import { submitMilestonePullRequestAction } from "@/app/actions/verification";
import type { VerificationMilestoneRecord, VerificationWorkspace } from "@/lib/backend";

export function FreelancerCodeSubmission({ initialWorkspace }: { initialWorkspace: VerificationWorkspace }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
      <div className="flex items-start gap-3">
        <GitPullRequest className="mt-0.5 size-5 text-brand-600" />
        <div>
          <h2 className="text-lg font-black text-app-foreground">Code submission and verification</h2>
          <p className="mt-1 text-sm leading-6 text-app-muted">
            Submit a PR from the official project repository. LinKross resolves and stores the immutable head Commit SHA.
          </p>
        </div>
      </div>

      {initialWorkspace.repository ? (
        <a href={initialWorkspace.repository.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-control bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700">
          {initialWorkspace.repository.owner}/{initialWorkspace.repository.name}<ExternalLink className="size-4" />
        </a>
      ) : (
        <p className="mt-4 rounded-control border border-dashed border-app-border-strong p-4 text-sm font-bold text-app-muted">
          The client must connect and confirm the official GitHub repository first.
        </p>
      )}

      {message && <p className="mt-4 rounded-control bg-app-surface-subtle p-3 text-sm font-bold text-app-muted">{message}</p>}

      <div className="mt-5 space-y-4">
        {initialWorkspace.milestones.map((milestone) => (
          <SubmissionCard
            key={milestone.id}
            projectId={initialWorkspace.projectId}
            milestone={milestone}
            repositoryReady={Boolean(initialWorkspace.repository)}
            pending={pending}
            submit={(input) => startTransition(async () => {
              const result = await submitMilestonePullRequestAction(input);
              setMessage(result.ok ? `Submission saved at Commit ${result.data.headCommitSha}.` : result.error.message);
            })}
          />
        ))}
      </div>
    </section>
  );
}

function SubmissionCard({ projectId, milestone, repositoryReady, pending, submit }: {
  projectId: string;
  milestone: VerificationMilestoneRecord;
  repositoryReady: boolean;
  pending: boolean;
  submit: (input: { projectId: string; milestoneId: string; pullRequestUrl: string; claimedCriterionIds: string[]; implementationNote?: string }) => void;
}) {
  function submitForm(formData: FormData) {
    submit({
      projectId,
      milestoneId: milestone.id,
      pullRequestUrl: String(formData.get("pullRequestUrl") ?? ""),
      claimedCriterionIds: formData.getAll("criterionId").map(String),
      implementationNote: String(formData.get("implementationNote") ?? ""),
    });
  }

  return (
    <article className="rounded-control border border-app-border p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-black text-app-foreground">{milestone.code} · {milestone.title}</h3>
        <span className="text-xs font-bold text-app-muted">{milestone.submissions.length} submission(s)</span>
      </div>

      <form action={submitForm} className="mt-4 space-y-3">
        <input name="pullRequestUrl" type="url" required disabled={!repositoryReady || pending} placeholder="https://github.com/owner/repository/pull/123" className="min-h-11 w-full rounded-control border border-app-border-strong px-3 text-sm disabled:opacity-50" />
        <fieldset disabled={!repositoryReady || pending} className="space-y-2">
          <legend className="text-xs font-black text-app-foreground">Criteria completed in this PR</legend>
          {milestone.checklist.map((criterion) => (
            <label key={criterion.id} className="flex items-start gap-2 rounded-control bg-app-surface-subtle p-3 text-sm text-app-muted">
              <input type="checkbox" name="criterionId" value={criterion.id} className="mt-1" />
              <span>{criterion.description}</span>
            </label>
          ))}
        </fieldset>
        <textarea name="implementationNote" disabled={!repositoryReady || pending} placeholder="Implementation note, known limitations, or test instructions" className="min-h-24 w-full rounded-control border border-app-border-strong p-3 text-sm disabled:opacity-50" />
        <button disabled={!repositoryReady || pending} className="inline-flex min-h-10 items-center gap-2 rounded-control bg-brand-600 px-4 text-sm font-black text-white disabled:opacity-50">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <GitPullRequest className="size-4" />}Submit PR
        </button>
      </form>

      {milestone.submissions.length > 0 && (
        <div className="mt-5 space-y-3 border-t border-app-border pt-4">
          {milestone.submissions.map((submission) => (
            <div key={submission.id} className="rounded-control bg-app-surface-subtle p-3 text-sm">
              <a href={submission.pullRequestUrl} target="_blank" rel="noreferrer" className="font-black text-brand-700">PR #{submission.pullRequestNumber} · attempt {submission.attemptNumber}</a>
              <p className="mt-1 break-all font-mono text-xs text-app-muted">{submission.headCommitSha}</p>
              {submission.runs.map((run) => (
                <p key={run.id} className="mt-2 flex items-center gap-2 text-xs font-bold text-app-muted">
                  <ShieldCheck className="size-4" />Verification {run.attemptNumber}: {run.status.replaceAll("_", " ")}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
