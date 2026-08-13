import { getCompanyProjectDetail } from "@/lib/backend";

import { CandidateComparisonDashboard } from "./_components/candidate-comparison-dashboard";

export default async function CandidatesPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  const projectDetail = await getCompanyProjectDetail(assessmentId);

  return <CandidateComparisonDashboard projectDetail={projectDetail} />;
}
