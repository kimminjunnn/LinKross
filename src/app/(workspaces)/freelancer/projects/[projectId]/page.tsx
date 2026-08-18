import Link from "next/link";
import { ArrowLeft, CircleAlert, FileText, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { getProjectFinancialWorkspace, getSowApprovalState, getVerificationWorkspace, listFreelancerProjects } from "@/lib/backend";

import { FreelancerSowApprovalPanel } from "./sow-approval-panel";
import { FreelancerCodeSubmission } from "./code-submission";
import { FreelancerInvoicePanel } from "./invoice-panel";

export default async function FreelancerProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [projectsResult, sowResult, verificationResult, financeResult] = await Promise.all([
    listFreelancerProjects(),
    getSowApprovalState(projectId),
    getVerificationWorkspace(projectId),
    getProjectFinancialWorkspace(projectId),
  ]);

  if (!projectsResult.ok || !sowResult.ok || !verificationResult.ok || !financeResult.ok) {
    const message = !projectsResult.ok
      ? projectsResult.error.message
      : !sowResult.ok
        ? sowResult.error.message
        : !verificationResult.ok
          ? verificationResult.error.message
          : !financeResult.ok
            ? financeResult.error.message
          : "프로젝트를 불러오지 못했습니다.";
    return <ErrorState message={message} />;
  }

  const project = projectsResult.data.find((item) => item.projectId === projectId);
  if (!project) return <ErrorState message="선정된 프로젝트를 찾을 수 없습니다." />;

  const sow = sowResult.data;

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      <Link href="/freelancer/projects" className="inline-flex items-center gap-2 text-sm font-bold text-app-muted hover:text-brand-700">
        <ArrowLeft className="size-4" />My projects
      </Link>

      <div className="mt-4">
        <PageHeader
          eyebrow={project.organizationName}
          title={project.title}
          description="The proposal, SOW version, milestones, code submissions, and evidence remain linked to this project."
        />
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-brand-600" />
            <h2 className="text-lg font-black text-app-foreground">SOW and acceptance criteria</h2>
          </div>

          {!sow ? (
            <div className="mt-5 rounded-control border border-dashed border-app-border-strong p-6 text-sm text-app-muted">
              The client has not submitted a SOW for review yet.
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-brand-50 px-3 py-1 font-bold text-brand-700">{sow.version}</span>
                <span className="font-semibold text-app-muted">{sow.status.replaceAll("_", " ")}</span>
              </div>

              {sow.document.documentSections.map((section) => (
                <article key={section.title} className="rounded-control border border-app-border bg-app-surface-subtle p-4">
                  <h3 className="text-sm font-black text-app-foreground">{section.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-app-muted">{section.body}</p>
                </article>
              ))}

              <div className="space-y-3">
                {sow.milestones.map((milestone) => (
                  <article key={milestone.id} className="rounded-control border border-app-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-black text-app-foreground">{milestone.code} · {milestone.title}</h3>
                      <span className="text-xs font-bold text-app-muted">{milestone.amount}</span>
                    </div>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-app-muted">
                      {[...milestone.acceptanceCriteria, ...milestone.definitionOfDone].map((criterion) => (
                        <li key={criterion.id}>{criterion.description}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="h-fit rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-accent-600" />
            <h2 className="text-lg font-black text-app-foreground">Dual approval</h2>
          </div>
          {sow ? <FreelancerSowApprovalPanel initialState={sow} /> : (
            <p className="mt-4 text-sm leading-6 text-app-muted">Approval becomes available after the client requests review.</p>
          )}
        </aside>
      </div>

      {verificationResult.data.sowVersionId && (
        <div className="mt-6">
          <FreelancerCodeSubmission initialWorkspace={verificationResult.data} />
        </div>
      )}
      <div className="mt-6"><FreelancerInvoicePanel workspace={financeResult.data} /></div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto w-full max-w-4xl rounded-card border border-danger/30 bg-danger/10 p-6 text-danger">
      <div className="flex gap-3"><CircleAlert className="size-5 shrink-0" /><p className="text-sm font-bold">{message}</p></div>
    </div>
  );
}
