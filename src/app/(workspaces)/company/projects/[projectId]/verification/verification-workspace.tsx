"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, ExternalLink, GitFork, Loader2, Play, RotateCcw } from "lucide-react";

import {
  connectProjectRepositoryAction,
  decideMilestoneAction,
  requestVerificationRunAction,
} from "@/app/actions/verification";
import type { VerificationMilestoneRecord, VerificationRunRecord, VerificationWorkspace } from "@/lib/backend";

export function CompanyVerificationWorkspace({ initialWorkspace }: { initialWorkspace: VerificationWorkspace }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function connectRepository(formData: FormData) {
    const repositoryUrl = String(formData.get("repositoryUrl") ?? "");
    startTransition(async () => {
      const result = await connectProjectRepositoryAction({ projectId: initialWorkspace.projectId, repositoryUrl });
      setMessage(result.ok ? "공식 저장소를 연결했습니다." : result.error.message);
    });
  }

  return (
    <>
      <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-control bg-app-foreground text-white">
            <GitFork className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-[0.1em] text-brand-700 uppercase">Project repository</p>
            {initialWorkspace.repository ? (
              <>
                <a href={initialWorkspace.repository.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 font-black text-app-foreground hover:text-brand-700">
                  {initialWorkspace.repository.owner}/{initialWorkspace.repository.name}
                  <ExternalLink className="size-4" />
                </a>
                <p className="mt-1 text-sm text-app-muted">
                  기본 브랜치 {initialWorkspace.repository.defaultBranch ?? "미확인"} · 공개 저장소 · 발주자 확인 완료
                </p>
              </>
            ) : (
              <form action={connectRepository} className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input name="repositoryUrl" type="url" required placeholder="https://github.com/owner/repository" className="min-h-11 flex-1 rounded-control border border-app-border-strong px-3 text-sm" />
                <button disabled={pending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-600 px-4 text-sm font-black text-white disabled:opacity-60">
                  {pending && <Loader2 className="size-4 animate-spin" />} 저장소 확인 및 연결
                </button>
              </form>
            )}
          </div>
        </div>
        {message && <p className="mt-4 rounded-control bg-app-surface-subtle p-3 text-sm font-bold text-app-muted">{message}</p>}
      </section>

      <section className="space-y-4">
        {initialWorkspace.milestones.map((milestone) => (
          <MilestoneCard key={milestone.id} projectId={initialWorkspace.projectId} milestone={milestone} disabled={pending} run={(task) => startTransition(task)} setMessage={setMessage} />
        ))}
      </section>
    </>
  );
}

function MilestoneCard({ projectId, milestone, disabled, run, setMessage }: {
  projectId: string;
  milestone: VerificationMilestoneRecord;
  disabled: boolean;
  run: (task: () => Promise<void>) => void;
  setMessage: (message: string) => void;
}) {
  const latestSubmission = milestone.submissions[0];
  const latestRun = latestSubmission?.runs[0];

  function requestRun() {
    if (!latestSubmission) return;
    run(async () => {
      const result = await requestVerificationRunAction({ projectId, milestoneId: milestone.id, submissionId: latestSubmission.id, scope: "milestone" });
      setMessage(result.ok ? "검수 실행 요청을 대기열에 저장했습니다." : result.error.message);
    });
  }

  function decide(formData: FormData) {
    if (!latestSubmission) return;
    const decision = String(formData.get("decision")) as "approved" | "revision_required";
    const reason = String(formData.get("reason") ?? "");
    run(async () => {
      const result = await decideMilestoneAction({
        projectId,
        milestoneId: milestone.id,
        submissionId: latestSubmission.id,
        verificationRunId: decision === "approved" ? latestRun?.id : undefined,
        decision,
        reason,
      });
      setMessage(result.ok ? (decision === "approved" ? "마일스톤을 승인했습니다." : "수정 요청을 기록했습니다.") : result.error.message);
    });
  }

  return (
    <article className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-brand-700">{milestone.code} · SOW 완료조건 {milestone.checklist.length}개</p>
          <h2 className="mt-1 text-lg font-black text-app-foreground">{milestone.title}</h2>
          {milestone.description && <p className="mt-2 text-sm leading-6 text-app-muted">{milestone.description}</p>}
        </div>
        <span className="rounded-full bg-app-surface-subtle px-3 py-1 text-xs font-bold text-app-muted">{milestone.status.replaceAll("_", " ")}</span>
      </div>

      <ul className="mt-4 space-y-2">
        {milestone.checklist.map((criterion) => (
          <li key={criterion.id} className="flex gap-2 rounded-control border border-app-border p-3 text-sm text-app-muted">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" />
            <span>{criterion.description} <span className="text-xs">({criterion.verificationMethod})</span></span>
          </li>
        ))}
      </ul>

      {!latestSubmission ? (
        <p className="mt-5 rounded-control border border-dashed border-app-border-strong p-4 text-sm font-bold text-app-muted">프리랜서의 PR 제출을 기다리고 있습니다.</p>
      ) : (
        <div className="mt-5 space-y-4 border-t border-app-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <a href={latestSubmission.pullRequestUrl} target="_blank" rel="noreferrer" className="font-black text-brand-700 hover:underline">PR #{latestSubmission.pullRequestNumber} · {latestSubmission.pullRequestTitle}</a>
              <p className="mt-1 break-all font-mono text-xs text-app-muted">Commit SHA {latestSubmission.headCommitSha}</p>
            </div>
            <button type="button" disabled={disabled || latestRun?.status === "queued"} onClick={requestRun} className="inline-flex min-h-10 items-center gap-2 rounded-control bg-brand-600 px-4 text-sm font-black text-white disabled:opacity-50">
              <Play className="size-4" /> {latestRun?.status === "queued" ? "Runner 연결 대기" : "검수 요청"}
            </button>
          </div>

          {latestSubmission.runs.map((verificationRun) => <RunResult key={verificationRun.id} run={verificationRun} />)}

          <form action={decide} className="grid gap-3 rounded-control bg-app-surface-subtle p-4 sm:grid-cols-[1fr_auto_auto]">
            <input name="reason" placeholder="수정 요청 사유 (수정 요청 시 필수)" className="min-h-10 rounded-control border border-app-border-strong bg-app-surface px-3 text-sm" />
            <button name="decision" value="revision_required" disabled={disabled} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-app-border-strong px-4 text-sm font-black text-app-foreground disabled:opacity-50"><RotateCcw className="size-4" />수정 요청</button>
            <button name="decision" value="approved" disabled={disabled || !latestRun || !["passed", "needs_review"].includes(latestRun.status)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-accent-600 px-4 text-sm font-black text-white disabled:opacity-50"><CheckCircle2 className="size-4" />최종 승인</button>
          </form>
        </div>
      )}
    </article>
  );
}

function RunResult({ run }: { run: VerificationRunRecord }) {
  return (
    <div className="rounded-control border border-app-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-black text-app-foreground">검수 #{run.attemptNumber}</p>
        <span className="rounded-full bg-app-surface-subtle px-3 py-1 text-xs font-bold text-app-muted">{run.status.replaceAll("_", " ")}</span>
      </div>
      {run.status === "queued" && <p className="mt-2 text-sm text-app-muted">요청은 저장됐습니다. 격리 Runner가 이 실행을 가져가야 실제 결과가 생성됩니다.</p>}
      {run.errorSummary && <p className="mt-2 text-sm text-red-700">{run.errorSummary}</p>}
      {run.previewUrl && <a href={run.previewUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-bold text-brand-700">Preview 열기</a>}
      {run.results.length > 0 && (
        <ul className="mt-3 space-y-2">
          {run.results.map((result) => (
            <li key={result.id} className="rounded-control bg-app-surface-subtle p-3 text-sm">
              <span className="font-black">{result.status.replaceAll("_", " ")}</span>
              {result.observedResult && <p className="mt-1 text-app-muted">{result.observedResult}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
