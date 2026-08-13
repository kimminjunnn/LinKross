import { getSowWorkspaceContext } from "@/lib/backend";

import { SowWorkspace } from "./_components/sow-draft-workspace";

export default async function SowPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const result = await getSowWorkspaceContext(projectId);

  if (!result.ok) {
    return (
      <div className="rounded-card border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
        {result.error.message}
      </div>
    );
  }

  return <SowWorkspace context={result.data} />;
}
