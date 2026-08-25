import { CircleAlert } from "lucide-react";

import { getSowWorkspaceContext } from "@/lib/backend";

import { SowWorkspace } from "./_components/sow-draft-workspace";

export default async function SowPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams?: Promise<{ mode?: string }>;
}) {
  const { projectId } = await params;
  const resolvedSearchParams = await searchParams;
  const isRevisionMode = resolvedSearchParams?.mode === "revision";
  const result = await getSowWorkspaceContext(projectId);

  if (!result.ok) {
    return (
      <div className="flex gap-3 rounded-card border border-app-border bg-app-surface p-4 text-sm text-app-foreground">
        <CircleAlert className="size-5 shrink-0 text-danger" />
        오류: {result.error.message}
      </div>
    );
  }

  return <SowWorkspace context={result.data} isRevisionMode={isRevisionMode} />;
}
