import { redirect } from "next/navigation";

export default async function LegacyCandidateDetailPage({ params }: { params: Promise<{ assessmentId: string; candidateId: string }> }) {
  const { assessmentId } = await params;
  redirect(`/company/assessments/${assessmentId}/candidates`);
}
