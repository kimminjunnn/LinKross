import type {
  BackendResult,
  WorkspaceNotification,
} from "@/lib/backend/contracts";
import { mapBackendError } from "@/lib/backend/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProjectRow = {
  id: string;
  company_id: string;
  current_requirement_version_id: string | null;
};

type RequirementRow = {
  id: string;
  title: string;
};

type SelectionRow = {
  project_id: string;
  proposal_id: string;
  selected_at: string;
};

type ProposalRow = {
  id: string;
  project_id: string;
  freelancer_id: string;
};

type SowVersionRow = {
  id: string;
  project_id: string;
  version_number: number;
  status: "draft" | "in_review" | "revision_requested" | "approved" | "superseded";
  submitted_for_review_at: string | null;
  approved_at: string | null;
  updated_at: string;
};

type SowApprovalRow = {
  sow_version_id: string;
  approver_role: "company" | "freelancer";
  approver_name_snapshot: string | null;
  approved_at: string;
};

type SowRevisionRequestRow = {
  id: string;
  project_id: string;
  sow_version_id: string;
  requester_name_snapshot: string | null;
  reason: string;
  requested_at: string;
};

type CompanyProfileRow = {
  id: string;
  organization_name: string;
};

export async function listCompanyNotifications(): Promise<
  BackendResult<WorkspaceNotification[]>
> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  }

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, company_id, current_requirement_version_id")
    .eq("company_id", authData.user.id);

  if (projectsError) {
    return {
      ok: false,
      error: mapBackendError(projectsError, "알림 대상 프로젝트를 불러오지 못했습니다."),
    };
  }

  const projectRows = (projects ?? []) as ProjectRow[];
  if (projectRows.length === 0) return { ok: true, data: [] };

  const projectIds = projectRows.map((project) => project.id);
  const requirementIds = projectRows
    .map((project) => project.current_requirement_version_id)
    .filter((id): id is string => Boolean(id));

  const [{ data: requirements, error: requirementsError }, { data: sowVersions, error: sowsError }] =
    await Promise.all([
      requirementIds.length
        ? supabase.from("project_requirement_versions").select("id, title").in("id", requirementIds)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("sow_versions")
        .select("id, project_id, version_number, status, submitted_for_review_at, approved_at, updated_at")
        .in("project_id", projectIds)
        .in("status", ["in_review", "approved", "revision_requested"])
        .order("updated_at", { ascending: false }),
    ]);

  if (requirementsError || sowsError) {
    return {
      ok: false,
      error: mapBackendError(
        requirementsError ?? sowsError,
        "업무명세서 알림 정보를 불러오지 못했습니다.",
      ),
    };
  }

  const sowRows = (sowVersions ?? []) as SowVersionRow[];
  const sowIds = sowRows.map((sow) => sow.id);
  const [
    { data: approvals, error: approvalsError },
    { data: revisionRequests, error: revisionRequestsError },
  ] = await Promise.all([
    sowIds.length
      ? supabase
          .from("sow_approvals")
          .select("sow_version_id, approver_role, approver_name_snapshot, approved_at")
          .in("sow_version_id", sowIds)
          .order("approved_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("sow_revision_requests")
      .select("id, project_id, sow_version_id, requester_name_snapshot, reason, requested_at")
      .in("project_id", projectIds)
      .order("requested_at", { ascending: false }),
  ]);

  if (approvalsError || revisionRequestsError) {
    return {
      ok: false,
      error: mapBackendError(
        approvalsError ?? revisionRequestsError,
        "업무명세서 알림을 불러오지 못했습니다.",
      ),
    };
  }

  const titleByRequirementId = new Map(
    ((requirements ?? []) as RequirementRow[]).map((requirement) => [requirement.id, requirement.title]),
  );
  const projectById = new Map(projectRows.map((project) => [project.id, project]));
  const approvalsBySowId = new Map<string, SowApprovalRow[]>();

  for (const approval of (approvals ?? []) as SowApprovalRow[]) {
    const rows = approvalsBySowId.get(approval.sow_version_id) ?? [];
    rows.push(approval);
    approvalsBySowId.set(approval.sow_version_id, rows);
  }

  const notifications: WorkspaceNotification[] = [];

  for (const sow of sowRows) {
    const project = projectById.get(sow.project_id);
    const projectTitle = getProjectTitle(project, titleByRequirementId);
    const sowApprovals = approvalsBySowId.get(sow.id) ?? [];
    const freelancerApproval = sowApprovals.find((approval) => approval.approver_role === "freelancer");
    const companyApproval = sowApprovals.find((approval) => approval.approver_role === "company");

    if (freelancerApproval) {
      const approverName = freelancerApproval.approver_name_snapshot ?? "프리랜서";
      const needsCompanyApproval = !companyApproval && sow.status !== "approved";

      notifications.push({
        id: `company-freelancer-approved-${sow.id}-${freelancerApproval.approved_at}`,
        kind: "sow_approved",
        title: needsCompanyApproval
          ? "프리랜서 승인이 완료되었습니다"
          : "업무명세서 승인이 완료되었습니다",
        description: needsCompanyApproval
          ? `${approverName}가 업무명세서 v${sow.version_number}을 승인했습니다. PO 최종 승인을 진행해 주세요.`
          : `${approverName}가 업무명세서 v${sow.version_number}을 승인했습니다.`,
        projectTitle,
        occurredAt: freelancerApproval.approved_at,
        href: `/company/projects/${sow.project_id}/approval`,
        requiresAction: needsCompanyApproval,
      });
    }
  }

  for (const request of (revisionRequests ?? []) as SowRevisionRequestRow[]) {
    const project = projectById.get(request.project_id);
    const projectTitle = getProjectTitle(project, titleByRequirementId);
    const requesterName = request.requester_name_snapshot ?? "프리랜서";

    notifications.push({
      id: `company-revision-request-${request.id}`,
      kind: "sow_revision_requested",
      title: "수정 요청이 도착했습니다",
      description: `${requesterName}가 업무명세서 수정 요청을 보냈습니다. ${summarizeText(request.reason)}`,
      projectTitle,
      occurredAt: request.requested_at,
      href: `/company/projects/${request.project_id}/approval`,
      requiresAction: true,
    });
  }

  return { ok: true, data: sortNotifications(notifications) };
}

