import Link from "next/link";
import { ArrowRight, FilePenLine } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { OPPORTUNITIES } from "@/data/opportunities";

export default function FreelancerApplicationsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Applications"
        title="My applications"
        description="Drafts and submitted proposals stay connected to the original project details."
        actions={
          <Link
            href="/opportunities"
            className="inline-flex min-h-11 items-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-black text-white hover:bg-brand-600"
          >
            Find projects
            <ArrowRight className="size-4" />
          </Link>
        }
      />

      <div className="mt-8 space-y-4">
        {OPPORTUNITIES.map((opportunity) => (
          <article
            key={opportunity.id}
            className="flex flex-col gap-5 rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <FilePenLine className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-brand-700">Draft available</p>
                <h2 className="mt-1 text-lg font-black">{opportunity.title}</h2>
                <p className="mt-1 text-sm text-app-muted">
                  {opportunity.organization} · Apply by {opportunity.deadline}
                </p>
              </div>
            </div>
            <Link
              href={`/freelancer/applications/${opportunity.id}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-app-border-strong px-4 text-sm font-bold hover:bg-app-surface-subtle"
            >
              Write proposal
              <ArrowRight className="size-4" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
