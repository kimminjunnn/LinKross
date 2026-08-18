"use client";

import { useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  GitFork,
  Link2,
  Loader2,
  LockKeyhole,
  Play,
  RotateCcw,
  Settings2,
  ShieldCheck,
  TestTube2,
  UserRound,
} from "lucide-react";

import {
  connectProjectRepositoryAction,
  decideMilestoneAction,
  requestVerificationRunAction,
} from "@/app/actions/verification";
import { StatusBadge } from "@/components/project/status-badge";
import {
  checklistStatusConfig,
  milestoneVerificationStatusConfig,
  type ChecklistStatus,
  type MilestoneVerificationStatus,
} from "@/config/verification-status";
import type {
  ProjectRepositoryRecord,
  VerificationMilestoneRecord,
  VerificationResultRecord,
  VerificationRunRecord,
  VerificationWorkspace,
} from "@/lib/backend";

type StatusTone = "neutral" | "brand" | "accent" | "success" | "warning" | "danger";

export function CompanyVerificationWorkspace({
  initialWorkspace,
}: {
  initialWorkspace: VerificationWorkspace;
}) {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(
    initialWorkspace.milestones[0]?.id ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const selectedMilestone =
    initialWorkspace.milestones.find((milestone) => milestone.id === selectedMilestoneId) ??
    initialWorkspace.milestones[0];

  function connectRepository(formData: FormData) {
    const repositoryUrl = String(formData.get("repositoryUrl") ?? "");
    startTransition(async () => {
      const result = await connectProjectRepositoryAction({
        projectId: initialWorkspace.projectId,
        repositoryUrl,
      });
      setMessage(result.ok ? "공식 저장소를 연결했습니다." : result.error.message);
    });
  }

  if (!selectedMilestone) {
    return (
      <div className="rounded-card border border-dashed border-app-border-strong bg-app-surface-subtle p-10 text-center">
        <p className="text-sm font-bold text-app-foreground">표시할 마일스톤이 없습니다.</p>
        <p className="mt-1.5 text-sm text-app-muted">
          승인된 SOW에 마일스톤이 추가되면 이 화면에서 검수할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <RepositorySummary
          repository={initialWorkspace.repository}
          pending={pending}
          connectRepository={connectRepository}
        />
        <VerificationSummary milestone={selectedMilestone} />
      </section>

      {message && (
        <p
          role="status"
          className="rounded-control border border-app-border bg-app-surface-subtle p-3 text-sm font-bold text-app-muted"
        >
          {message}
        </p>
      )}

      <section className="overflow-hidden rounded-card border border-app-border bg-app-surface shadow-card">
        <div className="border-b border-app-border bg-app-surface-subtle px-3 pt-3 sm:px-5 sm:pt-4">
          <div role="tablist" aria-label="마일스톤 선택" className="flex gap-2 overflow-x-auto pb-0">
            {initialWorkspace.milestones.map((milestone) => {
              const isSelected = milestone.id === selectedMilestone.id;
              const statusMeta = resolveMilestoneStatus(milestone);

              return (
                <button
                  key={milestone.id}
                  id={`milestone-tab-${milestone.code}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls={`milestone-panel-${milestone.code}`}
                  onClick={() => setSelectedMilestoneId(milestone.id)}
                  className={`group min-w-44 shrink-0 cursor-pointer rounded-t-control border border-b-0 px-4 py-3 text-left transition-colors sm:min-w-52 ${
                    isSelected
                      ? "border-app-border bg-app-surface text-app-foreground"
                      : "border-transparent text-app-muted hover:border-app-border hover:bg-app-surface/70 hover:text-app-foreground"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black">{milestone.code}</span>
                    <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
                  </span>
                  <span className="mt-1.5 block truncate text-xs font-bold">{milestone.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          id={`milestone-panel-${selectedMilestone.code}`}
          role="tabpanel"
          aria-labelledby={`milestone-tab-${selectedMilestone.code}`}
        >
          <MilestoneDetail
            projectId={initialWorkspace.projectId}
            milestone={selectedMilestone}
            sowVersionNumber={initialWorkspace.sowVersionNumber}
            repositoryConnected={Boolean(initialWorkspace.repository)}
            disabled={pending}
            run={(task) => startTransition(task)}
            setMessage={setMessage}
          />
        </div>
      </section>
    </>
  );
}

function RepositorySummary({
  repository,
  pending,
  connectRepository,
}: {
  repository: ProjectRepositoryRecord | null;
  pending: boolean;
  connectRepository: (formData: FormData) => void;
}) {
  return (
    <article className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-control bg-app-foreground text-white">
            <GitFork aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold tracking-[0.1em] text-brand-700 uppercase">
                Project repository
              </p>
              <StatusBadge tone={repository ? "success" : "neutral"}>
                {repository ? "연결 완료" : "연결 대기"}
              </StatusBadge>
            </div>
            {repository ? (
              <a
                href={repository.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex max-w-full items-center gap-2 truncate text-lg font-black text-app-foreground hover:text-brand-700"
              >
                {repository.owner}/{repository.name}
                <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
              </a>
            ) : (
              <>
                <h2 className="mt-2 truncate text-lg font-black text-app-foreground">저장소 미연결</h2>
                <p className="mt-1 text-sm leading-6 text-app-muted">
                  이 프로젝트의 PR과 Commit SHA만 검수 대상으로 제출할 수 있습니다.
                </p>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-control border border-app-border-strong bg-app-surface px-3 text-sm font-bold text-app-foreground opacity-60"
        >
          <Settings2 aria-hidden="true" className="size-4" />
          연결 관리
        </button>
      </div>

      <dl className="mt-5 grid gap-3 border-t border-app-border pt-4 sm:grid-cols-3">
        <RepositoryField
          label="기본 브랜치"
          value={repository?.defaultBranch ?? "-"}
          icon={<GitBranch className="size-4" />}
        />
        <RepositoryField
          label="권한"
          value={repository?.isPrivate ? "비공개" : "읽기 전용"}
          icon={<ShieldCheck className="size-4" />}
        />
        <RepositoryField
          label="연결 확인"
          value={repository?.companyConfirmedAt ? "발주자 확인 완료" : "아직 없음"}
          icon={<UserRound className="size-4" />}
        />
      </dl>

      {!repository && (
        <form
          action={connectRepository}
          className="mt-5 flex flex-col gap-2 border-t border-app-border pt-4 sm:flex-row"
        >
          <input
            name="repositoryUrl"
            type="url"
            required
            aria-label="공개 GitHub 저장소 주소"
            placeholder="https://github.com/owner/repository"
            className="min-h-11 min-w-0 flex-1 rounded-control border border-app-border-strong bg-app-surface px-3 text-sm"
          />
          <button
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-600 px-4 text-sm font-black text-white disabled:opacity-60"
          >
            {pending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            저장소 확인 및 연결
          </button>
        </form>
      )}
    </article>
  );
}

function VerificationSummary({ milestone }: { milestone: VerificationMilestoneRecord }) {
  const latestSubmission = milestone.submissions[0];
  const latestRun = latestSubmission?.runs[0];
  const submittedCount = latestSubmission?.claimedCriterionIds.length ?? 0;
  const verifiedCount =
    latestRun?.results.filter((result) => result.status !== "not_run").length ?? 0;
  const statusMeta = resolveMilestoneStatus(milestone);

  return (
    <article className="rounded-card border border-brand-200 bg-brand-50 p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold tracking-[0.1em] text-brand-700 uppercase">
          Verification summary
        </p>
        <TestTube2 aria-hidden="true" className="size-5 text-brand-700" />
      </div>
      <h2 className="mt-3 text-xl font-black text-app-foreground">
        {milestone.code} {statusMeta.label}
      </h2>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <SummaryMetric
          label="완료조건"
          value={String(milestone.checklist.length)}
          tone="text-app-foreground"
        />
        <SummaryMetric
          label="제출"
          value={String(submittedCount)}
          tone={submittedCount ? "text-brand-700" : "text-app-muted"}
        />
        <SummaryMetric
          label="검수"
          value={String(verifiedCount)}
          tone={verifiedCount ? "text-accent-800" : "text-app-muted"}
        />
      </div>
      <p className="mt-4 text-xs font-semibold leading-5 text-brand-700">
        {latestSubmission
          ? `PR #${latestSubmission.pullRequestNumber}의 Commit SHA를 기준으로 결과를 확인합니다.`
          : "PR이 제출되면 최신 전체 Commit SHA를 고정하고 검수를 시작합니다."}
      </p>
    </article>
  );
}

function MilestoneDetail({
  projectId,
  milestone,
  sowVersionNumber,
  repositoryConnected,
  disabled,
  run,
  setMessage,
}: {
  projectId: string;
  milestone: VerificationMilestoneRecord;
  sowVersionNumber: number | null;
  repositoryConnected: boolean;
  disabled: boolean;
  run: (task: () => Promise<void>) => void;
  setMessage: (message: string) => void;
}) {
  const latestSubmission = milestone.submissions[0];
  const latestRun = latestSubmission?.runs[0];
  const statusMeta = resolveMilestoneStatus(milestone);
  const resultsByCriterion = new Map(
    (latestRun?.results ?? []).map((result) => [result.criterionId, result]),
  );

  function requestRun() {
    if (!latestSubmission) return;
    run(async () => {
      const result = await requestVerificationRunAction({
        projectId,
        milestoneId: milestone.id,
        submissionId: latestSubmission.id,
        scope: "milestone",
      });
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
      setMessage(
        result.ok
          ? decision === "approved"
            ? "마일스톤을 승인했습니다."
            : "수정 요청을 기록했습니다."
          : result.error.message,
      );
    });
  }

  const runInProgress = latestRun
    ? ["queued", "provisioning", "installing", "building", "running"].includes(
        latestRun.status,
      )
    : false;

  return (
    <section className="bg-app-surface">
      <div className="p-5 sm:p-6">
        <MilestoneHeader
          milestone={milestone}
          sowVersion={sowVersionNumber ? `v${sowVersionNumber}` : "-"}
          statusLabel={statusMeta.label}
          statusTone={statusMeta.tone}
        />

        <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-card border border-brand-200 bg-brand-50 p-5">
            <div className="flex items-center gap-2 text-brand-700">
              <Link2 aria-hidden="true" className="size-5" />
              <h3 className="text-sm font-black">마일스톤 PR 제출</h3>
            </div>
            {latestSubmission ? (
              <div className="mt-5">
                <a
                  href={latestSubmission.pullRequestUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 font-black text-brand-700 hover:underline"
                >
                  PR #{latestSubmission.pullRequestNumber} · {latestSubmission.pullRequestTitle}
                  <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
                </a>
                <dl className="mt-4 space-y-3 text-xs">
                  <div>
                    <dt className="font-bold text-app-muted">고정된 Commit SHA</dt>
                    <dd className="mt-1 break-all font-mono font-bold text-app-foreground">
                      {latestSubmission.headCommitSha}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-app-muted">브랜치</dt>
                    <dd className="mt-1 font-bold text-app-foreground">
                      {latestSubmission.headBranch}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <>
                <label
                  htmlFor={`milestone-pr-url-${milestone.id}`}
                  className="mt-5 block text-xs font-bold text-app-foreground"
                >
                  GitHub PR 주소
                </label>
                <input
                  id={`milestone-pr-url-${milestone.id}`}
                  type="url"
                  disabled
                  placeholder={
                    repositoryConnected
                      ? "프리랜서의 PR 제출을 기다리고 있습니다"
                      : "저장소 연결 후 제출 가능합니다"
                  }
                  className="mt-2 min-h-11 w-full rounded-control border border-brand-200 bg-app-surface px-3 text-sm text-app-foreground opacity-60 placeholder:text-app-muted/70"
                />
              </>
            )}
            <p className="mt-3 text-xs leading-5 text-brand-700">
              연결된 저장소의 PR만 제출할 수 있습니다. 제출 시 PR의 최신 전체 Commit SHA를
              고정합니다.
            </p>
          </div>

          <div className="rounded-card border border-app-border bg-app-surface-subtle p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-app-foreground">SOW에서 가져온 완료조건</h3>
              <span className="text-xs font-bold text-app-muted">
                {latestSubmission?.claimedCriterionIds.length ?? 0}/{milestone.checklist.length} 제출
              </span>
            </div>
            {milestone.checklist.length === 0 ? (
              <p className="mt-4 text-xs leading-5 text-app-muted">
                이 마일스톤엔 등록된 완료조건이 없습니다.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {milestone.checklist.map((criterion, index) => {
                  const result = resultsByCriterion.get(criterion.id);
                  const criterionStatus = resolveCriterionStatus(
                    result,
                    latestSubmission?.claimedCriterionIds.includes(criterion.id) ?? false,
                  );
                  return (
                    <li
                      key={criterion.id}
                      className="flex items-start gap-3 rounded-control border border-app-border bg-app-surface p-3"
                    >
                      <span className="grid size-6 shrink-0 place-items-center rounded-pill border border-app-border text-[0.65rem] font-black text-app-muted">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold leading-5 text-app-foreground">
                          {criterion.description}
                        </p>
                        <p className="mt-1 text-xs text-app-muted">
                          {criterion.verificationMethod}
                        </p>
                        {result?.observedResult && (
                          <p className="mt-2 text-xs leading-5 text-app-muted">
                            {result.observedResult}
                          </p>
                        )}
                      </div>
                      <StatusBadge tone={criterionStatus.tone}>
                        {criterionStatus.label}
                      </StatusBadge>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-control border border-app-border bg-app-surface-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs leading-5 text-app-muted">
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-warning"
            />
            {latestSubmission
              ? `Commit ${shortSha(latestSubmission.headCommitSha)} 기준으로 마일스톤 전체를 검수합니다.`
              : repositoryConnected
                ? "프리랜서가 PR을 제출하면 마일스톤 전체 검수를 요청할 수 있습니다."
                : "저장소가 아직 연결되지 않아 PR과 Commit SHA를 제출할 수 없습니다."}
          </div>
          <button
            type="button"
            disabled={disabled || !latestSubmission || runInProgress}
            onClick={requestRun}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-control bg-brand-500 px-4 text-sm font-black text-white disabled:border disabled:border-app-border disabled:bg-app-surface disabled:text-app-muted disabled:opacity-60"
          >
            {disabled && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {!disabled && <Play aria-hidden="true" className="size-4" />}
            {runInProgress ? "Runner 연결 대기" : "마일스톤 전체 검수"}
          </button>
        </div>

        {latestSubmission && (
          <div className="mt-5 space-y-4 border-t border-app-border pt-5">
            {latestSubmission.runs.length > 0 && (
              <section aria-label="검수 실행 결과" className="space-y-3">
                <h3 className="text-sm font-black text-app-foreground">검수 실행 결과</h3>
                {latestSubmission.runs.map((verificationRun) => (
                  <RunResult key={verificationRun.id} run={verificationRun} />
                ))}
              </section>
            )}

            <form
              action={decide}
              className="grid gap-3 rounded-control bg-app-surface-subtle p-4 sm:grid-cols-[1fr_auto_auto]"
            >
              <input
                name="reason"
                placeholder="수정 요청 사유 (수정 요청 시 필수)"
                className="min-h-10 rounded-control border border-app-border-strong bg-app-surface px-3 text-sm"
              />
              <button
                name="decision"
                value="revision_required"
                disabled={disabled}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-app-border-strong px-4 text-sm font-black text-app-foreground disabled:opacity-50"
              >
                <RotateCcw aria-hidden="true" className="size-4" />
                수정 요청
              </button>
              <button
                name="decision"
                value="approved"
                disabled={
                  disabled ||
                  !latestRun ||
                  !["passed", "needs_review"].includes(latestRun.status)
                }
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-accent-600 px-4 text-sm font-black text-white disabled:opacity-50"
              >
                <CheckCircle2 aria-hidden="true" className="size-4" />
                최종 승인
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

function MilestoneHeader({
  milestone,
  sowVersion,
  statusLabel,
  statusTone,
}: {
  milestone: VerificationMilestoneRecord;
  sowVersion: string;
  statusLabel: string;
  statusTone: StatusTone;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-black text-brand-700">{milestone.code}</span>
          <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-app-muted">
            <LockKeyhole aria-hidden="true" className="size-3.5" />
            SOW {sowVersion} 승인 기준
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-app-foreground">
          {milestone.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-app-muted">
          {milestone.description ??
            "프리랜서가 이 마일스톤의 통합 PR을 제출하면 검수 대상 SHA를 자동으로 확인합니다."}
        </p>
      </div>
      <dl className="grid min-w-72 grid-cols-2 gap-4 rounded-control border border-app-border bg-app-surface-subtle p-4 text-xs">
        <div>
          <dt className="font-semibold text-app-muted">기간</dt>
          <dd className="mt-1 font-black text-app-foreground">
            {milestone.startDate} ~ {milestone.endDate}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-app-muted">승인 예정 금액</dt>
          <dd className="mt-1 font-black text-app-foreground">
            {milestone.amount.toLocaleString()} {milestone.currency}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function RunResult({ run }: { run: VerificationRunRecord }) {
  const status = resolveRunStatus(run.status);

  return (
    <div className="rounded-control border border-app-border bg-app-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-black text-app-foreground">검수 #{run.attemptNumber}</p>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>
      {run.status === "queued" && (
        <p className="mt-2 text-sm text-app-muted">
          요청은 저장됐습니다. 격리 Runner가 이 실행을 가져가야 실제 결과가 생성됩니다.
        </p>
      )}
      {run.errorSummary && <p className="mt-2 text-sm text-red-700">{run.errorSummary}</p>}
      {run.previewUrl && (
        <a
          href={run.previewUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline"
        >
          Preview 열기
          <ExternalLink aria-hidden="true" className="size-3.5" />
        </a>
      )}
    </div>
  );
}

function resolveMilestoneStatus(milestone: VerificationMilestoneRecord): {
  label: string;
  tone: StatusTone;
} {
  if (milestone.decision?.decision === "approved") {
    return milestoneVerificationStatusConfig.approved;
  }
  if (milestone.decision?.decision === "revision_required") {
    return milestoneVerificationStatusConfig.revision_required;
  }

  const latestRun = milestone.submissions[0]?.runs[0];
  if (
    latestRun &&
    ["queued", "provisioning", "installing", "building", "running"].includes(
      latestRun.status,
    )
  ) {
    return milestoneVerificationStatusConfig.verification_running;
  }
  if (milestone.submissions.length > 0) {
    return milestoneVerificationStatusConfig.verification_ready;
  }

  return (
    milestoneVerificationStatusConfig[milestone.status as MilestoneVerificationStatus] ??
    milestoneVerificationStatusConfig.submission_required
  );
}

function resolveCriterionStatus(
  result: VerificationResultRecord | undefined,
  isClaimed: boolean,
): { label: string; tone: StatusTone } {
  const key: ChecklistStatus = result
    ? result.status === "not_run"
      ? isClaimed
        ? "submitted"
        : "not_submitted"
      : result.status
    : isClaimed
      ? "submitted"
      : "not_submitted";
  return checklistStatusConfig[key];
}

function resolveRunStatus(status: VerificationRunRecord["status"]): {
  label: string;
  tone: StatusTone;
} {
  if (["queued", "provisioning", "installing", "building"].includes(status)) {
    return { label: status === "queued" ? "대기" : "준비 중", tone: "neutral" };
  }
  if (status === "running") return { label: "검수 중", tone: "accent" };
  if (status === "passed") return { label: "통과", tone: "success" };
  if (status === "needs_review") return { label: "확인 필요", tone: "warning" };
  if (status === "failed") return { label: "실패", tone: "danger" };
  if (status === "timed_out") return { label: "시간 초과", tone: "danger" };
  return { label: "취소됨", tone: "neutral" };
}

function RepositoryField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-semibold text-app-muted">
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-black text-app-foreground">{value}</dd>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-control border border-brand-200 bg-app-surface/80 px-2 py-3">
      <p className={`text-2xl font-black ${tone}`}>{value}</p>
      <p className="mt-1 text-[0.7rem] font-bold text-app-muted">{label}</p>
    </div>
  );
}

function shortSha(sha: string) {
  return sha.slice(0, 7);
}
