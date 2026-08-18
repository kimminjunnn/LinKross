import { createHash } from "crypto";

import type {
  ApproveSowInput,
  ApprovedSowMilestones,
  BackendResult,
  CriterionKind,
  MilestoneChecklistItem,
  ProjectMilestoneSummary,
  SaveSowVersionInput,
  SaveSowVersionOutput,
  SowApprovalCriterion,
  SowApprovalDocument,
  SowApprovalState,
  SowStatus,
  SowWorkspaceContext,
  RequestSowRevisionInput,
  UserRole,
  VerificationMethod,
} from "@/lib/backend/contracts";
import { mapBackendError } from "@/lib/backend/errors";
import { isUuid } from "@/lib/backend/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function parseDateText(value: string): string | null {
  const normalized = value.trim().replace(/\./g, "-").replace(/\s+/g, "");
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

function parseAmount(value: string): number {
  const digits = value.replace(/[^0-9.]/g, "");
  return digits ? Number(digits) : 0;
}

function computeContentHash(content: unknown): string {
  return createHash("sha256").update(JSON.stringify(content)).digest("hex");
}

type SowVersionApprovalRow = {
  id: string;
  project_id: string;
  version_number: number;
  status: SowStatus;
  content: unknown;
  print_text: string | null;
  pdf_file_name: string | null;
  content_hash: string;
  submitted_for_review_at: string | null;
  approved_at: string | null;
};

type MilestoneApprovalRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  amount: number | string;
  currency: string;
  position: number;
  status: string;
};

type CompletionCriteriaApprovalRow = {
  id: string;
  milestone_id: string;
  kind: CriterionKind;
  description: string;
  verification_method: VerificationMethod;
  position: number;
};

type SowApprovalRow = {
  id?: string;
  approver_role: UserRole;
  approver_name_snapshot: string | null;
  approved_at: string;
};

