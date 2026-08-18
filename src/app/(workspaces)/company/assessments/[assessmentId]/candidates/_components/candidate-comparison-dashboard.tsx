"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, CircleAlert, ExternalLink, UserCheck, Users } from "lucide-react";

import { selectProposalAction } from "@/app/actions/projects";
import { PageHeader } from "@/components/page/page-header";
import { StatusBadge } from "@/components/project/status-badge";
import type {
  BackendResult,
  CompanyProjectDetail,
  ProjectProposal,
} from "@/lib/backend";

export function CandidateComparisonDashboard({
  projectDetail,
  proposals,
}: {
  projectDetail: BackendResult<CompanyProjectDetail>;
  proposals: BackendResult<ProjectProposal[]>;
}) {
  const router = useRouter();
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(
    proposals.ok ? proposals.data.find((proposal) => proposal.isSelected)?.id ?? null : null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!projectDetail.ok) {
    return (
      <div className="mx-auto w-full max-w-5xl rounded-card border border-danger/30 bg-danger/10 p-6 text-danger">
        <div className="flex gap-3"><CircleAlert className="size-5 shrink-0" /><p className="text-sm font-bold">{projectDetail.error.message}</p></div>
      </div>
    );
  }

  if (!proposals.ok) {
    return (
      <div className="mx-auto w-full max-w-5xl rounded-card border border-danger/30 bg-danger/10 p-6 text-danger">
        <div className="flex gap-3"><CircleAlert className="size-5 shrink-0" /><p className="text-sm font-bold">{proposals.error.message}</p></div>
      </div>
    );
  }

  const project = projectDetail.data;
  const candidates = proposals.data.filter((proposal) => proposal.status === "submitted");

  function chooseCandidate(proposalId: string) {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await selectProposalAction(project.id, proposalId);
      if (!result.ok) {
        setErrorMessage(result.error.message);
        return;
      }
      setSelectedProposalId(proposalId);
      router.push(`/company/projects/${project.id}/sow`);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-7xl pb-16">
      <Link href="/company/assessments" className="inline-flex items-center gap-2 text-sm font-bold text-app-muted hover:text-brand-700">
        <ArrowLeft className="size-4" />진행 전 프로젝트
      </Link>

      <div className="mt-4">
        <PageHeader
          eyebrow={`수행 제안서 ${candidates.length}건`}
          title={project.title}
          description="자동 점수나 추천 없이 지원자가 제출한 원문과 프로필 스냅샷을 직접 확인해 선정합니다."
        />
      </div>

      <section className="mt-6 rounded-card border border-app-border bg-app-surface-subtle p-5">
        <h2 className="text-sm font-black text-app-foreground">등록 요구사항</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-app-muted">{project.requirements}</p>
      </section>

      {errorMessage ? (
        <div className="mt-5 flex gap-3 rounded-control border border-danger/30 bg-danger/10 p-4 text-danger">
          <CircleAlert className="size-5 shrink-0" /><p className="text-sm font-bold">{errorMessage}</p>
        </div>
      ) : null}

      {candidates.length === 0 ? (
        <div className="mt-6 rounded-card border border-dashed border-app-border-strong p-10 text-center">
          <Users className="mx-auto size-9 text-app-muted" />
          <p className="mt-4 font-bold text-app-foreground">아직 제출된 수행 제안서가 없습니다.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {candidates.map((proposal) => {
            const isSelected = proposal.id === selectedProposalId || proposal.isSelected;
            return (
              <article key={proposal.id} className={`rounded-card border bg-app-surface p-5 shadow-card ${isSelected ? "border-success/50" : "border-app-border"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-app-foreground">{proposal.freelancer.displayName ?? "이름 미등록 지원자"}</h2>
                    <p className="mt-1 text-sm text-app-muted">{proposal.freelancer.headline ?? "프로필 소개 없음"}</p>
                  </div>
                  {isSelected ? <StatusBadge tone="success">선정 완료</StatusBadge> : <StatusBadge tone="brand">검토 대기</StatusBadge>}
                </div>

                {proposal.freelancer.skills ? (
                  <p className="mt-4 text-xs font-bold text-brand-700">{proposal.freelancer.skills}</p>
                ) : null}

                <div className="mt-5 rounded-control border border-app-border bg-app-surface-subtle p-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-app-muted">제출 원문</h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-app-foreground">{proposal.content}</p>
                  {proposal.optionalNotes ? (
                    <p className="mt-4 border-t border-app-border pt-4 text-sm text-app-muted">{proposal.optionalNotes}</p>
                  ) : null}
                </div>

                {proposal.freelancer.portfolioUrls.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {proposal.freelancer.portfolioUrls.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline">
                        포트폴리오 <ExternalLink className="size-3" />
                      </a>
                    ))}
                  </div>
                ) : null}

                <button
                  type="button"
                  disabled={isPending || isSelected || Boolean(selectedProposalId)}
                  onClick={() => chooseCandidate(proposal.id)}
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserCheck className="size-4" />
                  {isSelected ? "선정 완료" : isPending ? "선정 저장 중" : "이 프리랜서 선정"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