export async function listFreelancerNotifications(): Promise<
  BackendResult<WorkspaceNotification[]>
> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "Login is required." } };
  }

  const { data: proposals, error: proposalsError } = await supabase
    .from("proposals")
    .select("id, project_id, freelancer_id")
    .eq("freelancer_id", authData.user.id);

  if (proposalsError) {
    return {
      ok: false,
      error: mapBackendError(proposalsError, "Could not load proposal notifications."),
    };
  }

  const proposalRows = (proposals ?? []) as ProposalRow[];
  if (proposalRows.length === 0) return { ok: true, data: [] };

  const proposalIds = proposalRows.map((proposal) => proposal.id);
  const { data: selections, error: selectionsError } = await supabase
    .from("selections")
    .select("project_id, proposal_id, selected_at")
    .in("proposal_id", proposalIds)
    .order("selected_at", { ascending: false });

  if (selectionsError) {
    return {
      ok: false,
      error: mapBackendError(selectionsError, "Could not load selection notifications."),
    };
  }

  const selectionRows = (selections ?? []) as SelectionRow[];
  if (selectionRows.length === 0) return { ok: true, data: [] };

  const projectIds = selectionRows.map((selection) => selection.project_id);
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, company_id, current_requirement_version_id")
    .in("id", projectIds);

  if (projectsError) {
    return {
      ok: false,
      error: mapBackendError(projectsError, "Could not load project notifications."),
    };
  }

  const projectRows = (projects ?? []) as ProjectRow[];
  const requirementIds = projectRows
    .map((project) => project.current_requirement_version_id)
    .filter((id): id is string => Boolean(id));
  const companyIds = Array.from(new Set(projectRows.map((project) => project.company_id)));

  const [
    { data: requirements, error: requirementsError },
    { data: companies, error: companiesError },
    { data: sowVersions, error: sowsError },
  ] = await Promise.all([
    requirementIds.length
      ? supabase.from("project_requirement_versions").select("id, title").in("id", requirementIds)
      : Promise.resolve({ data: [], error: null }),
    companyIds.length
      ? supabase.from("company_profiles").select("id, organization_name").in("id", companyIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("sow_versions")
      .select("id, project_id, version_number, status, submitted_for_review_at, approved_at, updated_at")
      .in("project_id", projectIds)
      .in("status", ["in_review", "approved"])
      .order("updated_at", { ascending: false }),
  ]);

  if (requirementsError || companiesError || sowsError) {
    return {
      ok: false,
      error: mapBackendError(
        requirementsError ?? companiesError ?? sowsError,
        "Could not load SOW notifications.",
      ),
    };
  }

  const sowRows = (sowVersions ?? []) as SowVersionRow[];
  const sowIds = sowRows.map((sow) => sow.id);
  const { data: approvals, error: approvalsError } = sowIds.length
    ? await supabase
        .from("sow_approvals")
        .select("sow_version_id, approver_role, approver_name_snapshot, approved_at")
        .in("sow_version_id", sowIds)
        .order("approved_at", { ascending: false })
    : { data: [], error: null };

  if (approvalsError) {
    return {
      ok: false,
      error: mapBackendError(approvalsError, "Could not load approval notifications."),
    };
  }

  const titleByRequirementId = new Map(
    ((requirements ?? []) as RequirementRow[]).map((requirement) => [requirement.id, requirement.title]),
  );
  const companyById = new Map(
    ((companies ?? []) as CompanyProfileRow[]).map((company) => [company.id, company.organization_name]),
  );
  const projectById = new Map(projectRows.map((project) => [project.id, project]));
  const approvalsBySowId = new Map<string, SowApprovalRow[]>();

  for (const approval of (approvals ?? []) as SowApprovalRow[]) {
    const rows = approvalsBySowId.get(approval.sow_version_id) ?? [];
    rows.push(approval);
    approvalsBySowId.set(approval.sow_version_id, rows);
  }

  const notifications: WorkspaceNotification[] = selectionRows.map((selection) => {
    const project = projectById.get(selection.project_id);
    const projectTitle = getProjectTitle(project, titleByRequirementId);
    const organizationName = project ? companyById.get(project.company_id) ?? "Client" : "Client";

    return {
      id: `freelancer-selected-${selection.project_id}-${selection.selected_at}`,
      kind: "proposal_selected",
      title: "You were selected for a project",
      description: `${organizationName} selected your proposal. Review the project workspace and next SOW steps.`,
      projectTitle,
      occurredAt: selection.selected_at,
      href: `/freelancer/projects/${selection.project_id}`,
      requiresAction: true,
    };
  });

  for (const sow of sowRows) {
    const project = projectById.get(sow.project_id);
    const projectTitle = getProjectTitle(project, titleByRequirementId);
    const sowApprovals = approvalsBySowId.get(sow.id) ?? [];
    const freelancerApproved = sowApprovals.some((approval) => approval.approver_role === "freelancer");
    const companyApproval = sowApprovals.find((approval) => approval.approver_role === "company");

    if (sow.status === "in_review" && !freelancerApproved) {
      const isRevision = sow.version_number > 1;
      notifications.push({
        id: `freelancer-sow-request-${sow.id}`,
        kind: "sow_approval_requested",
        title: isRevision
          ? `SOW v${sow.version_number} revision approval requested`
          : `SOW v${sow.version_number} approval requested`,
        description: isRevision
          ? "The client updated the SOW. Review the revised version and approve it or request changes."
          : "The client submitted the SOW. Review the document and approve it or request changes.",
        projectTitle,
        occurredAt: sow.submitted_for_review_at ?? sow.updated_at,
        href: `/freelancer/projects/${sow.project_id}`,
        requiresAction: true,
      });
    }

    if (companyApproval) {
      notifications.push({
        id: `freelancer-company-approved-${sow.id}-${companyApproval.approved_at}`,
        kind: "sow_approved",
        title: `Client approved SOW v${sow.version_number}`,
        description: "The client approved this SOW version. Check the dual approval status and next milestone steps.",
        projectTitle,
        occurredAt: companyApproval.approved_at,
        href: `/freelancer/projects/${sow.project_id}`,
        requiresAction: false,
      });
    }
  }

  return { ok: true, data: sortNotifications(notifications) };
}

function getProjectTitle(
  project: ProjectRow | undefined,
  titleByRequirementId: Map<string, string>,
) {
  if (!project?.current_requirement_version_id) return "Project";
  return titleByRequirementId.get(project.current_requirement_version_id) ?? "Project";
}

function summarizeText(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "상세 내용을 확인해 주세요.";
  return trimmed.length > 70 ? `${trimmed.slice(0, 70)}...` : trimmed;
}

function sortNotifications(notifications: WorkspaceNotification[]) {
  return notifications
    .sort((first, second) => new Date(second.occurredAt).getTime() - new Date(first.occurredAt).getTime())
    .slice(0, 30);
}