async function insertSowVersion(
  input: SaveSowVersionInput,
  status: "draft" | "in_review",
): Promise<BackendResult<SaveSowVersionOutput>> {
  if (!isUuid(input.projectId)) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 프로젝트 ID가 아닙니다." } };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, current_requirement_version_id")
    .eq("id", input.projectId)
    .eq("company_id", authData.user.id)
    .maybeSingle();

  if (projectError) {
    return { ok: false, error: mapBackendError(projectError, "프로젝트를 불러오지 못했습니다.") };
  }
  if (!project || !project.current_requirement_version_id) {
    return { ok: false, error: { code: "NOT_FOUND", message: "프로젝트를 찾을 수 없습니다." } };
  }

  const { data: selection } = await supabase
    .from("selections")
    .select("proposal_id")
    .eq("project_id", input.projectId)
    .maybeSingle();

  const { data: latestVersion, error: versionsError } = await supabase
    .from("sow_versions")
    .select("version_number")
    .eq("project_id", input.projectId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionsError) {
    return { ok: false, error: mapBackendError(versionsError, "업무 명세서 버전을 확인하지 못했습니다.") };
  }

  const nextVersion = (latestVersion?.version_number ?? 0) + 1;
  const overallStart = parseDateText(input.startDate) ?? new Date().toISOString().slice(0, 10);
  const overallEnd = parseDateText(input.endDate) ?? overallStart;

  const content = {
    workDetailKo: input.workDetail,
    budget: input.budget,
    startDateInput: input.startDate,
    endDateInput: input.endDate,
    englishSow: input.englishSow ?? null,
  };

  // sow_versions는 항상 draft로 먼저 만든다. protect_sow_children 트리거가
  // draft가 아닌 SOW엔 마일스톤/완료조건을 새로 넣지 못하게 막기 때문에,
  // in_review로 즉시 만들면 바로 아래에서 마일스톤 insert가 거부된다.
  const { data: sowVersion, error: sowError } = await supabase
    .from("sow_versions")
    .insert({
      project_id: input.projectId,
      version_number: nextVersion,
      source_requirement_version_id: project.current_requirement_version_id,
      source_proposal_id: selection?.proposal_id ?? null,
      status: "draft",
      content,
      print_text: input.printText ?? null,
      pdf_file_name: input.pdfFileName ?? null,
      content_hash: computeContentHash(content),
      created_by: authData.user.id,
    })
    .select("id, version_number, status")
    .single();

  if (sowError || !sowVersion) {
    return { ok: false, error: mapBackendError(sowError, "업무 명세서를 저장하지 못했습니다.") };
  }

  for (let index = 0; index < input.milestones.length; index += 1) {
    const milestone = input.milestones[index];
    const description = milestone.period.trim() ? `기간: ${milestone.period.trim()}` : null;

    const { data: milestoneRow, error: milestoneError } = await supabase
      .from("milestones")
      .insert({
        project_id: input.projectId,
        sow_version_id: sowVersion.id,
        code: milestone.code || `M${index + 1}`,
        title: milestone.title || `마일스톤 ${index + 1}`,
        description,
        start_date: overallStart,
        end_date: overallEnd,
        amount: parseAmount(milestone.amount),
        currency: "USD",
        position: index + 1,
      })
      .select("id")
      .single();

    if (milestoneError || !milestoneRow) {
      return {
        ok: false,
        error: mapBackendError(
          milestoneError,
          "마일스톤을 저장하지 못했습니다. 방금 만든 초안은 그대로 남아있으니 다시 저장해주세요.",
        ),
      };
    }

    const dods = milestone.dods.map((dod) => dod.trim()).filter(Boolean);
    for (let dodIndex = 0; dodIndex < dods.length; dodIndex += 1) {
      const { error: criterionError } = await supabase.from("completion_criteria").insert({
        project_id: input.projectId,
        sow_version_id: sowVersion.id,
        milestone_id: milestoneRow.id,
        kind: "definition_of_done",
        description: dods[dodIndex],
        verification_method: "manual",
        is_required: true,
        position: dodIndex + 1,
      });

      if (criterionError) {
        return {
          ok: false,
          error: mapBackendError(
            criterionError,
            "완료 조건을 저장하지 못했습니다. 방금 만든 초안은 그대로 남아있으니 다시 저장해주세요.",
          ),
        };
      }
    }
  }

  if (status === "in_review") {
    const { data: submitted, error: submitError } = await supabase
      .from("sow_versions")
      .update({ status: "in_review", submitted_for_review_at: new Date().toISOString() })
      .eq("id", sowVersion.id)
      .select("id, version_number, status")
      .single();

    if (submitError || !submitted) {
      return {
        ok: false,
        error: mapBackendError(
          submitError,
          "검토 요청 전환에 실패했습니다. 초안은 저장돼 있으니 다시 시도해주세요.",
        ),
      };
    }

    return {
      ok: true,
      data: {
        sowVersionId: submitted.id,
        versionNumber: submitted.version_number,
        status: submitted.status,
      },
    };
  }

  return {
    ok: true,
    data: {
      sowVersionId: sowVersion.id,
      versionNumber: sowVersion.version_number,
      status: sowVersion.status,
    },
  };
}

export async function saveSowDraft(
  input: SaveSowVersionInput,
): Promise<BackendResult<SaveSowVersionOutput>> {
  return insertSowVersion(input, "draft");
}

export async function submitSowForReview(
  input: SaveSowVersionInput,
): Promise<BackendResult<SaveSowVersionOutput>> {
  return insertSowVersion(input, "in_review");
}

export async function getSowWorkspaceContext(
  projectId: string,
): Promise<BackendResult<SowWorkspaceContext>> {
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
    .select("id, lifecycle_stage, current_requirement_version_id")
    .eq("id", projectId)
    .eq("company_id", authData.user.id)
    .maybeSingle();

  if (projectError) {
    return { ok: false, error: mapBackendError(projectError, "프로젝트를 불러오지 못했습니다.") };
  }
  if (!project) {
    return { ok: false, error: { code: "NOT_FOUND", message: "프로젝트를 찾을 수 없습니다." } };
  }

  const { data: version } = await supabase
    .from("project_requirement_versions")
    .select("title")
    .eq("id", project.current_requirement_version_id)
    .maybeSingle();

  const { data: selection } = await supabase
    .from("selections")
    .select("proposal_id")
    .eq("project_id", projectId)
    .maybeSingle();

  let assigneeName: string | null = null;
  if (selection?.proposal_id) {
    const { data: proposal } = await supabase
      .from("proposals")
      .select("freelancer_display_name_snapshot")
      .eq("id", selection.proposal_id)
      .maybeSingle();
    assigneeName = proposal?.freelancer_display_name_snapshot ?? null;
  }

  return {
    ok: true,
    data: {
      projectId: project.id,
      title: version?.title ?? "(제목 없음)",
      lifecycleStage: project.lifecycle_stage,
      assigneeName,
    },
  };
}

