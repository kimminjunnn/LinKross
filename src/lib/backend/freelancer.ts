import type {
  BackendResult,
  FreelancerApplicationSummary,
  FreelancerProjectSummary,
} from "@/lib/backend/contracts";
import { mapBackendError } from "@/lib/backend/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProposalRow = {
  id: string;
  project_id: string;
  content: string;
  optional_notes: string | null;
  status: "submitted" | "withdrawn";
  submitted_at: string;
  withdrawn_at: string | null;
};

type SelectionRow = {
  project_id: string;
  proposal_id: string;
  selected_at: string;
};

type ProjectRow = {
  id: string;
  company_id: string;
  lifecycle_stage: string;
  current_requirement_version_id: string | null;
};

type RequirementRow = {
  id: string;
  title: string;
  budget_amount: number | string;
  budget_max_amount: number | string | null;
  currency: string;
  start_date: string;
  end_date: string;
  recruitment_end_at: string;
};

type CompanyProfileRow = {
  id: string;
  organization_name: string;
};

export async function listFreelancerApplications(): Promise<
  BackendResult<FreelancerApplicationSummary[]>
> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  }

  const { data: proposals, error: proposalsError } = await supabase
    .from("proposals")
    .select("id, project_id, content, optional_notes, status, submitted_at, withdrawn_at")
    .eq("freelancer_id", authData.user.id)
    .order("submitted_at", { ascending: false });

  if (proposalsError) {
    return { ok: false, error: mapBackendError(proposalsError, "지원 내역을 불러오지 못했습니다.") };
  }

  const proposalRows = (proposals ?? []) as ProposalRow[];
  if (proposalRows.length === 0) return { ok: true, data: [] };

  const projectIds = Array.from(new Set(proposalRows.map((proposal) => proposal.project_id)));
  const [{ data: selections, error: selectionError }, { data: projects, error: projectError }] =
    await Promise.all([
      supabase
        .from("selections")
        .select("project_id, proposal_id, selected_at")
        .in("project_id", projectIds),
      supabase
        .from("projects")
        .select("id, company_id, lifecycle_stage, current_requirement_version_id")
        .in("id", projectIds),
    ]);

  if (selectionError || projectError) {
    return {
      ok: false,
      error: mapBackendError(selectionError ?? projectError, "지원 프로젝트 정보를 불러오지 못했습니다."),
    };
  }

  const projectRows = (projects ?? []) as ProjectRow[];
  const requirementIds = projectRows
    .map((project) => project.current_requirement_version_id)
    .filter((id): id is string => Boolean(id));
  const companyIds = Array.from(new Set(projectRows.map((project) => project.company_id)));

  const [{ data: requirements, error: requirementError }, { data: companies, error: companyError }] =
    await Promise.all([
      requirementIds.length
        ? supabase
            .from("project_requirement_versions")
            .select(
              "id, title, budget_amount, budget_max_amount, currency, start_date, end_date, recruitment_end_at",
            )
            .in("id", requirementIds)
        : Promise.resolve({ data: [], error: null }),
      companyIds.length
        ? supabase.from("company_profiles").select("id, organization_name").in("id", companyIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (requirementError || companyError) {
    return {
      ok: false,
      error: mapBackendError(requirementError ?? companyError, "지원 프로젝트 원문을 불러오지 못했습니다."),
    };
  }

  const selectionByProject = new Map(
    ((selections ?? []) as SelectionRow[]).map((selection) => [selection.project_id, selection]),
  );
  const projectById = new Map(projectRows.map((project) => [project.id, project]));
  const requirementById = new Map(
    ((requirements ?? []) as RequirementRow[]).map((requirement) => [requirement.id, requirement]),
  );
  const companyById = new Map(
    ((companies ?? []) as CompanyProfileRow[]).map((company) => [company.id, company]),
  );

  return {
    ok: true,
    data: proposalRows.map((proposal) => {
      const project = projectById.get(proposal.project_id);
      const requirement = project?.current_requirement_version_id
        ? requirementById.get(project.current_requirement_version_id)
        : undefined;
      const selection = selectionByProject.get(proposal.project_id);

      return {
        proposalId: proposal.id,
        projectId: proposal.project_id,
        title: requirement?.title ?? "접근이 종료된 프로젝트",
        organizationName: project ? companyById.get(project.company_id)?.organization_name ?? "발주사" : "발주사",
        status:
          selection?.proposal_id === proposal.id
            ? "selected"
            : proposal.status === "withdrawn"
              ? "withdrawn"
              : "submitted",
        content: proposal.content,
        optionalNotes: proposal.optional_notes,
        submittedAt: proposal.submitted_at,
        withdrawnAt: proposal.withdrawn_at,
        budgetAmount: requirement ? Number(requirement.budget_amount) : null,
        budgetMaxAmount:
          requirement?.budget_max_amount == null ? null : Number(requirement.budget_max_amount),
        currency: requirement?.currency ?? null,
        recruitmentEndAt: requirement?.recruitment_end_at ?? null,
      };
    }),
  };
}

export async function listFreelancerProjects(): Promise<BackendResult<FreelancerProjectSummary[]>> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  }

  const { data: selections, error: selectionError } = await supabase
    .from("selections")
    .select("project_id, proposal_id, selected_at")
    .order("selected_at", { ascending: false });

  if (selectionError) {
    return { ok: false, error: mapBackendError(selectionError, "선정 프로젝트를 불러오지 못했습니다.") };
  }

  const selectionRows = (selections ?? []) as SelectionRow[];
  if (selectionRows.length === 0) return { ok: true, data: [] };

  const projectIds = selectionRows.map((selection) => selection.project_id);
  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("id, company_id, lifecycle_stage, current_requirement_version_id")
    .in("id", projectIds);

  if (projectError) {
    return { ok: false, error: mapBackendError(projectError, "프로젝트 정보를 불러오지 못했습니다.") };
  }

  const projectRows = (projects ?? []) as ProjectRow[];
  const requirementIds = projectRows
    .map((project) => project.current_requirement_version_id)
    .filter((id): id is string => Boolean(id));
  const companyIds = Array.from(new Set(projectRows.map((project) => project.company_id)));

  const [requirementsResult, companiesResult, milestonesResult] = await Promise.all([
    requirementIds.length
      ? supabase
          .from("project_requirement_versions")
          .select("id, title, budget_amount, budget_max_amount, currency, start_date, end_date, recruitment_end_at")
          .in("id", requirementIds)
      : Promise.resolve({ data: [], error: null }),
    companyIds.length
      ? supabase.from("company_profiles").select("id, organization_name").in("id", companyIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("milestones").select("project_id, status").in("project_id", projectIds),
  ]);

  const aggregateError = requirementsResult.error ?? companiesResult.error ?? milestonesResult.error;
  if (aggregateError) {
    return { ok: false, error: mapBackendError(aggregateError, "프로젝트 진행 정보를 불러오지 못했습니다.") };
  }

  const requirementById = new Map(
    ((requirementsResult.data ?? []) as RequirementRow[]).map((requirement) => [requirement.id, requirement]),
  );
  const companyById = new Map(
    ((companiesResult.data ?? []) as CompanyProfileRow[]).map((company) => [company.id, company]),
  );
  const milestoneCounts = new Map<string, { total: number; approved: number }>();
  for (const row of (milestonesResult.data ?? []) as { project_id: string; status: string }[]) {
    const counts = milestoneCounts.get(row.project_id) ?? { total: 0, approved: 0 };
    counts.total += 1;
    if (row.status === "approved") counts.approved += 1;
    milestoneCounts.set(row.project_id, counts);
  }
  const projectById = new Map(projectRows.map((project) => [project.id, project]));

  return {
    ok: true,
    data: selectionRows.map((selection) => {
      const project = projectById.get(selection.project_id);
      const requirement = project?.current_requirement_version_id
        ? requirementById.get(project.current_requirement_version_id)
        : undefined;
      const counts = milestoneCounts.get(selection.project_id) ?? { total: 0, approved: 0 };

      return {
        projectId: selection.project_id,
        proposalId: selection.proposal_id,
        title: requirement?.title ?? "프로젝트",
        organizationName: project ? companyById.get(project.company_id)?.organization_name ?? "발주사" : "발주사",
        lifecycleStage: project?.lifecycle_stage ?? "preparing",
        startDate: requirement?.start_date ?? null,
        endDate: requirement?.end_date ?? null,
        budgetAmount: requirement ? Number(requirement.budget_amount) : null,
        budgetMaxAmount:
          requirement?.budget_max_amount == null ? null : Number(requirement.budget_max_amount),
        currency: requirement?.currency ?? null,
        selectedAt: selection.selected_at,
        milestoneCount: counts.total,
        approvedMilestoneCount: counts.approved,
      };
    }),
  };
}
