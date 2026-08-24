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

  const { data: companyProfile, error: companyProfileError } = await supabase
    .from("company_profiles")
    .select("id")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (companyProfileError) {
    return { ok: false, error: mapBackendError(companyProfileError, "회사 정보를 확인하지 못했습니다.") };
  }
  if (!companyProfile) {
    return {
      ok: false,
      error: {
        code: "COMPANY_PROFILE_REQUIRED",
        message: "프로젝트를 등록하려면 먼저 회사 정보(조직명, 담당자 등)를 입력해주세요.",
      },
    };
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

export async function uploadProjectFile(
  projectId: string,
  file: File,
): Promise<BackendResult<{ fileId: string }>> {
  if (!isUuid(projectId) || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "첨부할 파일을 확인해주세요." } };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "첨부 파일은 20MB 이하여야 합니다." } };
  }
  const allowedTypes = new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/webp",
    "text/plain",
  ]);
  if (!allowedTypes.has(file.type)) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "PDF, DOCX, PNG, JPG, WebP 또는 텍스트 파일만 첨부할 수 있습니다." } };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("current_requirement_version_id")
    .eq("id", projectId)
    .eq("company_id", authData.user.id)
    .maybeSingle();
  if (projectError || !project?.current_requirement_version_id) {
    return { ok: false, error: mapBackendError(projectError, "첨부 대상 요구사항 버전을 찾지 못했습니다.") };
  }

  const safeName = file.name.normalize("NFKC").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120) || "attachment";
  const storagePath = `${projectId}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from("linkross-project-files").upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) return { ok: false, error: mapBackendError(uploadError, "파일을 업로드하지 못했습니다.") };

  const { data, error } = await supabase.from("project_files").insert({
    project_id: projectId,
    requirement_version_id: project.current_requirement_version_id,
    bucket_id: "linkross-project-files",
    storage_path: storagePath,
    original_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    visibility: "public",
    uploaded_by: authData.user.id,
  }).select("id").single();
  if (error || !data) {
    await supabase.storage.from("linkross-project-files").remove([storagePath]);
    return { ok: false, error: mapBackendError(error, "파일 기록을 저장하지 못했습니다.") };
  }
  return { ok: true, data: { fileId: data.id } };
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
      const [translatedTitle, translatedGoal, translatedOrgName] = await Promise.all([
        translateToEnglish(opportunity.title),
        translateToEnglish(opportunity.goal),
        translateToEnglish(opportunity.organizationName),
      ]);
      return {
        ...opportunity,
        title: translatedTitle,
        goal: translatedGoal,
        organizationName: translatedOrgName,
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
  const [{ data, error }, { data: fileRows, error: filesError }] = await Promise.all([
    supabase
      .from("public_opportunities")
      .select(
        "id,title,organization_name,goal,project_type,technology,requirements,deliverables,out_of_scope,applicant_guidance,budget_amount,budget_max_amount,budget_type,currency,start_date,end_date,recruitment_start_at,recruitment_end_at,current_requirement_version_id,created_at",
      )
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("project_files")
      .select("id, storage_path, original_name, mime_type, size_bytes")
      .eq("project_id", projectId)
      .eq("visibility", "public")
      .order("created_at", { ascending: true }),
  ]);

  if (error) {
    return { ok: false, error: mapBackendError(error, "프로젝트를 불러오지 못했습니다.") };
  }
  if (!data) {
    return { ok: false, error: { code: "NOT_FOUND", message: "모집 중인 프로젝트를 찾을 수 없습니다." } };
  }
  if (filesError) return { ok: false, error: mapBackendError(filesError, "프로젝트 첨부파일을 불러오지 못했습니다.") };

  const attachments = await Promise.all((fileRows ?? []).map(async (file) => {
    const { data: signed } = await supabase.storage.from("linkross-project-files").createSignedUrl(file.storage_path, 3600);
    return {
      id: file.id,
      name: file.original_name,
      mimeType: file.mime_type,
      sizeBytes: Number(file.size_bytes),
      downloadUrl: signed?.signedUrl ?? "",
    };
  }));

  const row = data as OpportunityRow;
  const summary = toOpportunitySummary(row);

  const [
    translatedTitle,
    translatedGoal,
    translatedOrgName,
    translatedRequirements,
    translatedDeliverables,
    translatedOutOfScope,
    translatedApplicantGuidance,
  ] = await Promise.all([
    translateToEnglish(summary.title),
    translateToEnglish(summary.goal),
    translateToEnglish(summary.organizationName),
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
      organizationName: translatedOrgName,
      requirements: translatedRequirements,
      deliverables: translatedDeliverables || null,
      outOfScope: translatedOutOfScope || null,
      applicantGuidance: translatedApplicantGuidance || null,
      recruitmentStartAt: row.recruitment_start_at,
      currentRequirementVersionId: row.current_requirement_version_id,
      createdAt: row.created_at,
      attachments: attachments.filter((attachment) => attachment.downloadUrl),
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
  return listOwnedCompanyProjects("preparing", true);
}

export async function listCompanyWorkspaceProjects(): Promise<BackendResult<CompanyProjectSummary[]>> {
  return listOwnedCompanyProjects(null, false);
}

async function listOwnedCompanyProjects(
  lifecycleStage: "preparing" | null,
  onlyOpenRecruitment: boolean,
): Promise<BackendResult<CompanyProjectSummary[]>> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  }

  let projectsQuery = supabase
    .from("projects")
    .select("id, status, lifecycle_stage, current_requirement_version_id, created_at")
    .eq("company_id", authData.user.id)
    .order("created_at", { ascending: false });

  if (lifecycleStage) {
    projectsQuery = projectsQuery.eq("lifecycle_stage", lifecycleStage);
  }
  if (onlyOpenRecruitment) {
    projectsQuery = projectsQuery.eq("status", "recruiting");
  }

  const { data: projects, error: projectsError } = await projectsQuery;

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

  const visibleProjectRows = onlyOpenRecruitment
    ? projectRows.filter((project) => {
        const version = project.current_requirement_version_id
          ? versionById.get(project.current_requirement_version_id)
          : undefined;
        return version != null && new Date(version.recruitment_end_at).getTime() >= Date.now();
      })
    : projectRows;

  if (visibleProjectRows.length === 0) {
    return { ok: true, data: [] };
  }

  const projectIds = visibleProjectRows.map((project) => project.id);
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

  const [approvedSowsResult, milestonesResult, paymentsResult] = await Promise.all([
    supabase.from("sow_versions").select("id").in("project_id", projectIds).eq("status", "approved"),
    supabase.from("milestones").select("id, project_id, sow_version_id, status").in("project_id", projectIds),
    supabase
      .from("payments")
      .select("milestone_record_id")
      .in("project_id", projectIds)
      .eq("status", "completed"),
  ]);

  const milestoneAggregateError = approvedSowsResult.error ?? milestonesResult.error ?? paymentsResult.error;
  if (milestoneAggregateError) {
    return { ok: false, error: mapBackendError(milestoneAggregateError, "마일스톤 진행 정보를 불러오지 못했습니다.") };
  }

  const approvedSowIds = new Set(((approvedSowsResult.data ?? []) as { id: string }[]).map((sow) => sow.id));
  const paidMilestoneIds = new Set(
    ((paymentsResult.data ?? []) as { milestone_record_id: string | null }[])
      .map((payment) => payment.milestone_record_id)
      .filter((id): id is string => Boolean(id)),
  );
  const milestoneCountByProject = new Map<string, { total: number; approved: number; paid: number }>();
  for (const row of (milestonesResult.data ?? []) as {
    id: string;
    project_id: string;
    sow_version_id: string;
    status: string;
  }[]) {
    if (!approvedSowIds.has(row.sow_version_id)) continue;
    const counts = milestoneCountByProject.get(row.project_id) ?? { total: 0, approved: 0, paid: 0 };
    counts.total += 1;
    if (row.status === "approved") {
      counts.approved += 1;
      // 지급은 승인 이후 단계라 승인된 마일스톤만 지급 완료로 센다.
      if (paidMilestoneIds.has(row.id)) counts.paid += 1;
    }
    milestoneCountByProject.set(row.project_id, counts);
  }

  const summaries: CompanyProjectSummary[] = visibleProjectRows.map((project) => {
    const version = project.current_requirement_version_id
      ? versionById.get(project.current_requirement_version_id)
      : undefined;
    const milestoneCounts = milestoneCountByProject.get(project.id) ?? { total: 0, approved: 0, paid: 0 };

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
      milestoneCount: milestoneCounts.total,
      approvedMilestoneCount: milestoneCounts.approved,
      paidMilestoneCount: milestoneCounts.paid,
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