export async function getSowApprovalState(
  projectId: string,
  sowVersionId?: string,
): Promise<BackendResult<SowApprovalState | null>> {
  if (!isUuid(projectId) || (sowVersionId !== undefined && !isUuid(sowVersionId))) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 프로젝트 ID가 아닙니다." } };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, company_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    return { ok: false, error: mapBackendError(projectError, "프로젝트를 확인하지 못했습니다.") };
  }
  if (!project) {
    return { ok: false, error: { code: "NOT_FOUND", message: "프로젝트를 찾을 수 없습니다." } };
  }

  if (project.company_id !== authData.user.id) {
    const { data: selection, error: selectionError } = await supabase
      .from("selections")
      .select("id")
      .eq("project_id", projectId)
      .maybeSingle();

    if (selectionError) {
      return { ok: false, error: mapBackendError(selectionError, "프로젝트 참여 권한을 확인하지 못했습니다.") };
    }
    if (!selection) {
      return { ok: false, error: { code: "FORBIDDEN", message: "프로젝트 참여자만 SOW를 확인할 수 있습니다." } };
    }
  }

  let sowQuery = supabase
    .from("sow_versions")
    .select(
      "id, project_id, version_number, status, content, print_text, pdf_file_name, content_hash, submitted_for_review_at, approved_at",
    )
    .eq("project_id", projectId)
    .in("status", ["in_review", "revision_requested", "approved"]);

  sowQuery = sowVersionId
    ? sowQuery.eq("id", sowVersionId)
    : sowQuery.order("version_number", { ascending: false }).limit(1);

  const { data: sowVersion, error: sowError } = await sowQuery.maybeSingle();

  if (sowError) {
    return { ok: false, error: mapBackendError(sowError, "승인 요청된 SOW를 불러오지 못했습니다.") };
  }
  if (!sowVersion) {
    return { ok: true, data: null };
  }

  const sowRow = sowVersion as SowVersionApprovalRow;
  const [
    { data: milestones, error: milestonesError },
    { data: criteria, error: criteriaError },
    { data: approvals, error: approvalsError },
  ] = await Promise.all([
    supabase
      .from("milestones")
      .select("id, code, title, description, start_date, end_date, amount, currency, position, status")
      .eq("sow_version_id", sowRow.id)
      .order("position", { ascending: true }),
    supabase
      .from("completion_criteria")
      .select("id, milestone_id, kind, description, verification_method, position")
      .eq("sow_version_id", sowRow.id)
      .order("position", { ascending: true }),
    supabase
      .from("sow_approvals")
      .select("approver_role, approver_name_snapshot, approved_at")
      .eq("sow_version_id", sowRow.id)
      .order("approved_at", { ascending: true }),
  ]);

  if (milestonesError || criteriaError || approvalsError) {
    return {
      ok: false,
      error: mapBackendError(
        milestonesError ?? criteriaError ?? approvalsError,
        "승인 상세 정보를 불러오지 못했습니다.",
      ),
    };
  }

  return {
    ok: true,
    data: toSowApprovalState({
      sowVersion: sowRow,
      milestones: (milestones ?? []) as MilestoneApprovalRow[],
      criteria: (criteria ?? []) as CompletionCriteriaApprovalRow[],
      approvals: (approvals ?? []) as SowApprovalRow[],
    }),
  };
}

