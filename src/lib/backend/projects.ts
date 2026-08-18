import type {
  BackendResult,
  CompanyProjectDetail,
  CompanyProjectSummary,
  CreateProjectInput,
  CreateProjectOutput,
  OpportunityDetail,
  OpportunitySummary,
} from "@/lib/backend/contracts";
import { mapBackendError } from "@/lib/backend/errors";
import { isUuid, validateCreateProject } from "@/lib/backend/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { translateToEnglish } from "@/lib/backend/translation";

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
    .select(
      "id,title,organization_name,goal,project_type,technology,budget_amount,budget_max_amount,budget_type,currency,start_date,end_date,recruitment_end_at,created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false, error: mapBackendError(error, "공개 프로젝트를 불러오지 못했습니다.") };
  }

  const summaries = ((data ?? []) as OpportunityRow[]).map(toOpportunitySummary);

  const translatedSummaries = await Promise.all(
    summaries.map(async (opportunity) => {
      const [translatedTitle, translatedGoal] = await Promise.all([
        translateToEnglish(opportunity.title),
        translateToEnglish(opportunity.goal),
      ]);
      return {
        ...opportunity,
        title: translatedTitle,
        goal: translatedGoal,
      };
    })
  );

  return { ok: true, data: translatedSummaries };
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
    .select(
      "id,title,organization_name,goal,project_type,technology,requirements,deliverables,out_of_scope,applicant_guidance,budget_amount,budget_max_amount,budget_type,currency,start_date,end_date,recruitment_start_at,recruitment_end_at,current_requirement_version_id,created_at",
    )
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: mapBackendError(error, "프로젝트를 불러오지 못했습니다.") };
  }
  if (!data) {
    return { ok: false, error: { code: "NOT_FOUND", message: "모집 중인 프로젝트를 찾을 수 없습니다." } };
  }

  const row = data as OpportunityRow;
  const summary = toOpportunitySummary(row);

  const [
    translatedTitle,
    translatedGoal,
    translatedRequirements,
    translatedDeliverables,
    translatedOutOfScope,
    translatedApplicantGuidance,
  ] = await Promise.all([
    translateToEnglish(summary.title),
    translateToEnglish(summary.goal),
    translateToEnglish(row.requirements),
    translateToEnglish(row.deliverables),
    translateToEnglish(row.out_of_scope),
    translateToEnglish(row.applicant_guidance),
  ]);

  return {
    ok: true,
    data: {
      ...summary,
      title: translatedTitle,
      goal: translatedGoal,
      requirements: translatedRequirements,
      deliverables: translatedDeliverables || null,
      outOfScope: translatedOutOfScope || null,
      applicantGuidance: translatedApplicantGuidance || null,
      recruitmentStartAt: row.recruitment_start_at,
      currentRequirementVersionId: row.current_requirement_version_id,
      createdAt: row.created_at,
    },
  };
}

interface CompanyProjectRow {
  id: string;
  status: "recruiting" | "closed";
  lifecycle_stage: string;
  current_requirement_version_id: string | null;
  created_at: string;
}

interface CompanyProjectVersionRow {
  id: string;
  title: string;
  budget_amount: number | string;
  budget_max_amount: number | string | null;
  currency: string;
  recruitment_end_at: string;
}

