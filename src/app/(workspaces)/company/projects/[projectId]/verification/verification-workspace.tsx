"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  Square,
  ShieldCheck,
  TestTube2,
  UserRound,
  Sparkles,
  Check,
  Clock,
  UserCheck,
  X,
  XCircle,
  CreditCard,
  ArrowRight,
} from "lucide-react";

import {
  connectProjectRepositoryAction,
  decideCriterionManuallyAction,
  decideMilestoneAction,
  cancelVerificationRunAction,
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

const ACTIVE_RUN_STATUSES: VerificationRunRecord["status"][] = [
  "queued",
  "provisioning",
  "installing",
  "building",
  "running",
];

function LinKrossMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="35 25 70 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path d="M70 85L93 45" stroke="#F97316" strokeWidth="12" strokeLinecap="round" />
      <path
        d="M47 75L70 35L93 75"
        stroke="#0F172A"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M47 45L70 85" stroke="#F97316" strokeWidth="12" strokeLinecap="round" />
    </svg>
  );
}

function VerificationLoadingOverlay({
  milestoneLabel,
  onDismiss,
  onCancel,
  cancelling,
}: {
  milestoneLabel: string;
  onDismiss: () => void;
  onCancel?: () => void;
  cancelling: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className="flex flex-col items-center gap-4 rounded-3xl bg-white p-10 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <LinKrossMark className="size-14 animate-lk-mark-flow" />
        <p className="text-xl font-semibold text-slate-900">격리 환경에서 검수 중입니다...</p>
        <p className="max-w-xs text-center text-sm text-slate-500">
          {milestoneLabel} 설치·빌드·테스트를 실행하고 있습니다. 완료되면 이 화면이 자동으로 갱신됩니다.
        </p>
        <div className="mt-1 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="cursor-pointer text-xs text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
          >
            닫고 계속 둘러보기
          </button>
          {onCancel && (
            <button
              type="button"
              disabled={cancelling}
              onClick={onCancel}
              className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-control border border-app-border-strong px-3 text-xs font-semibold text-app-foreground hover:bg-app-surface-subtle disabled:opacity-50"
            >
              {cancelling ? <Loader2 aria-hidden="true" className="size-3.5 animate-spin" /> : <Square aria-hidden="true" className="size-3.5" />}
              검수 중단
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectTimeline({
  milestones,
  selectedMilestoneId,
  onSelectMilestone,
}: {
  milestones: VerificationMilestoneRecord[];
  selectedMilestoneId: string;
  onSelectMilestone: (id: string) => void;
}) {
  const approvedCount = milestones.filter(m => m.decision?.decision === "approved").length;
  const totalCount = milestones.length;
  const progressPercent = totalCount > 1 
    ? (approvedCount / (totalCount - 1)) * 100 
    : 0;

  return (
    <div className="mb-6 rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
      <h3 className="text-xs font-semibold tracking-[0.1em] text-app-muted uppercase mb-4">
        프로젝트 마일스톤 진행상황도
      </h3>
      <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-start md:gap-4">
        {/* 연결 선 (가로) - MD 이상에서만 보임 */}
        <div className="absolute left-6 right-6 top-6 hidden h-0.5 bg-slate-200 md:block">
          <div 
            className="h-full bg-success-500 transition-all duration-500" 
            style={{ width: `${progressPercent}%` }} 
          />
        </div>

        {milestones.map((milestone) => {
          const isSelected = milestone.id === selectedMilestoneId;
          const statusMeta = resolveMilestoneStatus(milestone);
          const isApproved = milestone.decision?.decision === "approved";
          const isRevisionRequired = milestone.decision?.decision === "revision_required";
          const latestRunStatus = milestone.submissions[0]?.runs[0]?.status;
          const isRunning =
            latestRunStatus !== undefined && ACTIVE_RUN_STATUSES.includes(latestRunStatus);

          let stepBg = "bg-app-surface border-app-border text-app-muted";
          let icon = <span className="text-xs">{milestone.code}</span>;

          if (isApproved) {
            stepBg = "bg-success-500 border-success-600 text-white shadow-sm shadow-success-500/25";
            icon = <Check className="size-4 stroke-[3]" />;
          } else if (isRevisionRequired) {
            stepBg = "bg-amber-500 border-amber-600 text-white shadow-sm shadow-amber-500/25";
            icon = <RotateCcw className="size-4" />;
          } else if (isRunning) {
            stepBg = "bg-brand-500 border-brand-600 text-white animate-pulse shadow-md shadow-brand-500/30";
            icon = <Play className="size-4 fill-white text-white" />;
          } else if (isSelected) {
            stepBg = "bg-app-surface border-brand-500 text-brand-600 ring-4 ring-brand-500/10 shadow-xs";
            icon = <span className="text-xs font-black">{milestone.code}</span>;
          }

          return (
            <button
              key={milestone.id}
              type="button"
              onClick={() => onSelectMilestone(milestone.id)}
              className="group relative z-10 flex flex-1 cursor-pointer flex-col items-center text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
            >
              {/* 스텝 서클 */}
              <div className={`grid size-12 place-items-center rounded-pill border-2 transition-all duration-300 group-hover:scale-105 ${stepBg}`}>
                {icon}
              </div>

              {/* 정보 텍스트 */}
              <div className="mt-3">
                <p className={`text-xs transition-colors ${isSelected ? "text-brand-700" : "text-app-foreground group-hover:text-brand-600"}`}>
                  {milestone.title}
                </p>
                <p className="mt-0.5 text-xs text-app-muted">
                  {milestone.amount.toLocaleString()} {milestone.currency}
                </p>
                <div className="mt-1">
                  <span className={`inline-flex items-center rounded-pill px-1.5 py-0.5 text-xs font-semibold ${
                    isApproved ? "bg-success-50 text-success-700" :
                    isRevisionRequired ? "bg-warning-50 text-warning-700" :
                    isRunning ? "bg-brand-50 text-brand-700" : "bg-app-surface-subtle text-app-muted"
                  }`}>
                    {statusMeta.label}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CompanyVerificationWorkspace({
  initialWorkspace,
  initialMessage = null,
}: {
  initialWorkspace: VerificationWorkspace;
  initialMessage?: string | null;
}) {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(
    initialWorkspace.milestones[0]?.id ?? "",
  );
  const [message, setMessage] = useState<string | null>(initialMessage);
  const [pending, startTransition] = useTransition();
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const [verifyingLabel, setVerifyingLabel] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const wasRunningRef = useRef(false);
  const selectedMilestone =
    initialWorkspace.milestones.find((milestone) => milestone.id === selectedMilestoneId) ??
    initialWorkspace.milestones[0];

  const runningMilestone = useMemo(
    () =>
      initialWorkspace.milestones.find((milestone) => {
        const latestRunStatus = milestone.submissions[0]?.runs[0]?.status;
        return latestRunStatus !== undefined && ACTIVE_RUN_STATUSES.includes(latestRunStatus);
      }) ?? null,
    [initialWorkspace.milestones],
  );
  // 검수를 동기 대기로 처리하므로, 방금 누른 탭 자신은 initialWorkspace가
  // 갱신되기 전까지 anyRunInProgress를 못 잡는다. verifyingLabel이 그 공백을 메운다.
  const anyRunInProgress = runningMilestone !== null || verifyingLabel !== null;
  const runningRunId = runningMilestone?.submissions[0]?.runs[0]?.id ?? null;
  const overlayLabel = verifyingLabel ?? (runningMilestone ? `${runningMilestone.code} · ${runningMilestone.title}` : "");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const isDismissed = localStorage.getItem(
        `lk-welcome-dismissed-${initialWorkspace.projectId}`,
      );
      setShowWelcome(!isDismissed && !initialWorkspace.repository);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialWorkspace.projectId, initialWorkspace.repository]);

  useEffect(() => {
    if (!anyRunInProgress) return;

    const interval = window.setInterval(() => router.refresh(), 4000);
    return () => window.clearInterval(interval);
  }, [anyRunInProgress, router]);

  useEffect(() => {
    if (anyRunInProgress && !wasRunningRef.current) setOverlayDismissed(false);
    wasRunningRef.current = anyRunInProgress;
  }, [anyRunInProgress]);

  function handleDismissWelcome() {
    localStorage.setItem(`lk-welcome-dismissed-${initialWorkspace.projectId}`, "true");
    setShowWelcome(false);
  }

  function cancelRun(runId: string) {
    setCancelling(true);
    startTransition(async () => {
      try {
        const result = await cancelVerificationRunAction({
          projectId: initialWorkspace.projectId,
          runId,
        });
        setMessage(result.ok ? "검수를 중단했습니다." : result.error.message);
        if (result.ok) {
          setVerifyingLabel(null);
          setOverlayDismissed(true);
        }
      } finally {
        setCancelling(false);
      }
    });
  }

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
        <p className="text-sm text-app-foreground">표시할 마일스톤이 없습니다.</p>
        <p className="mt-1.5 text-sm text-app-muted">
          승인된 SOW에 마일스톤이 추가되면 이 화면에서 검수할 수 있습니다.
        </p>
      </div>
    );
  }

  if (showWelcome) {
    const sowVersion = initialWorkspace.sowVersionNumber ? `v${initialWorkspace.sowVersionNumber}` : "-";
    return (
      <button
        type="button"
        onClick={handleDismissWelcome}
        className="group mx-auto my-12 block w-full max-w-4xl cursor-pointer rounded-card border border-brand-100 bg-gradient-to-br from-brand-50 via-indigo-50/50 to-violet-50/30 p-8 text-left shadow-sm transition-all duration-300 hover:border-brand-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600 sm:p-10"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="grid size-16 shrink-0 place-items-center rounded-pill bg-brand-100 text-brand-700 shadow-inner group-hover:scale-110 transition-transform">
            <Sparkles className="size-8 text-brand-600 animate-pulse" />
          </span>
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-pill bg-brand-100/70 px-3 py-1 text-xs font-semibold text-brand-800 uppercase tracking-wider mb-2">
              🎉 Kickoff Ready
            </div>
            <h2 className="text-2xl font-bold text-app-foreground flex items-center gap-2">
              최종 업무명세서(SOW {sowVersion}) 확정 완료!
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-app-muted">
              발주자님과 프리랜서님의 상호 합의 하에 최종 SOW가 공식 승인되었습니다.<br />
              이 카드를 클릭하시면 <strong>업무명세서 확인 및 마일스톤 검수 대시보드</strong>로 이동합니다. 먼저 <strong>GitHub 저장소</strong>를 연결해 프로젝트를 시작해 보세요!
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-brand-700 group-hover:translate-x-1.5 transition-transform duration-300">
              대시보드로 진입하여 시작하기
              <ArrowRight className="size-4" />
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <>
      {anyRunInProgress && !overlayDismissed && (
        <VerificationLoadingOverlay
          milestoneLabel={overlayLabel}
          onDismiss={() => setOverlayDismissed(true)}
          onCancel={runningRunId ? () => cancelRun(runningRunId) : undefined}
          cancelling={cancelling}
        />
      )}

      <ProjectTimeline
        milestones={initialWorkspace.milestones}
        selectedMilestoneId={selectedMilestone.id}
        onSelectMilestone={setSelectedMilestoneId}
      />

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <RepositorySummary
          projectId={initialWorkspace.projectId}
          repository={initialWorkspace.repository}
          pending={pending}
          connectRepository={connectRepository}
        />
        <VerificationSummary milestone={selectedMilestone} />
      </section>

      {message && (
        <p
          role="status"
          className="rounded-control border border-app-border bg-app-surface-subtle p-3 text-sm text-app-muted"
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
                    <span className="text-sm">{milestone.code}</span>
                    <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
                  </span>
                  <span className="mt-1.5 block truncate text-xs">{milestone.title}</span>
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
            setVerifyingLabel={setVerifyingLabel}
            onReopenOverlay={() => setOverlayDismissed(false)}
          />
        </div>
      </section>
    </>
  );
}

function RepositorySummary({
  projectId,
  repository,
  pending,
  connectRepository,
}: {
  projectId: string;
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
              <p className="text-xs font-semibold tracking-[0.1em] text-brand-700 uppercase">
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
                className="mt-2 inline-flex max-w-full items-center gap-2 truncate text-lg font-semibold text-app-foreground hover:text-brand-700"
              >
                {repository.owner}/{repository.name}
                <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
              </a>
            ) : (
              <>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center rounded-pill bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                    Step 1
                  </span>
                  <h2 className="truncate text-lg font-semibold text-app-foreground">저장소 연결하기</h2>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-app-muted">
                  프리랜서가 제출할 PR과 Commit SHA를 안전한 가상 환경에서 빌드·검수하기 위해 <strong>GitHub 저장소 링크</strong>를 연결해 주세요.
                </p>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-control border border-app-border-strong bg-app-surface px-3 text-sm font-semibold text-app-foreground opacity-60"
        >
          <Settings2 aria-hidden="true" className="size-4" />
          연결 관리
        </button>
      </div>

      <dl className="mt-5 grid gap-3 border-t border-app-border pt-4 sm:grid-cols-3">
        <RepositoryField
          label="기본 브랜치"
          value={
            repository?.defaultBranch ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-800">
                {repository.defaultBranch}
              </span>
            ) : (
              "-"
            )
          }
          icon={<GitBranch className="size-3.5 text-slate-400" />}
        />
        <RepositoryField
          label="권한"
          value={
            repository ? (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                repository.isPrivate 
                  ? "bg-amber-50 text-amber-700 border border-amber-250/20" 
                  : "bg-slate-50 text-slate-600 border border-slate-200/50"
              }`}>
                {repository.isPrivate ? "비공개" : "읽기 전용"}
              </span>
            ) : (
              "-"
            )
          }
          icon={<ShieldCheck className="size-3.5 text-slate-400" />}
        />
        <RepositoryField
          label="연결 확인"
          value={
            repository ? (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                repository.companyConfirmedAt 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : "bg-slate-50 text-slate-500 border border-slate-200/50"
              }`}>
                <span className={`size-1.5 rounded-full ${repository.companyConfirmedAt ? "bg-green-500" : "bg-slate-450"}`} />
                {repository.companyConfirmedAt ? "발주자 확인 완료" : "확인 대기"}
              </span>
            ) : (
              "-"
            )
          }
          icon={<UserRound className="size-3.5 text-slate-400" />}
        />
      </dl>

      {!repository && (
        <div className="mt-5 space-y-3 border-t border-app-border pt-4">
          <div className="flex flex-col gap-3 rounded-control border border-brand-200 bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-app-foreground">1. GitHub App 설치</p>
              <p className="mt-1 text-xs leading-5 text-app-muted">
                검수할 저장소만 선택하고 Contents와 Pull requests 읽기 권한을 허용합니다.
              </p>
            </div>
            <a
              href={`/api/github/app/install?projectId=${encodeURIComponent(projectId)}`}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-control bg-app-foreground px-4 text-sm font-semibold text-white transition-colors hover:opacity-90 cursor-pointer"
            >
              <LockKeyhole aria-hidden="true" className="size-3.5 !text-white" />
              <span className="!text-white">GitHub App 설치</span>
            </a>
          </div>

          <form action={connectRepository} className="flex flex-col gap-2 sm:flex-row">
            <input
              name="repositoryUrl"
              type="url"
              required
              aria-label="GitHub 저장소 주소"
              placeholder="https://github.com/owner/repository"
              className="min-h-11 min-w-0 flex-1 rounded-control border border-app-border-strong bg-app-surface px-3 text-sm focus:border-brand-500 focus:outline-none"
            />
            <button
              disabled={pending}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-control bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {pending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              2. 저장소 확인 및 연결
            </button>
          </form>

          <div className="rounded-control border border-app-border bg-app-surface-subtle p-4">
            <h4 className="text-xs font-semibold text-app-foreground flex items-center gap-1.5">
              💡 비개발자 PO님을 위한 팁
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-app-muted">
              GitHub 저장소는 결과물 코드를 보관하고 검수할 대상을 정하는 공간입니다. 위에서
              GitHub App을 설치한 뒤, 설치 대상으로 선택한 저장소 주소를 입력해 주세요.
            </p>
          </div>
        </div>
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
        <p className="text-xs font-semibold tracking-[0.1em] text-brand-700 uppercase">
          Verification summary
        </p>
        <TestTube2 aria-hidden="true" className="size-5 text-brand-700" />
      </div>
      <h2 className="mt-3 text-xl font-semibold text-app-foreground">
        {milestone.code} {statusMeta.label}
      </h2>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <SummaryMetric
          label="완료조건"
          value={String(milestone.checklist.length)}
          tone="text-app-foreground"
          icon={<Clock className="size-7 stroke-[1]" />}
        />
        <SummaryMetric
          label="제출"
          value={String(submittedCount)}
          tone={submittedCount ? "text-brand-600" : "text-app-muted"}
          icon={<ExternalLink className="size-7 stroke-[1]" />}
        />
        <SummaryMetric
          label="검수"
          value={String(verifiedCount)}
          tone={verifiedCount ? "text-accent-600" : "text-app-muted"}
          icon={<ShieldCheck className="size-7 stroke-[1]" />}
        />
      </div>
      <p className="mt-4 text-xs leading-5 text-brand-700">
        {latestSubmission
          ? `PR #${latestSubmission.pullRequestNumber}의 Commit SHA를 기준으로 결과를 확인합니다.`
          : "PR이 제출되면 최신 전체 Commit SHA가 고정됩니다. 검수는 발주자가 시작합니다."}
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
  setVerifyingLabel,
  onReopenOverlay,
}: {
  projectId: string;
  milestone: VerificationMilestoneRecord;
  sowVersionNumber: number | null;
  repositoryConnected: boolean;
  disabled: boolean;
  run: (task: () => Promise<void>) => void;
  setMessage: (message: string) => void;
  setVerifyingLabel: (label: string | null) => void;
  onReopenOverlay: () => void;
}) {
  const latestSubmission = milestone.submissions[0];
  const latestRun = latestSubmission?.runs[0];
  const statusMeta = resolveMilestoneStatus(milestone);
  const resultsByCriterion = new Map(
    (latestRun?.results ?? []).map((result) => [result.criterionId, result]),
  );

  function requestRun() {
    if (!latestSubmission) return;
    // startTransition 안에서 첫 줄로 set하면 React가 트랜지션 업데이트로 묶어
    // 즉시 반영하지 않을 수 있다(새로고침해야 보이는 버그). 트랜지션 밖에서
    // 동기적으로 먼저 켜서 클릭 즉시 뜨게 한다.
    setVerifyingLabel(`${milestone.code} · ${milestone.title}`);
    run(async () => {
      try {
        const result = await requestVerificationRunAction({
          projectId,
          milestoneId: milestone.id,
          submissionId: latestSubmission.id,
          scope: "milestone",
        });
        setMessage(result.ok ? "격리 환경에서 검수가 완료됐습니다. 아래에서 결과를 확인하세요." : result.error.message);
      } finally {
        setVerifyingLabel(null);
      }
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

  const runInProgress = latestRun ? ACTIVE_RUN_STATUSES.includes(latestRun.status) : false;
  // 어떤 완료조건을 어느 쪽으로 판정하려는지. 사유 없이 뒤집으면 증빙에 근거가
  // 남지 않으므로 버튼을 누르면 바로 저장하지 않고 사유 입력을 먼저 연다.
  const [manualTarget, setManualTarget] = useState<
    { criterionId: string; decision: "passed" | "failed" } | null
  >(null);

  function submitManualDecision(formData: FormData) {
    if (!latestRun || !manualTarget) return;
    const reason = String(formData.get("manualReason") ?? "").trim();
    if (!reason) {
      setMessage("판정 사유를 입력해주세요.");
      return;
    }
    const target = manualTarget;
    setManualTarget(null);
    run(async () => {
      const result = await decideCriterionManuallyAction({
        projectId,
        runId: latestRun.id,
        criterionId: target.criterionId,
        decision: target.decision,
        reason,
      });
      setMessage(
        result.ok
          ? target.decision === "passed"
            ? "완료조건을 통과로 판정했습니다. 자동 판정 결과는 그대로 보존됩니다."
            : "완료조건을 실패로 판정했습니다. 자동 판정 결과는 그대로 보존됩니다."
          : result.error.message,
      );
    });
  }

  return (
    <section className="bg-app-surface">
      <div className="p-5 sm:p-6">
        <MilestoneHeader
          milestone={milestone}
          sowVersion={sowVersionNumber ? `v${sowVersionNumber}` : "-"}
          statusLabel={statusMeta.label}
          statusTone={statusMeta.tone}
        />

        <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          {/* 왼쪽: 프리랜서 작업 제출 현황판 */}
          <div className={`rounded-card border p-5 ${latestSubmission ? "border-brand-200 bg-brand-50/20" : "border-dashed border-app-border-strong bg-app-surface-subtle"}`}>
            <div className="flex items-center gap-2 text-brand-700">
              <Link2 aria-hidden="true" className="size-5" />
              <h3 className="text-sm font-semibold">프리랜서 작업 제출 현황</h3>
            </div>
            
            {latestSubmission ? (
              <div className="mt-5 space-y-4">
                <div>
                  <a
                    href={latestSubmission.pullRequestUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 font-semibold text-brand-700 hover:underline text-sm"
                  >
                    PR #{latestSubmission.pullRequestNumber} · {latestSubmission.pullRequestTitle}
                    <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
                  </a>
                </div>

                <dl className="grid grid-cols-2 gap-3 border-t border-brand-100 pt-3 text-xs">
                  <div>
                    <dt className="text-app-muted">고정된 Commit SHA</dt>
                    <dd className="mt-1 break-all font-mono text-app-foreground">
                      {shortSha(latestSubmission.headCommitSha)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-app-muted">브랜치 / 제출 시각</dt>
                    <dd className="mt-1 text-app-foreground">
                      {latestSubmission.headBranch} <br />
                      <span className="text-xs text-app-muted">
                        {new Date(latestSubmission.submittedAt).toLocaleString("ko-KR")}
                      </span>
                    </dd>
                  </div>
                </dl>

                {latestSubmission.implementationNote && (
                  <div className="border-t border-brand-100 pt-3">
                    <p className="text-xs text-app-muted mb-1.5">프리랜서 구현 코멘트</p>
                    <blockquote className="rounded-control bg-app-surface p-3 border border-app-border text-xs leading-relaxed text-app-foreground">
                      {latestSubmission.implementationNote}
                    </blockquote>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 text-center py-4">
                <Clock className="size-8 mx-auto text-app-muted/60 animate-pulse" />
                <p className="mt-3 text-xs text-app-foreground">프리랜서가 작업을 진행 중입니다</p>
                <p className="mt-1 text-xs text-app-muted">
                  개발자가 PR을 제출하고 검수를 요청하면 이곳에 제출 상태와 구현 의견이 자동으로 업데이트됩니다.
                </p>
              </div>
            )}
          </div>

          {/* 오른쪽: SOW 완료조건 및 원본 보기 링크 */}
          <div className="rounded-card border border-app-border bg-app-surface-subtle p-5">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-app-border">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-app-foreground">SOW 완료조건</h3>
                <span className="text-xs text-app-muted bg-app-surface border border-app-border px-1.5 py-0.5 rounded-pill">
                  {latestSubmission?.claimedCriterionIds.length ?? 0}/{milestone.checklist.length} 제출
                </span>
              </div>
              <a
                href={`/company/projects/${projectId}/sow`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
              >
                SOW 원본 보기
                <ExternalLink aria-hidden="true" className="size-3" />
              </a>
            </div>

            {milestone.checklist.length === 0 ? (
              <p className="mt-4 text-xs leading-5 text-app-muted">
                이 마일스톤엔 등록된 완료조건이 없습니다.
              </p>
            ) : (
              <ul className="mt-4 space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {milestone.checklist.map((criterion, index) => {
                  const result = resultsByCriterion.get(criterion.id);
                  const criterionStatus = resolveCriterionView(
                    result,
                    latestSubmission?.claimedCriterionIds.includes(criterion.id) ?? false,
                  );
                  const decisionOptions = runInProgress || !latestRun
                    ? []
                    : manualDecisionOptions(result?.status, result?.manualDecision ?? null);
                  const editing = manualTarget?.criterionId === criterion.id;
                  return (
                    <li
                      key={criterion.id}
                      className="flex items-start gap-3 rounded-control border border-app-border bg-app-surface p-3"
                    >
                      <span className="grid size-6 shrink-0 place-items-center rounded-pill border border-app-border text-xs text-app-muted">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs leading-relaxed text-app-foreground">
                          {criterion.description}
                        </p>
                        <p className="mt-0.5 text-xs text-app-muted">
                          방법: {criterion.verificationMethod}
                        </p>
                        {criterion.manualGuidance && (
                          <div className="mt-1.5 space-y-0.5 text-xs leading-relaxed text-app-muted bg-app-surface-subtle p-1.5 rounded border border-app-border-strong/50">
                            <p><span className="text-app-foreground">확인 위치</span> · {criterion.manualGuidance.location}</p>
                            <p><span className="text-app-foreground">확인 방법</span> · {criterion.manualGuidance.method}</p>
                            <p><span className="text-app-foreground">기대 결과</span> · {criterion.manualGuidance.expected}</p>
                          </div>
                        )}
                        {result?.observedResult && (
                          <p className="mt-1.5 text-xs leading-relaxed text-app-muted bg-app-surface-subtle p-1.5 rounded border border-app-border-strong/50 font-mono">
                            {result.observedResult}
                          </p>
                        )}
                        {result?.errorMessage && (
                          <p className="mt-2 text-xs leading-5 text-red-700">
                            {result.errorMessage}
                          </p>
                        )}
                        {criterionStatus.manual && (
                          <div className="mt-2 rounded border border-app-border-strong/50 bg-app-surface-subtle p-2 text-xs leading-relaxed">
                            <p className="font-semibold text-app-foreground">
                              발주자가 직접 판정 ·{" "}
                              {formatMoment(criterionStatus.manual.decidedAt) ?? "시점 미상"}
                            </p>
                            <p className="mt-0.5 text-app-muted">
                              자동 판정{" "}
                              {criterionStatus.manual.automatedStatus
                                ? checklistStatusConfig[
                                    criterionStatus.manual.automatedStatus as ChecklistStatus
                                  ].label
                                : "없음"}
                              {" → "}
                              {checklistStatusConfig[criterionStatus.manual.decision].label}
                            </p>
                            <p className="mt-0.5 whitespace-pre-wrap text-app-muted">
                              사유: {criterionStatus.manual.reason}
                            </p>
                          </div>
                        )}
                        {result?.evidence.some((artifact) => artifact.url) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {result.evidence.map((artifact) =>
                              artifact.url ? (
                                <a
                                  key={artifact.id}
                                  href={artifact.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-pill border border-app-border px-2.5 py-1 text-xs font-semibold text-brand-700 hover:border-brand-300 hover:bg-brand-50"
                                >
                                  {evidenceLabel(artifact.type)}
                                  <ExternalLink aria-hidden="true" className="size-3" />
                                </a>
                              ) : null,
                            )}
                          </div>
                        )}
                        {editing ? (
                          <form
                            action={submitManualDecision}
                            className="mt-2 rounded border border-brand-200 bg-brand-50/40 p-2"
                          >
                            <label
                              htmlFor={`manual-reason-${criterion.id}`}
                              className="text-xs font-semibold text-app-foreground"
                            >
                              {manualTarget?.decision === "passed" ? "통과" : "실패"}로 판정하는 사유
                            </label>
                            <textarea
                              id={`manual-reason-${criterion.id}`}
                              name="manualReason"
                              required
                              autoFocus
                              disabled={disabled}
                              placeholder="Preview에서 무엇을 확인했는지 적어주세요. 통합 증빙에 그대로 남습니다."
                              className="mt-1.5 min-h-16 w-full rounded-control border border-app-border-strong bg-app-surface p-2 text-xs focus:border-brand-500 focus:outline-none disabled:opacity-50"
                            />
                            <div className="mt-1.5 flex gap-1.5">
                              <button
                                disabled={disabled}
                                className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-control bg-brand-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Check aria-hidden="true" className="size-3.5" />
                                판정 저장
                              </button>
                              <button
                                type="button"
                                onClick={() => setManualTarget(null)}
                                className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-control border border-app-border-strong px-3 text-xs font-semibold text-app-foreground transition-colors hover:bg-app-surface-subtle disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <X aria-hidden="true" className="size-3.5" />
                                취소
                              </button>
                            </div>
                          </form>
                        ) : decisionOptions.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {decisionOptions.includes("passed") ? (
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() =>
                                  setManualTarget({ criterionId: criterion.id, decision: "passed" })
                                }
                                className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-control border border-app-border-strong px-3 text-xs font-semibold text-app-foreground transition-colors hover:bg-app-surface-subtle disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <CheckCircle2 aria-hidden="true" className="size-3.5" />
                                통과 처리
                              </button>
                            ) : null}
                            {decisionOptions.includes("failed") ? (
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() =>
                                  setManualTarget({ criterionId: criterion.id, decision: "failed" })
                                }
                                className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-control border border-app-border-strong px-3 text-xs font-semibold text-app-foreground transition-colors hover:bg-app-surface-subtle disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <XCircle aria-hidden="true" className="size-3.5" />
                                실패 처리
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <StatusBadge tone={criterionStatus.tone}>
                        {criterionStatus.manual ? (
                          <UserCheck aria-hidden="true" className="mr-1 size-3" />
                        ) : null}
                        {criterionStatus.label}
                      </StatusBadge>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* 검수 요청 및 트리거 바 */}
        <div className="mt-5 flex flex-col gap-3 rounded-control border border-app-border bg-app-surface-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs leading-5 text-app-muted">
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-warning"
            />
            {latestSubmission
              ? `Commit ${shortSha(latestSubmission.headCommitSha)} 기준으로 마일스톤 전체를 검수합니다.`
              : repositoryConnected
                ? "프리랜서가 PR을 제출하면 검수 버튼으로 마일스톤 전체 검수를 시작할 수 있습니다."
                : "저장소가 아직 연결되지 않아 PR과 Commit SHA를 제출할 수 없습니다."}
          </div>
          <button
            type="button"
            disabled={runInProgress ? false : disabled || !latestSubmission}
            onClick={runInProgress ? onReopenOverlay : requestRun}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-control bg-brand-500 px-4 text-sm font-semibold text-white disabled:border disabled:border-app-border disabled:bg-app-surface disabled:text-app-muted disabled:opacity-60 cursor-pointer"
          >
            {(disabled || runInProgress) && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {!disabled && !runInProgress && <Play aria-hidden="true" className="size-4" />}
            {runInProgress
              ? "검수 진행 중"
              : latestRun
                ? "마일스톤 재검수"
                : "마일스톤 검수 시작"}
          </button>
        </div>

        {latestSubmission && (
          <div className="mt-5 space-y-5 border-t border-app-border pt-5">
            {latestSubmission.runs.length > 0 && (
              <section aria-label="검수 실행 결과" className="space-y-3">
                <h3 className="text-sm font-semibold text-app-foreground">검수 실행 결과</h3>
                {latestSubmission.runs.map((verificationRun) => (
                  <RunResult key={verificationRun.id} run={verificationRun} />
                ))}
              </section>
            )}

            {/* 지급 및 정산 프로세스 가이드 카드 */}
            <div className="rounded-control border border-accent-100 bg-gradient-to-r from-accent-50/50 to-indigo-50/20 p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-pill bg-accent-100 text-accent-700">
                  <CreditCard className="size-4" />
                </span>
                <div className="text-xs">
                  <h4 className="font-semibold text-accent-950">대금 정산 및 지급 예정 안내</h4>
                  <p className="mt-1 text-app-muted leading-relaxed">
                    이 마일스톤의 최종 승인 예정 금액은 <strong>{milestone.amount.toLocaleString()} {milestone.currency}</strong> 입니다.
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded bg-app-surface border border-app-border px-1.5 py-0.5 text-app-muted">
                      1. 마일스톤 검수 완료
                    </span>
                    <ArrowRight className="size-3 text-app-muted" />
                    <span className="rounded bg-brand-50 border border-brand-200 px-1.5 py-0.5 text-brand-700">
                      2. 최종 승인 후 프리랜서가 인보이스 제출
                    </span>
                    <ArrowRight className="size-3 text-app-muted" />
                    <span className="rounded bg-success-50 border border-success-200 px-1.5 py-0.5 text-success-700">
                      3. 지급 기록과 통합 증빙 연결
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <form
              action={decide}
              className="grid gap-3 rounded-control bg-app-surface-subtle p-4 sm:grid-cols-[1fr_auto_auto]"
            >
              <input
                name="reason"
                placeholder="수정 요청 사유 (수정 요청 시 필수)"
                className="min-h-10 rounded-control border border-app-border-strong bg-app-surface px-3 text-sm focus:border-brand-500 focus:outline-none"
              />
              <button
                name="decision"
                value="revision_required"
                disabled={disabled}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-app-border-strong px-4 text-sm font-semibold text-app-foreground disabled:opacity-50 cursor-pointer hover:bg-app-surface transition-colors"
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
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-accent-600 px-4 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer hover:bg-accent-700 transition-colors"
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
          <span className="text-sm text-brand-700">{milestone.code}</span>
          <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-app-muted">
            <LockKeyhole aria-hidden="true" className="size-3.5" />
            SOW {sowVersion} 승인 기준
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-app-foreground">
          {milestone.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-app-muted">
          {milestone.description ??
            "프리랜서가 이 마일스톤의 통합 PR을 제출하면 검수 대상 SHA를 자동으로 확인합니다."}
        </p>
      </div>
      <dl className="grid min-w-72 grid-cols-2 gap-4 rounded-control border border-app-border bg-app-surface-subtle p-4 text-xs">
        <div>
          <dt className="text-app-muted">기간</dt>
          <dd className="mt-1 text-app-foreground">
            {milestone.startDate} ~ {milestone.endDate}
          </dd>
        </div>
        <div>
          <dt className="text-app-muted">승인 예정 금액</dt>
          <dd className="mt-1 text-app-foreground">
            {milestone.amount.toLocaleString()} {milestone.currency}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function RunResult({ run }: { run: VerificationRunRecord }) {
  const status = resolveRunStatus(run.status);
  const moment = resolveRunMoment(run);
  const elapsed = formatElapsed(run.startedAt, run.completedAt);

  return (
    <div className="rounded-control border border-app-border bg-app-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-app-foreground">검수 #{run.attemptNumber}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-app-muted">
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden="true" className="size-3" />
              {moment.label} {moment.value}
            </span>
            {elapsed ? <span>· 소요 {elapsed}</span> : null}
          </p>
        </div>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>
      {ACTIVE_RUN_STATUSES.includes(run.status) && (
        <p className="mt-2 text-sm text-app-muted">
          격리 환경에서 검수가 진행 중입니다. 완료되면 이 화면이 자동으로 갱신됩니다.
        </p>
      )}
      {run.errorSummary && <p className="mt-2 text-sm text-red-700">{run.errorSummary}</p>}
      {run.previewUrl && (
        <a
          href={run.previewUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
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
  const latestSubmission = milestone.submissions[0];
  const currentDecision =
    milestone.decision?.submissionId === latestSubmission?.id ? milestone.decision : null;

  if (currentDecision?.decision === "approved") {
    return milestoneVerificationStatusConfig.approved;
  }
  if (currentDecision?.decision === "revision_required") {
    return milestoneVerificationStatusConfig.revision_required;
  }

  const latestRun = latestSubmission?.runs[0];
  if (latestRun && ACTIVE_RUN_STATUSES.includes(latestRun.status)) {
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

/**
 * 날짜와 시각을 발주자가 읽는 형식으로. 초 단위는 의사결정에 쓸모가 없다.
 *
 * 시간대를 고정한다. 클라이언트 컴포넌트라 서버(UTC)와 브라우저(로컬)가 각각
 * 렌더링하는데, 시간대를 비워 두면 두 결과가 달라져 hydration이 어긋난다.
 * 검수 시각은 양측이 같은 값을 봐야 하는 계약상의 기록이기도 하다.
 */
function formatMoment(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(date);
}

/**
 * 화면에 보일 완료조건 상태.
 *
 * 사람이 내린 판정이 있으면 그것이 현재 상태다. 다만 자동 판정을 지우지 않고
 * 함께 돌려줘, 무엇을 뒤집은 결과인지 화면에서 같이 보여줄 수 있게 한다.
 */
function resolveCriterionView(
  result: VerificationResultRecord | undefined,
  isClaimed: boolean,
): { label: string; tone: StatusTone; manual: VerificationResultRecord["manualDecision"] } {
  const automated = resolveCriterionStatus(result, isClaimed);
  const manual = result?.manualDecision ?? null;
  if (!manual) return { ...automated, manual: null };
  const decided = checklistStatusConfig[manual.decision];
  return { label: `발주자 ${decided.label}`, tone: decided.tone, manual };
}

/**
 * 발주자가 지금 이 완료조건을 어느 쪽으로 판정할 수 있는지.
 *
 * 이미 사람이 판정한 항목은 판정이 끝난 것이므로 버튼을 남기지 않는다. 결론이
 * 난 줄에 반대쪽 버튼이 계속 떠 있으면 판정이 아직 열려 있는 것처럼 보인다.
 */
function manualDecisionOptions(
  status: VerificationResultRecord["status"] | undefined,
  manual: VerificationResultRecord["manualDecision"],
): Array<"passed" | "failed"> {
  if (manual) return [];
  if (status === "failed") return ["passed"];
  if (status === "needs_review") return ["passed", "failed"];
  return [];
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

/**
 * 실행 카드에 보여줄 시각.
 *
 * 발주자가 알고 싶은 건 "이 결과가 언제 나온 것인가"다. 끝난 실행은 완료 시각을,
 * 아직 도는 실행은 시작 또는 대기 시각을 기준으로 보여준다.
 */
function resolveRunMoment(run: VerificationRunRecord): { label: string; value: string } {
  const completed = formatMoment(run.completedAt);
  if (completed) return { label: "완료", value: completed };
  const started = formatMoment(run.startedAt);
  if (started) return { label: "시작", value: started };
  return { label: "요청", value: formatMoment(run.queuedAt) ?? "시점 미상" };
}

/** 검수에 걸린 시간. 재검수가 쌓일 때 실행끼리 비교할 수 있게 함께 보여준다. */
function formatElapsed(startedAt: string | null, completedAt: string | null): string | null {
  if (!startedAt || !completedAt) return null;
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}초`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes}분 ${rest}초` : `${minutes}분`;
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
  value: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-app-muted">
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5 text-sm text-app-foreground">{value}</dd>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-control border border-brand-200 bg-app-surface/80 px-2 py-3">
      {icon && (
        <span aria-hidden="true" className="absolute right-2 top-2 text-app-border-strong">
          {icon}
        </span>
      )}
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-app-muted">{label}</p>
    </div>
  );
}

function shortSha(sha: string) {
  return sha.slice(0, 7);
}

function evidenceLabel(type: string) {
  if (type === "screenshot") return "스크린샷 보기";
  if (type === "trace") return "실행 Trace";
  if (type === "video") return "실행 영상";
  if (type === "log") return "상세 로그";
  return "검수 증거";
}
