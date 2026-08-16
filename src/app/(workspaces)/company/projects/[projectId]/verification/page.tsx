import {
  AlertCircle,
  GitBranch,
  GitFork,
  Link2,
  LockKeyhole,
  Play,
  Search,
  Settings2,
  ShieldCheck,
  TestTube2,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/project/status-badge";
import { getApprovedSowMilestones } from "@/lib/backend";
import type { ProjectMilestoneSummary } from "@/lib/backend";
import {
  milestoneVerificationStatusConfig,
  type MilestoneVerificationStatus,
} from "@/config/verification-status";

export default async function VerificationPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ milestone?: string | string[] }>;
}) {
  const { projectId } = await params;
  const { milestone } = await searchParams;

  const result = await getApprovedSowMilestones(projectId);

  if (!result.ok) {
    return (
      <div className="rounded-card border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
        {result.error.message}
      </div>
    );
  }

  const { milestones, versionNumber } = result.data;

  if (milestones.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-app-border-strong bg-app-surface-subtle p-10 text-center">
        <p className="text-sm font-bold text-app-foreground">
          아직 승인된 업무 명세서가 없습니다.
        </p>
        <p className="mt-1.5 text-sm text-app-muted">
          발주자와 개발자 양측이 SOW를 승인하면 이 화면에 마일스톤이 표시됩니다.
        </p>
      </div>
    );
  }

  const requestedCode = Array.isArray(milestone) ? milestone[0] : milestone;
  const selected =
    milestones.find((item) => item.code === requestedCode) ?? milestones[0];

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
                  <StatusBadge tone="neutral">연결 대기</StatusBadge>
                </div>
                <h2 className="mt-2 truncate text-lg font-black text-app-foreground">
                  저장소 미연결
                </h2>
                <p className="mt-1 text-sm leading-6 text-app-muted">
                  이 프로젝트의 PR과 Commit SHA만 검수 대상으로 제출할 수 있습니다.
                </p>
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
              value="-"
              icon={<GitBranch className="size-4" />}
            />
            <RepositoryField
              label="권한"
              value="읽기 전용"
              icon={<ShieldCheck className="size-4" />}
            />
            <RepositoryField
              label="연결 확인"
              value="아직 없음"
              icon={<UserRound className="size-4" />}
            />
          </dl>
        </article>

        <VerificationSummary milestone={selected} />
      </section>

      <section className="overflow-hidden rounded-card border border-app-border bg-app-surface shadow-card">
        <div className="border-b border-app-border bg-app-surface-subtle px-3 pt-3 sm:px-5 sm:pt-4">
          <nav aria-label="마일스톤 선택" className="flex gap-2 overflow-x-auto pb-0">
            {milestones.map((item) => {
              const isSelected = item.id === selected.id;
              const statusMeta = resolveStatus(item.status);

              return (
                <Link
                  key={item.id}
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
                    <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
                  </span>
                  <span className="mt-1.5 block truncate text-xs font-bold">
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div id={`milestone-panel-${selected.code}`}>
          <MilestoneDetailCard milestone={selected} versionNumber={versionNumber} />
        </div>
      </section>

      <section className="rounded-card border border-accent-200 bg-accent-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-control bg-accent-100 text-accent-800">
            <TestTube2 aria-hidden="true" className="size-4" />
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

function resolveStatus(status: string) {
  return (
    milestoneVerificationStatusConfig[status as MilestoneVerificationStatus] ??
    milestoneVerificationStatusConfig.submission_required
  );
}

function VerificationSummary({ milestone }: { milestone: ProjectMilestoneSummary }) {
  const statusMeta = resolveStatus(milestone.status);

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
        <SummaryMetric label="완료조건" value={String(milestone.checklist.length)} tone="text-app-foreground" />
        <SummaryMetric label="제출" value="0" tone="text-app-muted" />
        <SummaryMetric label="검수" value="0" tone="text-app-muted" />
      </div>
      <p className="mt-4 text-xs font-semibold leading-5 text-brand-700">
        PR이 제출되면 최신 전체 Commit SHA를 고정하고 검수를 시작합니다.
      </p>
    </article>
  );
}

function MilestoneDetailCard({
  milestone,
  versionNumber,
}: {
  milestone: ProjectMilestoneSummary;
  versionNumber: number | null;
}) {
  const statusMeta = resolveStatus(milestone.status);
  const period = `${milestone.startDate} ~ ${milestone.endDate}`;
  const amount = `${milestone.amount.toLocaleString()} ${milestone.currency}`;

  return (
    <section className="bg-app-surface">
      <div className="p-5 sm:p-6">
        <MilestoneHeader
          code={milestone.code}
          title={milestone.title}
          period={period}
          amount={amount}
          sowVersion={versionNumber ? `v${versionNumber}` : "-"}
          statusLabel={statusMeta.label}
          statusTone={statusMeta.tone}
          description={
            milestone.description ??
            "프리랜서가 이 마일스톤의 통합 PR을 제출하면 검수 대상 SHA를 자동으로 확인합니다."
          }
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
                disabled
                placeholder="저장소 연결 후 제출 가능합니다"
                className="min-h-11 min-w-0 flex-1 rounded-control border border-brand-200 bg-app-surface px-3 text-sm text-app-foreground opacity-60 placeholder:text-app-muted/70"
              />
              <button
                type="button"
                disabled
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-4 text-sm font-black text-white opacity-60"
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
                SOW에서 가져온 완료조건
              </h3>
              <span className="text-xs font-bold text-app-muted">
                0/{milestone.checklist.length} 제출
              </span>
            </div>
            {milestone.checklist.length === 0 ? (
              <p className="mt-4 text-xs leading-5 text-app-muted">
                이 마일스톤엔 등록된 완료조건이 없습니다.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {milestone.checklist.map((item, index) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-control border border-app-border bg-app-surface p-3"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-pill border border-app-border text-[0.65rem] font-black text-app-muted">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold leading-5 text-app-foreground">
                        {item.description}
                      </p>
                      <p className="mt-1 text-xs text-app-muted">
                        PR 제출 후 구현 완료 여부를 선택합니다.
                      </p>
                    </div>
                    <StatusBadge tone="neutral">미제출</StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-control border border-app-border bg-app-surface-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs leading-5 text-app-muted">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
            저장소가 아직 연결되지 않아 PR과 Commit SHA를 제출할 수 없습니다.
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

