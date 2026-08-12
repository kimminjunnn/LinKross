import {
  AlertCircle,
  Check,
  CheckCircle2,
  Circle,
  CircleDot,
  Clock3,
  ExternalLink,
  FileCheck2,
  GitBranch,
  GitCommitHorizontal,
  GitFork,
  GitPullRequest,
  History,
  Link2,
  LockKeyhole,
  Play,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  TestTube2,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/project/status-badge";
import {
  checklistStatusConfig,
  milestoneVerificationStatusConfig,
  verificationTypeLabels,
  type ChecklistStatus,
  type MilestoneVerificationStatus,
  type VerificationType,
} from "@/config/verification-status";

type ChecklistItem = {
  id: string;
  title: string;
  verificationType: VerificationType;
  status: ChecklistStatus;
  supportingCommit: string;
  observedResult: string;
  duration: string;
  evidence?: string;
};

type SubmittedMilestone = {
  code: string;
  title: string;
  period: string;
  amount: string;
  sowVersion: string;
  status: MilestoneVerificationStatus;
  pullRequest: {
    number: number;
    title: string;
    author: string;
    branch: string;
  };
  headSha: string;
  submittedAt: string;
  commits: Array<{
    sha: string;
    title: string;
    checklist: string;
  }>;
  checklist: ChecklistItem[];
};

const submittedMilestone: SubmittedMilestone = {
  code: "M1",
  title: "로그인 및 접근 제어",
  period: "2026.08.10 – 08.20",
  amount: "4,000 USDC",
  sowVersion: "v1.2",
  status: "revision_required",
  pullRequest: {
    number: 12,
    title: "M1 로그인 기능 구현",
    author: "Sarah Lee",
    branch: "feature/auth-login",
  },
  headSha: "c17bd91a4f0c2e81088a53d90f8b4b32f0d6e221",
  submittedAt: "2026.08.12 14:32",
  commits: [
    {
      sha: "a84f0c2",
      title: "로그인 입력 폼 구현",
      checklist: "이메일·비밀번호 입력",
    },
    {
      sha: "b50d2ea",
      title: "로그인 성공 후 이동 처리",
      checklist: "/dashboard 이동",
    },
    {
      sha: "c17bd91",
      title: "오류 및 필수 입력 검증",
      checklist: "오류 표시·빈 값 차단",
    },
  ],
  checklist: [
    {
      id: "login-inputs",
      title: "이메일과 비밀번호를 입력할 수 있다.",
      verificationType: "automated_e2e",
      status: "passed",
      supportingCommit: "a84f0c2",
      observedResult: "이메일과 비밀번호 필드에 테스트 값을 정상 입력했습니다.",
      duration: "8초",
    },
    {
      id: "login-redirect",
      title: "정상 로그인 후 /dashboard로 이동한다.",
      verificationType: "automated_e2e",
      status: "passed",
      supportingCommit: "b50d2ea",
      observedResult: "합성 계정으로 로그인한 뒤 /dashboard 이동을 확인했습니다.",
      duration: "12초",
    },
    {
      id: "invalid-password",
      title: "잘못된 비밀번호 입력 시 오류가 표시된다.",
      verificationType: "automated_e2e",
      status: "failed",
      supportingCommit: "c17bd91",
      observedResult:
        "잘못된 비밀번호를 입력했지만 화면에서 오류 메시지를 찾지 못했습니다.",
      duration: "10초",
      evidence:
        "로그인 버튼 클릭 후에도 오류 안내 영역이 렌더링되지 않았습니다. 실패 시점의 화면과 브라우저 Trace를 증거로 보관합니다.",
    },
    {
      id: "email-required",
      title: "이메일 미입력 시 로그인이 차단된다.",
      verificationType: "manual",
      status: "needs_review",
      supportingCommit: "c17bd91",
      observedResult:
        "제출은 차단됐습니다. 오류 문구와 모바일 화면은 Preview에서 확인해 주세요.",
      duration: "확인 대기",
    },
  ],
};

const pendingMilestone = {
  code: "M2",
  title: "관리자 회원 관리",
  period: "2026.08.21 – 09.01",
  amount: "5,000 USDC",
  sowVersion: "v1.2",
  status: "submission_required" as const,
  checklist: [
    "관리자는 회원 목록을 조회할 수 있다.",
    "회원 이름 또는 이메일로 검색할 수 있다.",
    "비활성화된 회원은 로그인할 수 없다.",
  ],
};

const upcomingMilestone = {
  code: "M3",
  title: "운영 배포 및 인수인계",
  period: "2026.09.02 – 09.08",
  amount: "3,000 USDC",
  sowVersion: "v1.2",
  checklist: [
    "운영 환경에서 핵심 사용자 흐름이 정상 작동한다.",
    "관리자용 운영 문서와 환경변수 목록이 제공된다.",
    "최종 인수인계 미팅과 질의응답이 완료된다.",
  ],
};

const milestoneTabs = [
  {
    code: "M1",
    title: submittedMilestone.title,
    statusLabel: "현재 진행 중",
    statusTone: "brand",
  },
  {
    code: "M2",
    title: pendingMilestone.title,
    statusLabel: "코드 제출 대기",
    statusTone: "warning",
  },
  {
    code: "M3",
    title: upcomingMilestone.title,
    statusLabel: "예정",
    statusTone: "neutral",
  },
] as const;

type MilestoneCode = (typeof milestoneTabs)[number]["code"];

export default async function VerificationPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ milestone?: string | string[] }>;
}) {
  await params;
  const { milestone } = await searchParams;
  const requestedMilestone = Array.isArray(milestone) ? milestone[0] : milestone;
  const selectedMilestone =
    milestoneTabs.find((item) => item.code === requestedMilestone) ?? milestoneTabs[0];
  const selectedCode = selectedMilestone.code;

  return (
    <div className="space-y-5 pb-12">
      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
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
                  <StatusBadge tone="success">연결됨</StatusBadge>
                </div>
                <h2 className="mt-2 truncate text-lg font-black text-app-foreground">
                  linkross/customer-portal
                </h2>
                <p className="mt-1 text-sm leading-6 text-app-muted">
                  이 프로젝트의 PR과 Commit SHA만 검수 대상으로 제출할 수 있습니다.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-control border border-app-border-strong bg-app-surface px-3 text-sm font-bold text-app-foreground hover:bg-app-surface-subtle"
            >
              <Settings2 aria-hidden="true" className="size-4" />
              연결 관리
            </button>
          </div>

          <dl className="mt-5 grid gap-3 border-t border-app-border pt-4 sm:grid-cols-3">
            <RepositoryField
              label="기본 브랜치"
              value="main"
              icon={<GitBranch className="size-4" />}
            />
            <RepositoryField
              label="권한"
              value="읽기 전용"
              icon={<ShieldCheck className="size-4" />}
            />
            <RepositoryField
              label="연결 확인"
              value="박피오 · 오늘"
              icon={<UserRound className="size-4" />}
            />
          </dl>
        </article>

        <VerificationSummary code={selectedCode} />
      </section>

      <section className="overflow-hidden rounded-card border border-app-border bg-app-surface shadow-card">
        <div className="border-b border-app-border bg-app-surface-subtle px-3 pt-3 sm:px-5 sm:pt-4">
          <nav aria-label="마일스톤 선택" className="flex gap-2 overflow-x-auto pb-0">
            {milestoneTabs.map((item) => {
              const isSelected = item.code === selectedCode;

              return (
                <Link
                  key={item.code}
                  id={`milestone-tab-${item.code}`}
                  aria-current={isSelected ? "page" : undefined}
                  href={`?milestone=${item.code}`}
                  scroll={false}
                  className={`group min-w-44 shrink-0 rounded-t-control border border-b-0 px-4 py-3 transition-colors sm:min-w-52 ${
                    isSelected
                      ? "border-app-border bg-app-surface text-app-foreground"
                      : "border-transparent text-app-muted hover:border-app-border hover:bg-app-surface/70 hover:text-app-foreground"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black">{item.code}</span>
                    <StatusBadge tone={item.statusTone}>{item.statusLabel}</StatusBadge>
                  </span>
                  <span className="mt-1.5 block truncate text-xs font-bold">
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div id={`milestone-panel-${selectedCode}`}>
          {selectedCode === "M1" ? (
            <SubmittedMilestoneCard milestone={submittedMilestone} embedded />
          ) : null}
          {selectedCode === "M2" ? (
            <PendingMilestoneCard milestone={pendingMilestone} embedded />
          ) : null}
          {selectedCode === "M3" ? (
            <UpcomingMilestoneCard milestone={upcomingMilestone} />
          ) : null}
        </div>
      </section>

      <section className="rounded-card border border-accent-200 bg-accent-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-control bg-accent-100 text-accent-800">
            <FileCheck2 aria-hidden="true" className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-black text-accent-900">
              자동 검수 결과는 최종 승인 그 자체가 아닙니다.
            </h2>
            <p className="mt-1 text-sm leading-6 text-accent-800">
              LinKross는 같은 SHA에서 체크리스트가 작동한 근거를 제공합니다. 발주자는
              실패와 확인 필요 항목을 검토한 뒤 직접 승인하거나 수정 요청합니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function VerificationSummary({ code }: { code: MilestoneCode }) {
  const summary = {
    M1: {
      title: "M1 검수 진행 중",
      metrics: [
        { label: "통과", value: "2", tone: "text-success" },
        { label: "실패", value: "1", tone: "text-danger" },
        { label: "확인 필요", value: "1", tone: "text-warning" },
      ],
      description: "최신 전체 검수 #2 · Commit c17bd91 · 오늘 15:10",
    },
    M2: {
      title: "M2 코드 제출 대기",
      metrics: [
        { label: "완료조건", value: "3", tone: "text-app-foreground" },
        { label: "제출", value: "0", tone: "text-app-muted" },
        { label: "검수", value: "0", tone: "text-app-muted" },
      ],
      description: "PR이 제출되면 최신 Commit SHA를 고정하고 검수를 시작합니다.",
    },
    M3: {
      title: "M3 시작 예정",
      metrics: [
        { label: "완료조건", value: "3", tone: "text-app-foreground" },
        { label: "제출", value: "0", tone: "text-app-muted" },
        { label: "검수", value: "0", tone: "text-app-muted" },
      ],
      description: "M2 완료 후 제출과 검수가 활성화됩니다.",
    },
  }[code];

  return (
    <article className="rounded-card border border-brand-200 bg-brand-50 p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold tracking-[0.1em] text-brand-700 uppercase">
          Verification summary
        </p>
        <TestTube2 aria-hidden="true" className="size-5 text-brand-700" />
      </div>
      <h2 className="mt-3 text-xl font-black text-app-foreground">{summary.title}</h2>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {summary.metrics.map((metric) => (
          <SummaryMetric key={metric.label} {...metric} />
        ))}
      </div>
      <p className="mt-4 text-xs font-semibold leading-5 text-brand-700">
        {summary.description}
      </p>
    </article>
  );
}

function UpcomingMilestoneCard({ milestone }: { milestone: typeof upcomingMilestone }) {
  return (
    <section className="bg-app-surface p-5 sm:p-6">
      <MilestoneHeader
        code={milestone.code}
        title={milestone.title}
        period={milestone.period}
        amount={milestone.amount}
        sowVersion={milestone.sowVersion}
        statusLabel="예정"
        statusTone="neutral"
        description="앞선 마일스톤이 완료되면 코드 제출과 검수 기능이 활성화됩니다."
      />

      <div className="mt-5 rounded-card border border-app-border bg-app-surface-subtle p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.1em] text-app-muted uppercase">
              Upcoming checklist
            </p>
            <h3 className="mt-2 text-lg font-black text-app-foreground">
              SOW에서 확정된 완료조건
            </h3>
          </div>
          <StatusBadge tone="neutral">검수 비활성화</StatusBadge>
        </div>
        <ol className="mt-5 grid gap-3 lg:grid-cols-3">
          {milestone.checklist.map((item, index) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-control border border-app-border bg-app-surface p-4"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-pill bg-app-surface-subtle text-xs font-black text-app-muted">
                {index + 1}
              </span>
              <p className="text-sm font-bold leading-6 text-app-foreground">{item}</p>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex items-start gap-2 border-t border-app-border pt-4 text-xs leading-5 text-app-muted">
          <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          예정 마일스톤은 조건을 미리 확인할 수 있지만 PR 제출과 검수는 아직 실행할 수
          없습니다.
        </div>
      </div>
    </section>
  );
}

function SubmittedMilestoneCard({
  milestone,
  embedded = false,
}: {
  milestone: SubmittedMilestone;
  embedded?: boolean;
}) {
  const milestoneStatus = milestoneVerificationStatusConfig[milestone.status];

  return (
    <section
      className={
        embedded
          ? "bg-app-surface"
          : "rounded-card border border-app-border bg-app-surface shadow-card"
      }
    >
      <div className="p-5 sm:p-6">
        <MilestoneHeader
          code={milestone.code}
          title={milestone.title}
          period={milestone.period}
          amount={milestone.amount}
          sowVersion={milestone.sowVersion}
          statusLabel={milestoneStatus.label}
          statusTone={milestoneStatus.tone}
          description="제출된 하나의 Commit SHA에서 모든 완료조건이 함께 작동하는지 확인합니다."
        />
      </div>

      <div className="border-y border-app-border bg-app-surface-subtle p-5 sm:p-6">
        <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <GitPullRequest aria-hidden="true" className="size-5 text-brand-700" />
              <h3 className="font-black text-app-foreground">
                PR #{milestone.pullRequest.number} · {milestone.pullRequest.title}
              </h3>
              <StatusBadge tone="brand">4/4 항목 제출</StatusBadge>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-app-muted">
              <span className="inline-flex items-center gap-1.5">
                <UserRound aria-hidden="true" className="size-3.5" />
                {milestone.pullRequest.author}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <GitBranch aria-hidden="true" className="size-3.5" />
                {milestone.pullRequest.branch}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 aria-hidden="true" className="size-3.5" />
                {milestone.submittedAt} 제출
              </span>
            </div>

            <div className="mt-4 rounded-control border border-accent-200 bg-accent-50 p-4">
              <p className="text-xs font-bold text-accent-800">실제 검수 대상 Commit SHA</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <GitCommitHorizontal aria-hidden="true" className="size-4 text-accent-700" />
                <code className="break-all text-xs font-black text-app-foreground sm:text-sm">
                  {milestone.headSha}
                </code>
                <StatusBadge tone="success">PR head 확인</StatusBadge>
              </div>
              <p className="mt-2 text-xs leading-5 text-accent-800">
                아래 Commit A·B·C의 변경을 모두 포함한 이 시점의 전체 프로젝트를
                실행합니다.
              </p>
            </div>
          </div>

          <div className="rounded-control border border-app-border bg-app-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.08em] text-app-muted uppercase">
                  Implementation history
                </p>
                <h3 className="mt-1 text-sm font-black text-app-foreground">
                  기능별 구현 근거 Commit
                </h3>
              </div>
              <History aria-hidden="true" className="size-5 text-app-muted" />
            </div>
            <ol className="mt-4 space-y-3">
              {milestone.commits.map((commit, index) => (
                <li key={commit.sha} className="grid grid-cols-[auto_1fr] gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid size-6 place-items-center rounded-pill text-[0.65rem] font-black ${
                        index === milestone.commits.length - 1
                          ? "bg-brand-500 text-white"
                          : "bg-app-surface-subtle text-app-muted"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    {index < milestone.commits.length - 1 ? (
                      <span className="mt-1 h-full min-h-6 w-px bg-app-border" />
                    ) : null}
                  </div>
                  <div className="min-w-0 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="text-xs font-black text-app-foreground">{commit.sha}</code>
                      {index === milestone.commits.length - 1 ? (
                        <span className="text-[0.65rem] font-black text-brand-700">LATEST</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs font-bold text-app-foreground">{commit.title}</p>
                    <p className="mt-1 text-xs text-app-muted">근거: {commit.checklist}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-app-border-strong bg-app-surface px-3 text-sm font-bold text-app-foreground hover:bg-app-surface-subtle"
          >
            GitHub에서 PR 보기
            <ExternalLink aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-app-foreground px-3 text-sm font-bold text-white hover:opacity-90"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            새 Commit 제출
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.1em] text-brand-700 uppercase">
                DoD checklist
              </p>
              <h3 className="mt-2 text-xl font-black text-app-foreground">
                세부 검수 체크리스트
              </h3>
            </div>
            <button
              type="button"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-control bg-brand-500 px-4 text-sm font-black text-white hover:bg-brand-600"
            >
              <Play aria-hidden="true" className="size-4 fill-current" />
              마일스톤 전체 검수
            </button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-app-muted">
              구현 근거 Commit은 이력이고, 각 결과는 모두 검수 대상 SHA c17bd91에서
              확인했습니다.
            </p>
            <div className="flex shrink-0 flex-wrap gap-3 text-xs font-bold text-app-muted">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-success" />2 통과
              </span>
              <span className="inline-flex items-center gap-1.5">
                <XCircle className="size-4 text-danger" />1 실패
              </span>
              <span className="inline-flex items-center gap-1.5">
                <AlertCircle className="size-4 text-warning" />1 확인 필요
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {milestone.checklist.map((item, index) => (
            <ChecklistCard key={item.id} item={item} index={index} />
          ))}
        </div>

      </div>
    </section>
  );
}

function PendingMilestoneCard({
  milestone,
  embedded = false,
}: {
  milestone: typeof pendingMilestone;
  embedded?: boolean;
}) {
  const milestoneStatus = milestoneVerificationStatusConfig[milestone.status];

  return (
    <section
      className={
        embedded
          ? "bg-app-surface"
          : "rounded-card border border-app-border bg-app-surface shadow-card"
      }
    >
      <div className="p-5 sm:p-6">
        <MilestoneHeader
          code={milestone.code}
          title={milestone.title}
          period={milestone.period}
          amount={milestone.amount}
          sowVersion={milestone.sowVersion}
          statusLabel={milestoneStatus.label}
          statusTone={milestoneStatus.tone}
          description="프리랜서가 이 마일스톤의 통합 PR을 제출하면 검수 대상 SHA를 자동으로 확인합니다."
        />

        <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-card border border-brand-200 bg-brand-50 p-5">
            <div className="flex items-center gap-2 text-brand-700">
              <Link2 aria-hidden="true" className="size-5" />
              <h3 className="text-sm font-black">마일스톤 PR 제출</h3>
            </div>
            <label
              htmlFor="milestone-pr-url"
              className="mt-5 block text-xs font-bold text-app-foreground"
            >
              GitHub PR 주소
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="milestone-pr-url"
                type="url"
                placeholder="https://github.com/linkross/customer-portal/pull/…"
                className="min-h-11 min-w-0 flex-1 rounded-control border border-brand-200 bg-app-surface px-3 text-sm text-app-foreground placeholder:text-app-muted/70"
              />
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-4 text-sm font-black text-white hover:bg-brand-600"
              >
                <Search aria-hidden="true" className="size-4" />
                PR 확인
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-brand-700">
              연결된 저장소의 PR만 제출할 수 있습니다. 확인 후 PR의 최신 전체 Commit
              SHA를 자동으로 고정합니다.
            </p>
          </div>

          <div className="rounded-card border border-app-border bg-app-surface-subtle p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-app-foreground">
                SOW에서 가져온 체크리스트
              </h3>
              <span className="text-xs font-bold text-app-muted">
                0/{milestone.checklist.length} 제출
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              {milestone.checklist.map((item, index) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-control border border-app-border bg-app-surface p-3"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-pill border border-app-border text-[0.65rem] font-black text-app-muted">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-5 text-app-foreground">{item}</p>
                    <p className="mt-1 text-xs text-app-muted">
                      PR 제출 후 구현 완료 여부를 선택합니다.
                    </p>
                  </div>
                  <StatusBadge tone="neutral">미제출</StatusBadge>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-control border border-app-border bg-app-surface-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs leading-5 text-app-muted">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
            PR과 Commit SHA가 없고 필수 체크리스트 3개가 미제출 상태입니다.
          </div>
          <button
            type="button"
            disabled
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-control border border-app-border bg-app-surface px-4 text-sm font-black text-app-muted opacity-60"
          >
            <Play aria-hidden="true" className="size-4" />
            마일스톤 전체 검수
          </button>
        </div>
      </div>
    </section>
  );
}

function MilestoneHeader({
  code,
  title,
  period,
  amount,
  sowVersion,
  statusLabel,
  statusTone,
  description,
}: {
  code: string;
  title: string;
  period: string;
  amount: string;
  sowVersion: string;
  statusLabel: string;
  statusTone: "neutral" | "brand" | "accent" | "success" | "warning" | "danger";
  description: string;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-black text-brand-700">{code}</span>
          <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-app-muted">
            <LockKeyhole aria-hidden="true" className="size-3.5" />
            SOW {sowVersion} 승인 기준
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-app-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-app-muted">{description}</p>
      </div>
      <dl className="grid min-w-72 grid-cols-2 gap-4 rounded-control border border-app-border bg-app-surface-subtle p-4 text-xs">
        <div>
          <dt className="font-semibold text-app-muted">기간</dt>
          <dd className="mt-1 font-black text-app-foreground">{period}</dd>
        </div>
        <div>
          <dt className="font-semibold text-app-muted">승인 예정 금액</dt>
          <dd className="mt-1 font-black text-app-foreground">{amount}</dd>
        </div>
      </dl>
    </div>
  );
}

function ChecklistCard({ item, index }: { item: ChecklistItem; index: number }) {
  const status = checklistStatusConfig[item.status];
  const isFailed = item.status === "failed";
  const needsReview = item.status === "needs_review";

  return (
    <article
      className={`rounded-card border p-4 sm:p-5 ${
        isFailed
          ? "border-red-200 bg-red-50/55"
          : needsReview
            ? "border-amber-200 bg-amber-50/55"
            : "border-app-border bg-app-surface"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <ChecklistStatusIcon status={item.status} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-app-muted">조건 {index + 1}</span>
              <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
              <span className="inline-flex items-center rounded-pill border border-app-border bg-app-surface-subtle px-2.5 py-1 text-xs font-bold text-app-muted">
                {verificationTypeLabels[item.verificationType]}
              </span>
            </div>
            <h4 className="mt-2 text-sm font-black leading-6 text-app-foreground sm:text-base">
              {item.title}
            </h4>
            <p
              className={`mt-2 text-sm leading-6 ${
                isFailed ? "font-bold text-danger" : "text-app-muted"
              }`}
            >
              {item.observedResult}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-app-muted">
              <span className="inline-flex items-center gap-1.5">
                <GitCommitHorizontal aria-hidden="true" className="size-3.5" />
                구현 근거 {item.supportingCommit}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 aria-hidden="true" className="size-3.5" />
                {item.duration}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CircleDot aria-hidden="true" className="size-3.5" />
                검수 대상 c17bd91
              </span>
            </div>

          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-brand-500 px-4 text-sm font-black text-white hover:bg-brand-600"
          >
            <Play aria-hidden="true" className="size-4 fill-current" />
            검수
          </button>
        </div>
      </div>

      <details className="group mt-4 border-t border-app-border pt-4">
        <summary className="ml-auto flex min-h-10 w-fit cursor-pointer list-none items-center justify-center gap-2 rounded-control border border-app-border bg-app-surface px-3 text-sm font-bold text-app-muted hover:text-app-foreground">
          상세 결과
          <ExternalLink aria-hidden="true" className="size-4" />
        </summary>
        <div className="mt-4 grid gap-3 rounded-control border border-app-border bg-app-surface p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold text-app-muted">검수 대상</p>
            <p className="mt-1 text-sm font-black text-app-foreground">Commit c17bd91</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-app-muted">실행 방식 · 소요시간</p>
            <p className="mt-1 text-sm font-black text-app-foreground">
              {verificationTypeLabels[item.verificationType]} · {item.duration}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-app-muted">구현 근거</p>
            <p className="mt-1 text-sm font-black text-app-foreground">
              Commit {item.supportingCommit}
            </p>
          </div>
          <div className="border-t border-app-border pt-3 sm:col-span-3">
            <p className="text-xs font-semibold text-app-muted">관찰 결과 및 증거</p>
            <p className="mt-1 text-sm leading-6 text-app-foreground">
              {item.evidence ?? item.observedResult}
            </p>
            {needsReview ? (
              <button
                type="button"
                className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-app-border-strong bg-app-surface px-3 text-sm font-black text-app-foreground hover:bg-app-surface-subtle"
              >
                Preview 열기
                <ExternalLink aria-hidden="true" className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
      </details>
    </article>
  );
}

function ChecklistStatusIcon({ status }: { status: ChecklistStatus }) {
  if (status === "passed") {
    return (
      <span className="grid size-9 shrink-0 place-items-center rounded-pill bg-emerald-100 text-success">
        <Check aria-hidden="true" className="size-5 stroke-[3]" />
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="grid size-9 shrink-0 place-items-center rounded-pill bg-red-100 text-danger">
        <XCircle aria-hidden="true" className="size-5" />
      </span>
    );
  }

  if (status === "needs_review") {
    return (
      <span className="grid size-9 shrink-0 place-items-center rounded-pill bg-amber-100 text-warning">
        <AlertCircle aria-hidden="true" className="size-5" />
      </span>
    );
  }

  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-pill bg-app-surface-subtle text-app-muted">
      <Circle aria-hidden="true" className="size-5" />
    </span>
  );
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
