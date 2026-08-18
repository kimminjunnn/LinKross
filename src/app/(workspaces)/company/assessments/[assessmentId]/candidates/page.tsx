import { getCompanyProjectDetail, listProjectProposals } from "@/lib/backend";

import { CandidateComparisonDashboard } from "./_components/candidate-comparison-dashboard";

export default async function CandidatesPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  const [projectDetail, proposals] = await Promise.all([
    getCompanyProjectDetail(assessmentId),
    listProjectProposals(assessmentId),
  ]);

  return <CandidateComparisonDashboard projectDetail={projectDetail} proposals={proposals} />;
}