export async function approveSowAsCompany(
  input: ApproveSowInput,
): Promise<BackendResult<SowApprovalState>> {
  if (!isUuid(input.projectId) || !isUuid(input.sowVersionId)) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 SOW 승인 대상이 아닙니다." } };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", input.projectId)
    .eq("company_id", authData.user.id)
    .maybeSingle();

  if (projectError) {
    return { ok: false, error: mapBackendError(projectError, "프로젝트를 확인하지 못했습니다.") };
  }
  if (!project) {
    return { ok: false, error: { code: "NOT_FOUND", message: "프로젝트를 찾을 수 없습니다." } };
  }

  const { data: sowVersion, error: sowError } = await supabase
    .from("sow_versions")
    .select("id, status, content_hash")
    .eq("id", input.sowVersionId)
    .eq("project_id", input.projectId)
    .maybeSingle();

  if (sowError) {
    return { ok: false, error: mapBackendError(sowError, "승인할 SOW를 확인하지 못했습니다.") };
  }
  if (!sowVersion) {
    return { ok: false, error: { code: "NOT_FOUND", message: "승인할 SOW를 찾지 못했습니다." } };
  }
  if (sowVersion.content_hash !== input.contentHash) {
    return {
      ok: false,
      error: {
        code: "CONFLICT",
        message: "승인하려는 업무명세서 버전이 변경되었습니다. 화면을 새로고침한 뒤 다시 확인해주세요.",
      },
    };
  }
  const { data: existingApproval, error: existingError } = await supabase
    .from("sow_approvals")
    .select("id")
    .eq("project_id", input.projectId)
    .eq("sow_version_id", input.sowVersionId)
    .eq("approver_role", "company")
    .maybeSingle();

  if (existingError) {
    return { ok: false, error: mapBackendError(existingError, "기존 승인 기록을 확인하지 못했습니다.") };
  }

  if (!existingApproval && sowVersion.status !== "in_review") {
    return {
      ok: false,
      error: {
        code: "CONFLICT",
        message: "현재 검토 중인 업무명세서만 승인할 수 있습니다.",
      },
    };
  }

  if (!existingApproval) {
    const { error: approvalError } = await supabase.from("sow_approvals").insert({
      project_id: input.projectId,
      sow_version_id: input.sowVersionId,
      approver_id: authData.user.id,
      approver_role: "company",
      approver_name_snapshot: getUserDisplayName(authData.user.user_metadata, authData.user.email),
      content_hash: input.contentHash,
    });

    if (approvalError) {
      return { ok: false, error: mapBackendError(approvalError, "SOW 승인을 저장하지 못했습니다.") };
    }
  }

  // 두 번째 승인 시 DB 트리거가 SOW, 마일스톤, 프로젝트 상태를 한 트랜잭션에서 전환한다.
  // 애플리케이션에서 같은 전환을 반복하면 RLS와 충돌하므로 승인 행 삽입 후 결과만 다시 읽는다.
  const state = await getSowApprovalState(input.projectId, input.sowVersionId);
  if (!state.ok) return state;
  if (!state.data) {
    return { ok: false, error: { code: "NOT_FOUND", message: "승인한 SOW를 다시 불러오지 못했습니다." } };
  }

  return { ok: true, data: state.data };
}