export async function listCompanyProjects(): Promise<BackendResult<CompanyProjectSummary[]>> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  }

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, status, lifecycle_stage, current_requirement_version_id, created_at")
    .eq("company_id", authData.user.id)
    .eq("lifecycle_stage", "preparing")
    .order("created_at", { ascending: false });

  if (projectsError) {
    return { ok: false, error: mapBackendError(projectsError, "프로젝트 목록을 불러오지 못했습니다.") };
  }

  const projectRows = (projects ?? []) as CompanyProjectRow[];
  if (projectRows.length === 0) {
    return { ok: true, data: [] };
  }

  const versionIds = projectRows
    .map((project) => project.current_requirement_version_id)
    .filter((id): id is string => Boolean(id));

  const { data: versions, error: versionsError } = await supabase
    .from("project_requirement_versions")
    .select("id, title, budget_amount, budget_max_amount, currency, recruitment_end_at")
    .in("id", versionIds);

  if (versionsError) {
    return { ok: false, error: mapBackendError(versionsError, "프로젝트 목록을 불러오지 못했습니다.") };
  }

  const versionById = new Map(
    ((versions ?? []) as CompanyProjectVersionRow[]).map((version) => [version.id, version]),
  );

  const projectIds = projectRows.map((project) => project.id);
  const { data: proposalRows, error: proposalsError } = await supabase
    .from("proposals")
    .select("project_id")
    .in("project_id", projectIds)
    .eq("status", "submitted");

  if (proposalsError) {
    return { ok: false, error: mapBackendError(proposalsError, "지원자 수를 불러오지 못했습니다.") };
  }

  const proposalCountByProject = new Map<string, number>();
  for (const row of (proposalRows ?? []) as { project_id: string }[]) {
    proposalCountByProject.set(row.project_id, (proposalCountByProject.get(row.project_id) ?? 0) + 1);
  }

  const summaries: CompanyProjectSummary[] = projectRows.map((project) => {
    const version = project.current_requirement_version_id
      ? versionById.get(project.current_requirement_version_id)
      : undefined;

    return {
      id: project.id,
      title: version?.title ?? "(제목 없음)",
      status: project.status,
      lifecycleStage: project.lifecycle_stage,
      budgetAmount: version ? Number(version.budget_amount) : 0,
      budgetMaxAmount: version?.budget_max_amount == null ? null : Number(version.budget_max_amount),
      currency: version?.currency ?? "USD",
      recruitmentEndAt: version?.recruitment_end_at ?? null,
      proposalCount: proposalCountByProject.get(project.id) ?? 0,
      createdAt: project.created_at,
    };
  });

  return { ok: true, data: summaries };
}

interface CompanyProjectDetailRow {
  title: string;
  project_type: string | null;
  technology: string | null;
  goal: string;
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
}

export async function getCompanyProjectDetail(
  projectId: string,
): Promise<BackendResult<CompanyProjectDetail>> {
  if (!isUuid(projectId)) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 프로젝트 ID가 아닙니다." } };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, status, lifecycle_stage, created_at, current_requirement_version_id")
    .eq("id", projectId)
    .eq("company_id", authData.user.id)
    .maybeSingle();

  if (projectError) {
    return { ok: false, error: mapBackendError(projectError, "프로젝트를 불러오지 못했습니다.") };
  }
  if (!project || !project.current_requirement_version_id) {
    return { ok: false, error: { code: "NOT_FOUND", message: "프로젝트를 찾을 수 없습니다." } };
  }

  const { data: version, error: versionError } = await supabase
    .from("project_requirement_versions")
    .select(
      "title, project_type, technology, goal, requirements, deliverables, out_of_scope, applicant_guidance, budget_amount, budget_max_amount, budget_type, currency, start_date, end_date, recruitment_start_at, recruitment_end_at",
    )
    .eq("id", project.current_requirement_version_id)
    .maybeSingle();

  if (versionError || !version) {
    return { ok: false, error: mapBackendError(versionError, "프로젝트 요구사항을 불러오지 못했습니다.") };
  }

  const row = version as CompanyProjectDetailRow;

  return {
    ok: true,
    data: {
      id: project.id,
      title: row.title,
      projectType: row.project_type,
      technology: row.technology,
      goal: row.goal,
      requirements: row.requirements,
      deliverables: row.deliverables,
      outOfScope: row.out_of_scope,
      applicantGuidance: row.applicant_guidance,
      budgetAmount: Number(row.budget_amount),
      budgetMaxAmount: row.budget_max_amount == null ? null : Number(row.budget_max_amount),
      budgetType: row.budget_type,
      currency: row.currency,
      startDate: row.start_date,
      endDate: row.end_date,
      recruitmentStartAt: row.recruitment_start_at,
      recruitmentEndAt: row.recruitment_end_at,
      status: project.status,
      lifecycleStage: project.lifecycle_stage,
      createdAt: project.created_at,
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
