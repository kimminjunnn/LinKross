import { CalendarRange, CircleAlert, FileText, Handshake, WalletCards } from "lucide-react";

import {
  getSowApprovalState,
  listFreelancerApplications,
  listFreelancerProjects,
} from "@/lib/backend";

import { FreelancerSowApprovalPanel } from "./sow-approval-panel";

export default async function FreelancerProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [projectsResult, applicationsResult, sowResult] = await Promise.all([
    listFreelancerProjects(),
    listFreelancerApplications(),
    getSowApprovalState(projectId),
  ]);

  if (!projectsResult.ok || !applicationsResult.ok || !sowResult.ok) {
    const message = !projectsResult.ok
      ? projectsResult.error.message
      : !applicationsResult.ok
        ? applicationsResult.error.message
        : !sowResult.ok
          ? sowResult.error.message
          : "The project could not be loaded.";
    return <TabError message={message} />;
  }

  const project = projectsResult.data.find((item) => item.projectId === projectId);
  if (!project) return <TabError message="The selected project could not be found." />;

  const proposal = applicationsResult.data.find(
    (item) => item.projectId === projectId && item.proposalId === project.proposalId,
  );
  const sow = sowResult.data;

  return (
    <div className="space-y-6">
      <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-2">
          <Handshake aria-hidden="true" className="size-5 text-brand-600" />
          <h2 className="text-lg font-black text-app-foreground">Project overview</h2>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewField
            label="Project period"
            value={`${formatDate(project.startDate)} – ${formatDate(project.endDate)}`}
            icon={<CalendarRange className="size-4" />}
          />
          <OverviewField
            label="Agreed budget"
            value={formatBudget(project.budgetAmount, project.budgetMaxAmount, project.currency)}
            icon={<WalletCards className="size-4" />}
          />
          <OverviewField label="Current stage" value={formatLifecycle(project.lifecycleStage)} />
          <OverviewField
            label="Milestones"
            value={`${project.approvedMilestoneCount}/${project.milestoneCount} approved`}
          />
        </dl>

        <div className="mt-5 border-t border-app-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-black text-app-foreground">My delivery proposal</h3>
            <span className="text-xs font-bold text-app-muted">
              Selected {formatDate(project.selectedAt)}
            </span>
          </div>
          {proposal ? (
            <div className="mt-3 rounded-control border border-app-border bg-app-surface-subtle p-4">
              <p className="whitespace-pre-wrap text-sm leading-6 text-app-foreground">
                {proposal.content}
              </p>
              {proposal.optionalNotes ? (
                <div className="mt-4 border-t border-app-border pt-4">
                  <p className="text-xs font-black text-app-muted">Additional notes</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-app-muted">
                    {proposal.optionalNotes}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 rounded-control border border-dashed border-app-border-strong p-4 text-sm text-app-muted">
              The selected delivery proposal could not be found.
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
          <div className="flex items-center gap-2">
            <FileText aria-hidden="true" className="size-5 text-brand-600" />
            <h2 className="text-lg font-black text-app-foreground">Statement of Work</h2>
          </div>

          {!sow ? (
            <div className="mt-5 rounded-control border border-dashed border-app-border-strong p-6 text-sm text-app-muted">
              The client has not submitted a SOW for review yet.
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-brand-50 px-3 py-1 font-bold text-brand-700">
                  {sow.version}
                </span>
                <span className="font-semibold text-app-muted">{formatSowStatus(sow.status)}</span>
              </div>

              {sow.document.documentSections.map((section) => (
                <article
                  key={section.title}
                  className="rounded-control border border-app-border bg-app-surface-subtle p-4"
                >
                  <h3 className="text-sm font-black text-app-foreground">{section.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-app-muted">
                    {section.body}
                  </p>
                </article>
              ))}

              <div className="space-y-3">
                {sow.milestones.map((milestone) => (
                  <article key={milestone.id} className="rounded-control border border-app-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-black text-app-foreground">
                        {milestone.code} · {milestone.title}
                      </h3>
                      <span className="text-xs font-bold text-app-muted">{milestone.amount}</span>
                    </div>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-app-muted">
                      {[...milestone.acceptanceCriteria, ...milestone.definitionOfDone].map(
                        (criterion) => <li key={criterion.id}>{criterion.description}</li>,
                      )}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="h-fit rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
          <div className="flex items-center gap-2">
            <Handshake aria-hidden="true" className="size-5 text-accent-600" />
            <h2 className="text-lg font-black text-app-foreground">Dual approval</h2>
          </div>
          {sow ? (
            <FreelancerSowApprovalPanel initialState={sow} />
          ) : (
            <p className="mt-4 text-sm leading-6 text-app-muted">
              Approval and revision requests become available after the client requests review.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function OverviewField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-control border border-app-border bg-app-surface-subtle p-4">
      <dt className="flex items-center gap-1.5 text-xs font-bold text-app-muted">
        {icon}
        {label}
      </dt>
      <dd className="mt-2 text-sm font-black text-app-foreground">{value}</dd>
    </div>
  );
}

function TabError({ message }: { message: string }) {
  return (
    <div className="flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-danger">
      <CircleAlert aria-hidden="true" className="size-5 shrink-0" />
      <p className="text-sm font-bold">{message}</p>
    </div>
  );
}

function formatDate(value: string | null) {
  return value ? value.slice(0, 10) : "-";
}

function formatBudget(min: number | null, max: number | null, currency: string | null) {
  if (min == null) return "-";
  const unit = currency ?? "USD";
  return max == null
    ? `${min.toLocaleString()} ${unit}`
    : `${min.toLocaleString()}–${max.toLocaleString()} ${unit}`;
}

function formatLifecycle(value: string) {
  const labels: Record<string, string> = {
    preparing: "Preparing",
    in_progress: "In progress",
    completed: "Completed",
    cancelled: "Cancelled",
    archived: "Archived",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

function formatSowStatus(value: string) {
  const labels: Record<string, string> = {
    draft: "Draft",
    in_review: "In review",
    revision_requested: "Revision requested",
    approved: "Approved",
    superseded: "Superseded",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}
