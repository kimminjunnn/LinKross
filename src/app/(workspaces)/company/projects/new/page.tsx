import { getProjectDraft } from "@/lib/backend";

import { NewProjectForm } from "./_components/new-project-form";

export default async function NewProjectPage() {
  const initialDraft = await getProjectDraft();

  return <NewProjectForm initialDraft={initialDraft} />;
}