export async function approveSowAsFreelancer(
  input: ApproveSowInput,
): Promise<BackendResult<SowApprovalState>> {
  if (!isUuid(input.projectId) || !isUuid(input.sowVersionId)) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 SOW 승인 대상이 아닙니다." } };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  }

  const { data: selection, error: selectionError } = await supabase
    .from("selections")
    .select("proposal_id")
    .eq("project_id", input.projectId)
    .maybeSingle();

  if (selectionError) {
    return { ok: false, error: mapBackendError(selectionError, "프로젝트 참여 권한을 확인하지 못했습니다.") };
  }
  if (!selection) {
    return { ok: false, error: { code: "FORBIDDEN", message: "선정된 프리랜서만 SOW를 승인할 수 있습니다." } };
  }

  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .select("id")
    .eq("id", selection.proposal_id)
    .eq("freelancer_id", authData.user.id)
    .maybeSingle();

  if (proposalError) {
    return { ok: false, error: mapBackendError(proposalError, "선정 제안서를 확인하지 못했습니다.") };
  }
  if (!proposal) {
    return { ok: false, error: { code: "FORBIDDEN", message: "선정된 프리랜서만 SOW를 승인할 수 있습니다." } };
  }

  const { data: sowVersion, error: sowError } = await supabase
    .from("sow_versions")
    .select("id, status, content_hash")
    .eq("id", input.sowVersionId)
    .eq("project_id", input.projectId)
    .maybeSingle();

  if (sowError) {
    return { ok: false, error: mapBackendError(sowError, "승인할 SOW를 확인하지 못했습니다.") };
  }
  if (!sowVersion) {
    return { ok: false, error: { code: "NOT_FOUND", message: "승인할 SOW를 찾지 못했습니다." } };
  }
  if (sowVersion.content_hash !== input.contentHash) {
    return {
      ok: false,
      error: { code: "CONFLICT", message: "SOW 버전이 변경되었습니다. 새로고침 후 다시 확인해주세요." },
    };
  }

  const { data: existingApproval, error: existingError } = await supabase
    .from("sow_approvals")
    .select("id")
    .eq("project_id", input.projectId)
    .eq("sow_version_id", input.sowVersionId)
    .eq("approver_role", "freelancer")
    .maybeSingle();

  if (existingError) {
    return { ok: false, error: mapBackendError(existingError, "기존 승인 기록을 확인하지 못했습니다.") };
  }
  if (!existingApproval && sowVersion.status !== "in_review") {
    return { ok: false, error: { code: "CONFLICT", message: "현재 검토 중인 SOW만 승인할 수 있습니다." } };
  }

  if (!existingApproval) {
    const { error: approvalError } = await supabase.from("sow_approvals").insert({
      project_id: input.projectId,
      sow_version_id: input.sowVersionId,
      approver_id: authData.user.id,
      approver_role: "freelancer",
      approver_name_snapshot: getUserDisplayName(authData.user.user_metadata, authData.user.email),
      content_hash: input.contentHash,
    });

    if (approvalError) {
      return { ok: false, error: mapBackendError(approvalError, "SOW 승인을 저장하지 못했습니다.") };
    }
  }

  const state = await getSowApprovalState(input.projectId, input.sowVersionId);
  if (!state.ok) return state;
  if (!state.data) {
    return { ok: false, error: { code: "NOT_FOUND", message: "승인한 SOW를 다시 불러오지 못했습니다." } };
  }
  return { ok: true, data: state.data };
}

export async function requestSowRevision(
  input: RequestSowRevisionInput,
): Promise<BackendResult<SowApprovalState>> {
  if (!isUuid(input.projectId) || !isUuid(input.sowVersionId) || !input.reason.trim()) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "수정 요청 사유를 입력해주세요." } };
  }
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };

  const { data: sow, error: sowError } = await supabase
    .from("sow_versions")
    .select("id, status, content_hash")
    .eq("id", input.sowVersionId)
    .eq("project_id", input.projectId)
    .maybeSingle();
  if (sowError || !sow) return { ok: false, error: mapBackendError(sowError, "검토 중인 SOW를 찾지 못했습니다.") };
  if (sow.status !== "in_review" || sow.content_hash !== input.contentHash) {
    return { ok: false, error: { code: "CONFLICT", message: "현재 검토 중인 동일 SOW 버전에만 수정을 요청할 수 있습니다." } };
  }

  const { error } = await supabase.from("sow_revision_requests").insert({
    project_id: input.projectId,
    sow_version_id: input.sowVersionId,
    reason: input.reason.trim(),
    content_hash: input.contentHash,
    requested_by: authData.user.id,
    requester_role: "freelancer",
  });
  if (error) return { ok: false, error: mapBackendError(error, "수정 요청을 저장하지 못했습니다.") };
  const updated = await getSowApprovalState(input.projectId, input.sowVersionId);
  if (!updated.ok) return updated;
  if (!updated.data) return { ok: false, error: { code: "NOT_FOUND", message: "수정 요청된 SOW를 다시 불러오지 못했습니다." } };
  return { ok: true, data: updated.data };
}

