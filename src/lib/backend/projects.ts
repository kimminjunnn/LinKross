import type {
  BackendResult,
  CreateProjectInput,
  CreateProjectOutput,
  OpportunityDetail,
  OpportunitySummary,
} from "@/lib/backend/contracts";
import { mapBackendError } from "@/lib/backend/errors";
import { isUuid, validateCreateProject } from "@/lib/backend/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface OpportunityRow {
  id: string;
  title: string;
  organization_name: string;
  goal: string;
  project_type: string | null;
  technology: string | null;
  requirements: string;
  deliverables: string | null;
  out_of_scope: string | null;
  applicant_guidance: string | null;
  budget_amount: number | string;
  budget_max_amount: number | string | null;
  budget_type: "fixed" | "range";
  currency: string;
  start_date: string;
  end_date: string;
  recruitment_start_at: string;
  recruitment_end_at: string;
  current_requirement_version_id: string;
  created_at: string;
}

export async function createProject(
  input: CreateProjectInput,
): Promise<BackendResult<CreateProjectOutput>> {
  const validationError = validateCreateProject(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  }

  const { data, error } = await supabase.rpc("create_project_with_requirements", {
    p_title: input.title.trim(),
    p_goal: input.goal.trim(),
    p_requirements: input.requirements.trim(),
    p_budget_amount: input.budgetAmount,
    p_start_date: input.startDate,
    p_end_date: input.endDate,
    p_recruitment_start_at: input.recruitmentStartAt,
    p_recruitment_end_at: input.recruitmentEndAt,
    p_currency: (input.currency ?? "USD").toUpperCase(),
    p_project_type: input.projectType ?? null,
    p_technology: emptyToNull(input.technology),
    p_deliverables: emptyToNull(input.deliverables),
    p_out_of_scope: emptyToNull(input.outOfScope),
    p_reference_notes: emptyToNull(input.referenceNotes),
    p_applicant_guidance: emptyToNull(input.applicantGuidance),
    p_budget_max_amount: input.budgetMaxAmount ?? null,
    p_budget_type: input.budgetType ?? "fixed",
  });

  if (error || typeof data !== "string") {
    return { ok: false, error: mapBackendError(error, "프로젝트를 생성하지 못했습니다.") };
  }

  return { ok: true, data: { projectId: data } };
}

export async function listPublicOpportunities(): Promise<BackendResult<OpportunitySummary[]>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("public_opportunities")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false, error: mapBackendError(error, "공개 프로젝트를 불러오지 못했습니다.") };
  }

  return { ok: true, data: ((data ?? []) as OpportunityRow[]).map(toOpportunitySummary) };
}

export async function getPublicOpportunity(
  projectId: string,
): Promise<BackendResult<OpportunityDetail>> {
  if (!isUuid(projectId)) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 프로젝트 ID가 아닙니다." } };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("public_opportunities")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: mapBackendError(error, "프로젝트를 불러오지 못했습니다.") };
  }
  if (!data) {
    return { ok: false, error: { code: "NOT_FOUND", message: "모집 중인 프로젝트를 찾을 수 없습니다." } };
  }

  const row = data as OpportunityRow;
  return {
    ok: true,
    data: {
      ...toOpportunitySummary(row),
      requirements: row.requirements,
      deliverables: row.deliverables,
      outOfScope: row.out_of_scope,
      applicantGuidance: row.applicant_guidance,
      recruitmentStartAt: row.recruitment_start_at,
      currentRequirementVersionId: row.current_requirement_version_id,
      createdAt: row.created_at,
    },
  };
}

function toOpportunitySummary(row: OpportunityRow): OpportunitySummary {
  return {
    id: row.id,
    title: row.title,
    organizationName: row.organization_name,
    goal: row.goal,
    projectType: row.project_type,
    technology: row.technology,
    budgetAmount: Number(row.budget_amount),
    budgetMaxAmount: row.budget_max_amount == null ? null : Number(row.budget_max_amount),
    budgetType: row.budget_type,
    currency: row.currency,
    startDate: row.start_date,
    endDate: row.end_date,
    recruitmentEndAt: row.recruitment_end_at,
  };
}

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
