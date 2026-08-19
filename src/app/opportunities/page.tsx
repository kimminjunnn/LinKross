import { PageHeader } from "@/components/page/page-header";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { OpportunitiesList } from "@/components/opportunities/opportunities-list";
import { listPublicOpportunities } from "@/lib/backend/projects";

export default async function OpportunitiesPage() {
  const result = await listPublicOpportunities();

  return (
    <WorkspaceShell workspace="freelancer">
      <div className="mx-auto w-full max-w-6xl pb-16">
        
        {/* Simple & Clean Page Header matching the rest of the workspace */}
        <PageHeader
          eyebrow="Marketplace"
          title="Find Projects"
          description="Browse requirements with pre-defined budgets and submit SOW proposals."
        />

        {result.ok ? (
          <OpportunitiesList opportunities={result.data} />
        ) : (
          <div className="mt-8 rounded-card border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            <h2 className="font-semibold">프로젝트를 불러오지 못했습니다.</h2>
            <p className="mt-2">{result.error.message}</p>
          </div>
        )}
        
      </div>
    </WorkspaceShell>
  );
}