function toSowApprovalState({
  sowVersion,
  milestones,
  criteria,
  approvals,
}: {
  sowVersion: SowVersionApprovalRow;
  milestones: MilestoneApprovalRow[];
  criteria: CompletionCriteriaApprovalRow[];
  approvals: SowApprovalRow[];
}): SowApprovalState {
  const document = toSowApprovalDocument(sowVersion);
  const criteriaByMilestone = new Map<string, CompletionCriteriaApprovalRow[]>();
  const approvalByRole = new Map<UserRole, SowApprovalRow>();

  for (const criterion of criteria) {
    const rows = criteriaByMilestone.get(criterion.milestone_id) ?? [];
    rows.push(criterion);
    criteriaByMilestone.set(criterion.milestone_id, rows);
  }

  for (const approval of approvals) {
    approvalByRole.set(approval.approver_role, approval);
  }

  return {
    projectId: sowVersion.project_id,
    sowVersionId: sowVersion.id,
    version: document.version,
    status: sowVersion.status,
    contentHash: sowVersion.content_hash,
    submittedForReviewAt: sowVersion.submitted_for_review_at,
    approvedAt: sowVersion.approved_at,
    document,
    milestones: milestones.map((milestone) => {
      const milestoneCriteria = criteriaByMilestone.get(milestone.id) ?? [];
      const acceptanceCriteria = milestoneCriteria.filter((criterion) => criterion.kind === "acceptance");
      const definitionOfDone = milestoneCriteria.filter(
        (criterion) => criterion.kind === "definition_of_done",
      );

      return {
        id: milestone.id,
        code: milestone.code,
        title: milestone.title,
        period: `${milestone.start_date} - ${milestone.end_date}`,
        amount: formatAmount(milestone.amount, milestone.currency),
        status: milestone.status,
        acceptanceCriteria: acceptanceCriteria.map(toSowApprovalCriterion),
        definitionOfDone: definitionOfDone.map(toSowApprovalCriterion),
        verificationMethods: Array.from(
          new Set(milestoneCriteria.map((criterion) => criterion.verification_method)),
        ),
      };
    }),
    approvals: {
      company: toSowApprovalRecord(approvalByRole.get("company") ?? null),
      freelancer: toSowApprovalRecord(approvalByRole.get("freelancer") ?? null),
    },
  };
}

function toSowApprovalDocument(sowVersion: SowVersionApprovalRow): SowApprovalDocument {
  const content = isRecord(sowVersion.content) ? sowVersion.content : {};
  const englishSow = isRecord(content.englishSow) ? content.englishSow : null;
  const overview = englishSow && isRecord(englishSow.overview) ? englishSow.overview : {};
  const scopeOfWork = englishSow && isRecord(englishSow.scopeOfWork) ? englishSow.scopeOfWork : {};
  const roles = englishSow && isRecord(englishSow.rolesAndResponsibilities)
    ? englishSow.rolesAndResponsibilities
    : {};
  const inScope = toStringArray(scopeOfWork.inScope);
  const outOfScope = toStringArray(scopeOfWork.outOfScope);
  const acceptanceCriteria = toStringArray(englishSow?.acceptanceCriteria);
  const definitionOfDone = toStringArray(englishSow?.definitionOfDone);
  const workDetailKo = typeof content.workDetailKo === "string" ? content.workDetailKo.trim() : "";
  const documentSections = [
    workDetailKo
      ? {
          title: "한국어 업무 상세",
          body: workDetailKo,
        }
      : null,
    hasText(overview.background) || hasText(overview.objective)
      ? {
          title: "Project Overview & Objectives",
          body: [
            `Background: ${String(overview.background ?? "TBD")}`,
            `Objective: ${String(overview.objective ?? "TBD")}`,
          ].join("\n"),
        }
      : null,
    inScope.length || outOfScope.length
      ? {
          title: "Scope of Work",
          body: [
            "In-Scope:",
            ...(inScope.length ? inScope.map((item) => `- ${item}`) : ["- TBD"]),
            "",
            "Out-of-Scope:",
            ...(outOfScope.length ? outOfScope.map((item) => `- ${item}`) : ["- TBD"]),
          ].join("\n"),
        }
      : null,
    hasText(roles.client) || hasText(roles.vendor)
      ? {
          title: "Roles & Responsibilities",
          body: [
            `Client: ${String(roles.client ?? "TBD")}`,
            `Vendor: ${String(roles.vendor ?? "TBD")}`,
          ].join("\n"),
        }
      : null,
  ].filter((section): section is { title: string; body: string } => Boolean(section));

  return {
    projectId: sowVersion.project_id,
    version: `v${sowVersion.version_number}`,
    requestedAt: sowVersion.submitted_for_review_at ?? "",
    pdfFileName: sowVersion.pdf_file_name ?? "",
    printText: sowVersion.print_text ?? "",
    documentSections: documentSections.length
      ? documentSections
      : [
          {
            title: "업무 명세서 원본",
            body: "DB에 저장된 업무명세서 원본 내용을 불러왔습니다.",
          },
        ],
    acceptanceCriteria: acceptanceCriteria.length ? acceptanceCriteria : ["TBD"],
    definitionOfDone: definitionOfDone.length ? definitionOfDone : ["TBD"],
    summary: {
      coreScope: inScope.slice(0, 3).join(", ") || "Original SOW document stored in DB",
      keyAcceptance: `${acceptanceCriteria.length || 1} Acceptance Criteria and ${
        definitionOfDone.length || 1
      } Definition of Done`,
      needsReview: "Review the original SOW document along with milestone verification details",
    },
  };
}

