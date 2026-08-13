import { OPPORTUNITIES } from "@/data/opportunities";
import { PageHeader } from "@/components/page/page-header";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { OpportunitiesList } from "@/components/opportunities/opportunities-list";

export default function OpportunitiesPage() {
  return (
    <WorkspaceShell workspace="freelancer">
      <div className="mx-auto w-full max-w-6xl pb-16">
        
        {/* Simple & Clean Page Header matching the rest of the workspace */}
        <PageHeader
          eyebrow="Marketplace"
          title="Find Projects"
          description="Browse requirements with pre-defined budgets and submit SOW proposals."
        />

        {/* Client-side search, filtering, and interactive lists */}
        <OpportunitiesList opportunities={OPPORTUNITIES} />
        
      </div>
    </WorkspaceShell>
  );
}
