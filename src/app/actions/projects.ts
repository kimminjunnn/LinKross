"use server";

import { createProject, getPublicOpportunity } from "@/lib/backend";
import type { CreateProjectInput } from "@/lib/backend";
import type { CreateProjectFormState } from "@/app/actions/projects-form-state";

const PROJECT_TYPES = ["web", "mobile", "saas", "backend", "other"] as const;

export async function createProjectAction(
  _prevState: CreateProjectFormState,
  formData: FormData,
): Promise<CreateProjectFormState> {
  const input = parseCreateProjectForm(formData);
  const result = await createProject(input);

  if (!result.ok) {
    return {
      status: "error",
      error: result.error.message,
      fieldErrors: result.error.fieldErrors ?? {},
      projectId: null,
    };
  }

  return {
    status: "success",
    error: null,
    fieldErrors: {},
    projectId: result.data.projectId,
  };
}

function parseCreateProjectForm(formData: FormData): CreateProjectInput {
  const get = (name: string) => String(formData.get(name) ?? "").trim();
  const projectType = get("projectType");

  return {
    title: get("title"),
    goal: get("goal"),
    requirements: get("requirements"),
    budgetAmount: parseAmount(formData.get("budget")),
    budgetMaxAmount: formData.get("budgetMax") ? parseAmount(formData.get("budgetMax")) : undefined,
    budgetType: get("budgetType") === "range" ? "range" : "fixed",
    startDate: get("startDate"),
    endDate: get("endDate"),
    recruitmentStartAt: toTimestamp(get("recruitmentStart"), "start"),
    recruitmentEndAt: toTimestamp(get("applicationDeadline"), "end"),
    currency: "USD",
    projectType: isProjectType(projectType) ? projectType : undefined,
    technology: get("technology") || undefined,
    deliverables: get("deliverables") || undefined,
    outOfScope: get("outOfScope") || undefined,
    referenceNotes: get("referenceNotes") || undefined,
    applicantGuidance: get("applicantGuidance") || undefined,
  };
}

function parseAmount(raw: FormDataEntryValue | null): number {
  const digits = String(raw ?? "").replace(/[^0-9.]/g, "");
  return digits ? Number(digits) : NaN;
}

function toTimestamp(dateOnly: string, edge: "start" | "end"): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return dateOnly;
  return `${dateOnly}T${edge === "end" ? "23:59:59.999" : "00:00:00.000"}Z`;
}

function isProjectType(value: string): value is (typeof PROJECT_TYPES)[number] {
  return (PROJECT_TYPES as readonly string[]).includes(value);
}

export async function getOpportunityAction(projectId: string) {
  return getPublicOpportunity(projectId);
}
