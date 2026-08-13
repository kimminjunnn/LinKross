import { listCompanyProjects } from "@/lib/backend";

import { AssessmentsList } from "./_components/assessments-list";

export default async function AssessmentsPage() {
  const result = await listCompanyProjects();

  return <AssessmentsList result={result} />;
}
