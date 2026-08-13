"use server";

import type { BackendResult, CreateProjectInput, ProjectDraftFormData } from "@/lib/backend";
import { createProject, deleteProjectDraft, getPublicOpportunity, saveProjectDraft } from "@/lib/backend";
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

  // 임시 저장 원문은 실제 등록 이후엔 의미가 없으니 정리한다. 실패해도 등록 자체는 이미 성공한 것이므로 무시한다.
  await deleteProjectDraft();

  return {
    status: "success",
    error: null,
    fieldErrors: {},
    projectId: result.data.projectId,
  };
}

export async function saveProjectDraftAction(
  formData: ProjectDraftFormData,
): Promise<BackendResult<{ updatedAt: string }>> {
  return saveProjectDraft(formData);
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
  // Use KST (+09:00) timezone offset to prevent today's projects from being hidden by UTC comparison
  return `${dateOnly}T${edge === "end" ? "23:59:59.999" : "00:00:00.000"}+09:00`;
}

function isProjectType(value: string): value is (typeof PROJECT_TYPES)[number] {
  return (PROJECT_TYPES as readonly string[]).includes(value);
}

export async function getOpportunityAction(projectId: string) {
  return getPublicOpportunity(projectId);
}

export async function submitProposalAction(projectId: string, content: string) {
  const { createSupabaseServerClient } = require("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  
  console.log("[SubmitActionDebug] Starting submission for project:", projectId);
  console.log("[SubmitActionDebug] Auth User ID:", authData.user?.id);

  if (!authData.user) {
    console.error("[SubmitActionDebug] Auth failed - User not logged in.");
    return { ok: false, error: "로그인이 필요합니다." };
  }

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      project_id: projectId,
      freelancer_id: authData.user.id,
      content: content,
    })
    .select()
    .single();

  if (error) {
    console.error("[SubmitActionDebug] Insert Error:", error);
    return { ok: false, error: error.message };
  }

  console.log("[SubmitActionDebug] Insert Success! Data:", data);
  return { ok: true, data };
}