function toSowApprovalCriterion(row: CompletionCriteriaApprovalRow): SowApprovalCriterion {
  return {
    id: row.id,
    kind: row.kind,
    description: row.description,
    verificationMethod: row.verification_method,
    position: row.position,
  };
}

function toSowApprovalRecord(row: SowApprovalRow | null) {
  if (!row) return null;

  return {
    role: row.approver_role,
    approverName: row.approver_name_snapshot,
    approvedAt: row.approved_at,
  };
}

function formatAmount(amount: number | string, currency: string) {
  const numeric = Number(amount);
  const formatted = Number.isFinite(numeric) ? numeric.toLocaleString() : String(amount);
  return `${formatted} ${currency}`;
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function getUserDisplayName(metadata: unknown, email?: string) {
  if (isRecord(metadata)) {
    const candidate =
      metadata.full_name ??
      metadata.name ??
      metadata.display_name ??
      metadata.user_name;

    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return email ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function getApprovedSowMilestones(
  projectId: string,
): Promise<BackendResult<ApprovedSowMilestones>> {
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
    .select("id")
    .eq("id", projectId)
    .eq("company_id", authData.user.id)
    .maybeSingle();

  if (projectError) {
    return { ok: false, error: mapBackendError(projectError, "프로젝트를 불러오지 못했습니다.") };
  }
  if (!project) {
    return { ok: false, error: { code: "NOT_FOUND", message: "프로젝트를 찾을 수 없습니다." } };
  }

  const { data: sowVersion, error: sowError } = await supabase
    .from("sow_versions")
    .select("id, version_number")
    .eq("project_id", projectId)
    .eq("status", "approved")
    .maybeSingle();

  if (sowError) {
    return { ok: false, error: mapBackendError(sowError, "승인된 업무 명세서를 확인하지 못했습니다.") };
  }
  if (!sowVersion) {
    return { ok: true, data: { sowVersionId: null, versionNumber: null, milestones: [] } };
  }

  const { data: milestoneRows, error: milestoneError } = await supabase
    .from("milestones")
    .select("id, code, title, description, start_date, end_date, amount, currency, status, position")
    .eq("sow_version_id", sowVersion.id)
    .order("position", { ascending: true });

  if (milestoneError) {
    return { ok: false, error: mapBackendError(milestoneError, "마일스톤을 불러오지 못했습니다.") };
  }

  const milestoneIds = (milestoneRows ?? []).map((row) => row.id);
  const criteriaByMilestone = new Map<string, MilestoneChecklistItem[]>();

  if (milestoneIds.length > 0) {
    const { data: criteriaRows, error: criteriaError } = await supabase
      .from("completion_criteria")
      .select("id, milestone_id, description, verification_method, is_required, position")
      .in("milestone_id", milestoneIds)
      .order("position", { ascending: true });

    if (criteriaError) {
      return { ok: false, error: mapBackendError(criteriaError, "완료조건을 불러오지 못했습니다.") };
    }

    for (const row of criteriaRows ?? []) {
      const list = criteriaByMilestone.get(row.milestone_id) ?? [];
      list.push({
        id: row.id,
        description: row.description,
        verificationMethod: row.verification_method,
        isRequired: row.is_required,
      });
      criteriaByMilestone.set(row.milestone_id, list);
    }
  }

  const milestones: ProjectMilestoneSummary[] = (milestoneRows ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    position: row.position,
    checklist: criteriaByMilestone.get(row.id) ?? [],
  }));

  return {
    ok: true,
    data: { sowVersionId: sowVersion.id, versionNumber: sowVersion.version_number, milestones },
  };
}
