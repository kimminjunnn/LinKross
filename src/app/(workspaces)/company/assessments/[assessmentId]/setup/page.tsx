import { redirect } from "next/navigation";

export default async function LegacyAssessmentSetupPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = await params;
  redirect(`/company/assessments/${assessmentId}/candidates`);
}
