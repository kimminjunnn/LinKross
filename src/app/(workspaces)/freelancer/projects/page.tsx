import Link from "next/link";
import { Search } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";

export default function FreelancerProjectsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Delivery workspace"
        title="My projects"
        description="Selected projects will appear here with their approved SOW, milestones, commit submissions, verification history, and payment status."
      />
      <section className="mt-8 rounded-card border border-dashed border-app-border-strong bg-app-surface p-10 text-center">
        <h2 className="text-xl font-black">No selected projects yet</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-app-muted">
          Once a client selects your proposal, the shared project record will continue
          here without losing the original scope or proposal version.
        </p>
        <Link
          href="/opportunities"
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-black text-white hover:bg-brand-600"
        >
          <Search className="size-4" />
          Browse opportunities
        </Link>
      </section>
    </div>
  );
}
