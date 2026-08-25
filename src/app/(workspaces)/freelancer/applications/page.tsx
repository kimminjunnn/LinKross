import Link from "next/link";
import { ArrowRight, CircleAlert, FileText } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { listFreelancerApplications, type FreelancerApplicationStatus } from "@/lib/backend";

const STATUS_META: Record<FreelancerApplicationStatus, { label: string; className: string }> = {
  submitted: { label: "Under review", className: "border-accent-200 bg-accent-50 text-accent-700" },
  selected: { label: "Selected", className: "border-success/30 bg-success/10 text-success" },
  withdrawn: { label: "Withdrawn", className: "border-app-border bg-app-surface-subtle text-app-muted" },
};

export default async function FreelancerApplicationsPage() {
  const result = await listFreelancerApplications();

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      <PageHeader
        title="My Proposals"
        description="Submitted proposal text and selection status are read from the immutable project records."
        actions={
          <Link href="/opportunities" className="primary-action inline-flex min-h-11 items-center gap-2 rounded-control px-5 text-sm font-semibold">
            Find projects <ArrowRight className="size-4" />
          </Link>
        }
      />

      {!result.ok ? (
        <div className="mt-8 flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-danger">
          <CircleAlert className="size-5 shrink-0" />
          <p className="text-sm">{result.error.message}</p>
        </div>
      ) : result.data.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-app-border-strong p-10 text-center">
          <FileText className="mx-auto size-9 text-app-muted" />
          <h2 className="mt-4 font-semibold text-app-foreground">No proposals yet</h2>
          <p className="mt-2 text-sm text-app-muted">Open a project and submit your delivery approach to see it here.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {result.data.map((application) => {
            const status = STATUS_META[application.status];
            const budget = application.budgetAmount == null
              ? "Project access closed"
              : application.budgetMaxAmount == null
                ? `${application.budgetAmount.toLocaleString()} ${application.currency}`
                : `${application.budgetAmount.toLocaleString()}–${application.budgetMaxAmount.toLocaleString()} ${application.currency}`;

            return (
              <article key={application.proposalId} className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                      {status.label}
                    </span>
                    <h2 className="mt-3 text-xl font-semibold text-app-foreground">{application.title}</h2>
                    <p className="mt-1 text-sm text-app-muted">{application.organizationName} · {budget}</p>
                  </div>
                  {application.status === "selected" ? (
                    <Link href={`/freelancer/projects/${application.projectId}`} className="primary-action inline-flex min-h-10 items-center gap-2 rounded-control px-4 text-sm font-semibold">
                      Open project <ArrowRight className="size-4" />
                    </Link>
                  ) : null}
                </div>
                <details className="mt-5 rounded-control border border-app-border bg-app-surface-subtle p-4">
                  <summary className="cursor-pointer text-sm text-app-foreground">View submitted proposal</summary>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-app-muted">{application.content}</p>
                  {application.optionalNotes ? (
                    <p className="mt-4 border-t border-app-border pt-4 text-sm text-app-muted">{application.optionalNotes}</p>
                  ) : null}
                </details>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
