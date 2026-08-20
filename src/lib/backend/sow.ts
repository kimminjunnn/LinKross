import { createHash } from "crypto";

import type {
  ApproveSowInput,
  ApprovedSowMilestones,
  BackendResult,
  CriterionKind,
  MarkSowRevisionRequestsReadInput,
  MilestoneChecklistItem,
  ProjectMilestoneSummary,
  SaveSowVersionInput,
  SaveSowVersionOutput,
  SowApprovalCriterion,
  SowApprovalDocument,
  SowApprovalState,
  SowStatus,
  SowWorkspaceDraft,
  SowWorkspaceContext,
  RequestSowRevisionInput,
  SowRevisionRequestRecord,
  UserRole,
  VerificationMethod,
} from "@/lib/backend/contracts";
import { mapBackendError } from "@/lib/backend/errors";
import { translateToEnglish } from "@/lib/backend/translation";
import { isUuid } from "@/lib/backend/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  MANUAL_GUIDANCE_SPEC_VERSION,
  createMvpVerificationDefinition,
  type ManagedTestSpec,
  type ManualGuidanceSpec,
} from "@/lib/verification-test-spec";
import { generateManualCheckGuidance } from "@/lib/verification-guidance";
import { composeVerificationAtoms, type ComposeOutcome } from "@/lib/verification-atom-composer";

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

/**
 * "확인 필요(manual)"로 떨어진 DoD 원문을 갭 로그에 누적한다(설계 §21.3, §21.5).
 * 판정에는 관여하지 않는 참고 데이터이므로 실패해도 SOW 저장 흐름을 막지 않는다.
 */
async function logVerificationAtomGaps(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  projectId: string,
  gaps: Array<{ dodText: string; reason: NonNullable<ComposeOutcome["reason"]> }>,
): Promise<void> {
  if (gaps.length === 0) return;

  const withReason = gaps.map((gap) => ({
    project_id: projectId,
    dod_text: gap.dodText,
    reason: gap.reason,
  }));
  const { error } = await supabase.from("verification_atom_gap_log").insert(withReason);
  if (!error) return;

  // reason 컬럼 마이그레이션(supabase/verification_atom_gap_log.sql) 적용 전 배포에서는
  // 원문만 기록하고 사유는 서버 로그로 남긴다. 갭 수집 자체를 멈추지 않는다.
  const { error: fallbackError } = await supabase
    .from("verification_atom_gap_log")
    .insert(gaps.map((gap) => ({ project_id: projectId, dod_text: gap.dodText })));
  if (fallbackError) {
    console.error("[verification-atom-gap-log] insert failed", fallbackError);
    return;
  }
  console.warn(
    "[verification-atom-gap-log] reason 컬럼 없이 기록했습니다.",
    gaps.map((gap) => gap.reason).join(","),
  );
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

type SowRevisionRequestRow = {
  id: string;
  project_id: string;
  sow_version_id: string;
  requester_role: UserRole;
  requester_name_snapshot: string | null;
  reason: string;
  requested_at: string;
};

type SowRevisionRequestReadRow = {
  sow_revision_request_id: string;
  read_at: string;
};

type SowApprovalParticipantRows = {
  companyName: string | null;
  freelancerName: string | null;
};

type SowApprovalProjectRow = {
  id: string;
  company_id: string;
  company_contact_name_snapshot?: string | null;
};

function isMissingRevisionReadTable(error: { code?: string; message?: string } | null | undefined) {
  const message = error?.message ?? "";
  return error?.code === "42P01" || message.includes("sow_revision_request_reads");
}

function isDuplicateRevisionRead(error: { code?: string } | null | undefined) {
  return error?.code === "23505";
}

// 같은 sow_version_id 안에서 position/code unique 제약과 부딪히지 않도록,
// 기존 행들을 먼저 이 범위 밖(음수)으로 옮겨둔 뒤 목표 값으로 다시 배치한다.
async function getCompanyApprovalName(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  companyId: string,
  fallbackEmail?: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("company_profiles")
    .select("contact_name")
    .eq("id", companyId)
    .maybeSingle();

  return typeof data?.contact_name === "string" && data.contact_name.trim()
    ? data.contact_name.trim()
    : fallbackEmail ?? null;
}

async function getFreelancerApprovalName(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  freelancerId: string,
  snapshotName: string | null,
  fallbackEmail?: string,
): Promise<string | null> {
  if (snapshotName?.trim()) return snapshotName.trim();

  const { data } = await supabase
    .from("freelancer_profiles")
    .select("display_name")
    .eq("id", freelancerId)
    .maybeSingle();

  return typeof data?.display_name === "string" && data.display_name.trim()
    ? data.display_name.trim()
    : fallbackEmail ?? null;
}

async function getSowApprovalParticipantRows(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  projectId: string,
  companyId: string,
  companyNameSnapshot: string | null,
): Promise<BackendResult<SowApprovalParticipantRows>> {
  const [
    { data: companyProfile, error: companyProfileError },
    { data: selection, error: selectionError },
  ] = await Promise.all([
    supabase
      .from("company_profiles")
      .select("contact_name")
      .eq("id", companyId)
      .maybeSingle(),
    supabase
      .from("selections")
      .select("proposal_id")
      .eq("project_id", projectId)
      .maybeSingle(),
  ]);

  if (companyProfileError || selectionError) {
    return {
      ok: false,
      error: mapBackendError(
        companyProfileError ?? selectionError,
        "SOW 승인 참여자 정보를 불러오지 못했습니다.",
      ),
    };
  }

  if (!selection?.proposal_id) {
    return {
      ok: true,
      data: {
        companyName: companyNameSnapshot ?? companyProfile?.contact_name ?? null,
        freelancerName: null,
      },
    };
  }

  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .select("freelancer_id, freelancer_display_name_snapshot")
    .eq("id", selection.proposal_id)
    .maybeSingle();

  if (proposalError) {
    return {
      ok: false,
      error: mapBackendError(proposalError, "선정된 프리랜서 정보를 불러오지 못했습니다."),
    };
  }

  const snapshotName =
    typeof proposal?.freelancer_display_name_snapshot === "string"
      ? proposal.freelancer_display_name_snapshot.trim()
      : "";

  let currentProfileName: string | null = null;
  if (!snapshotName && proposal?.freelancer_id) {
    const { data: freelancerProfile, error: freelancerProfileError } = await supabase
      .from("freelancer_profiles")
      .select("display_name")
      .eq("id", proposal.freelancer_id)
      .maybeSingle();

    if (freelancerProfileError) {
      return {
        ok: false,
        error: mapBackendError(freelancerProfileError, "프리랜서 프로필 정보를 불러오지 못했습니다."),
      };
    }

    currentProfileName =
      typeof freelancerProfile?.display_name === "string"
        ? freelancerProfile.display_name.trim()
        : null;
  }

  return {
    ok: true,
    data: {
      companyName:
        companyNameSnapshot ??
        (typeof companyProfile?.contact_name === "string" && companyProfile.contact_name.trim()
          ? companyProfile.contact_name.trim()
          : null),
      freelancerName: snapshotName || currentProfileName,
    },
  };
}

function buildTempPositionBase(): number {
  return Math.floor(Date.now() / 1000);
}

async function upsertMilestonesForDraft(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  projectId: string,
  sowVersionId: string,
  milestones: SaveSowVersionInput["milestones"],
  overallStart: string,
  overallEnd: string,
): Promise<BackendResult<Map<string, string>>> {
  const { data: existingRows, error: existingError } = await supabase
    .from("milestones")
    .select("id, code")
    .eq("sow_version_id", sowVersionId);

  if (existingError) {
    return { ok: false, error: mapBackendError(existingError, "기존 마일스톤을 확인하지 못했습니다.") };
  }

  const existingByCode = new Map((existingRows ?? []).map((row) => [row.code, row.id]));

  const tempBase = buildTempPositionBase();
  for (let index = 0; index < (existingRows?.length ?? 0); index += 1) {
    const { error } = await supabase
      .from("milestones")
      .update({ position: tempBase - index })
      .eq("id", existingRows![index].id);
    if (error) {
      return { ok: false, error: mapBackendError(error, "마일스톤 저장 준비 중 오류가 발생했습니다.") };
    }
  }

  const milestoneIdByCode = new Map<string, string>();

  for (let index = 0; index < milestones.length; index += 1) {
    const milestone = milestones[index];
    const code = milestone.code || `M${index + 1}`;
    const description = milestone.period.trim() ? `기간: ${milestone.period.trim()}` : null;
    const existingId = existingByCode.get(code);

    if (existingId) {
      const { error } = await supabase
        .from("milestones")
        .update({
          title: milestone.title || `마일스톤 ${index + 1}`,
          description,
          start_date: overallStart,
          end_date: overallEnd,
          amount: parseAmount(milestone.amount),
          currency: "USD",
          position: index + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingId);
      if (error) {
        return { ok: false, error: mapBackendError(error, "마일스톤을 저장하지 못했습니다.") };
      }
      milestoneIdByCode.set(code, existingId);
    } else {
      const { data: inserted, error } = await supabase
        .from("milestones")
        .insert({
          project_id: projectId,
          sow_version_id: sowVersionId,
          code,
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
      if (error || !inserted) {
        return { ok: false, error: mapBackendError(error, "마일스톤을 저장하지 못했습니다.") };
      }
      milestoneIdByCode.set(code, inserted.id);
    }
  }

  return { ok: true, data: milestoneIdByCode };
}

async function upsertCriteriaForMilestone(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  projectId: string,
  sowVersionId: string,
  milestoneId: string,
  dods: string[],
): Promise<BackendResult<null>> {
  const { data: existingRows, error: existingError } = await supabase
    .from("completion_criteria")
    .select("id, position")
    .eq("milestone_id", milestoneId)
    .eq("kind", "definition_of_done")
    .order("position", { ascending: true });

  if (existingError) {
    return { ok: false, error: mapBackendError(existingError, "기존 완료 조건을 확인하지 못했습니다.") };
  }

  const tempBase = buildTempPositionBase();
  for (let index = 0; index < (existingRows?.length ?? 0); index += 1) {
    const { error } = await supabase
      .from("completion_criteria")
      .update({ position: tempBase - index })
      .eq("id", existingRows![index].id);
    if (error) {
      return { ok: false, error: mapBackendError(error, "완료 조건 저장 준비 중 오류가 발생했습니다.") };
    }
  }

  const existingIdByOriginalOrder = new Map((existingRows ?? []).map((row, index) => [index + 1, row.id]));

  const verifications: Array<{
    verificationMethod: VerificationMethod;
    testSpec: ManagedTestSpec | ManualGuidanceSpec | Record<string, never>;
  }> = dods.map((dod) => createMvpVerificationDefinition(dod));
  const unresolvedIndexes = verifications
    .map((verification, index) => (verification.verificationMethod === "manual" ? index : -1))
    .filter((index) => index !== -1);

  if (unresolvedIndexes.length > 0) {
    // 정규식 프리셋이 놓친 DoD는 고정된 atom 어휘의 조합으로 표현해 본다(설계 §21.2).
    // LLM은 조합만 고르고, 채택 여부는 엄격 파서가 결정한다.
    const composed = await composeVerificationAtoms(unresolvedIndexes.map((index) => dods[index]));
    const stillManual: Array<{ dodIndex: number; reason: NonNullable<ComposeOutcome["reason"]> }> = [];

    unresolvedIndexes.forEach((dodIndex, composeIndex) => {
      const outcome = composed[composeIndex];
      if (outcome?.spec) {
        verifications[dodIndex] = { verificationMethod: "automated_e2e", testSpec: outcome.spec };
        return;
      }
      stillManual.push({ dodIndex, reason: outcome?.reason ?? "llm_failed" });
    });

    if (stillManual.length > 0) {
      await logVerificationAtomGaps(
        supabase,
        projectId,
        stillManual.map((entry) => ({ dodText: dods[entry.dodIndex], reason: entry.reason })),
      );
      const guidances = await generateManualCheckGuidance(
        stillManual.map((entry) => dods[entry.dodIndex]),
      );
      stillManual.forEach((entry, guidanceIndex) => {
        const guidance = guidances[guidanceIndex];
        if (!guidance) return;
        verifications[entry.dodIndex] = {
          ...verifications[entry.dodIndex],
          testSpec: { version: MANUAL_GUIDANCE_SPEC_VERSION, kind: "manual_guidance", ...guidance },
        };
      });
    }
  }

  for (let dodIndex = 0; dodIndex < dods.length; dodIndex += 1) {
    const existingId = existingIdByOriginalOrder.get(dodIndex + 1);
    const verification = verifications[dodIndex];
    if (existingId) {
      const { error } = await supabase
        .from("completion_criteria")
        .update({
          description: dods[dodIndex],
          verification_method: verification.verificationMethod,
          position: dodIndex + 1,
          test_spec: verification.testSpec,
        })
        .eq("id", existingId);
      if (error) {
        return { ok: false, error: mapBackendError(error, "완료 조건을 저장하지 못했습니다.") };
      }
    } else {
      const { error } = await supabase.from("completion_criteria").insert({
        project_id: projectId,
        sow_version_id: sowVersionId,
        milestone_id: milestoneId,
        kind: "definition_of_done",
        description: dods[dodIndex],
        verification_method: verification.verificationMethod,
        is_required: true,
        position: dodIndex + 1,
        test_spec: verification.testSpec,
      });
      if (error) {
        return { ok: false, error: mapBackendError(error, "완료 조건을 저장하지 못했습니다.") };
      }
    }
  }

  return { ok: true, data: null };
}

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
    .select("id, version_number, status")
    .eq("project_id", input.projectId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionsError) {
    return { ok: false, error: mapBackendError(versionsError, "업무 명세서 버전을 확인하지 못했습니다.") };
  }

  const overallStart = parseDateText(input.startDate) ?? new Date().toISOString().slice(0, 10);
  const overallEnd = parseDateText(input.endDate) ?? overallStart;

  const content = {
    workDetailKo: input.workDetail,
    budget: input.budget,
    startDateInput: input.startDate,
    endDateInput: input.endDate,
    englishSow: input.englishSow ?? null,
  };
  const contentHash = computeContentHash(content);

  // 최신 버전이 아직 draft면(=제출 전 임시 저장 반복) 새 버전을 만들지 않고
  // 그 행을 그대로 업데이트한다. 버전 번호는 실제로 제출/재수정이 있을 때만 올라간다.
  const reuseDraft = latestVersion?.status === "draft";

  let sowVersion: { id: string; version_number: number; status: SowStatus };

  if (reuseDraft) {
    const { data: updated, error: updateError } = await supabase
      .from("sow_versions")
      .update({
        source_requirement_version_id: project.current_requirement_version_id,
        source_proposal_id: selection?.proposal_id ?? null,
        content,
        print_text: input.printText ?? null,
        pdf_file_name: input.pdfFileName ?? null,
        content_hash: contentHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", latestVersion!.id)
      .select("id, version_number, status")
      .single();

    if (updateError || !updated) {
      return { ok: false, error: mapBackendError(updateError, "업무 명세서를 저장하지 못했습니다.") };
    }
    sowVersion = updated;
  } else {
    const nextVersion = (latestVersion?.version_number ?? 0) + 1;

    // sow_versions는 항상 draft로 먼저 만든다. protect_sow_children 트리거가
    // draft가 아닌 SOW엔 마일스톤/완료조건을 새로 넣지 못하게 막기 때문에,
    // in_review로 즉시 만들면 바로 아래에서 마일스톤 insert가 거부된다.
    const { data: inserted, error: insertError } = await supabase
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
        content_hash: contentHash,
        created_by: authData.user.id,
      })
      .select("id, version_number, status")
      .single();

    if (insertError || !inserted) {
      return { ok: false, error: mapBackendError(insertError, "업무 명세서를 저장하지 못했습니다.") };
    }
    sowVersion = inserted;
  }

  const milestoneUpsert = await upsertMilestonesForDraft(
    supabase,
    input.projectId,
    sowVersion.id,
    input.milestones,
    overallStart,
    overallEnd,
  );
  if (!milestoneUpsert.ok) {
    return milestoneUpsert;
  }

  for (let index = 0; index < input.milestones.length; index += 1) {
    const milestone = input.milestones[index];
    const code = milestone.code || `M${index + 1}`;
    const milestoneId = milestoneUpsert.data.get(code);
    if (!milestoneId) continue;

    const dods = milestone.dods.map((dod) => dod.trim()).filter(Boolean);
    const criteriaResult = await upsertCriteriaForMilestone(
      supabase,
      input.projectId,
      sowVersion.id,
      milestoneId,
      dods,
    );
    if (!criteriaResult.ok) {
      return criteriaResult;
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
    .select("title, budget_amount, budget_max_amount, currency, start_date, end_date")
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

  const { data: latestSow } = await supabase
    .from("sow_versions")
    .select("id, version_number, status, content")
    .eq("project_id", projectId)
    .in("status", ["draft", "in_review", "revision_requested"])
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  let latestSowDraft: SowWorkspaceDraft | null = null;
  let revisionRequestRows: SowRevisionRequestRow[] = [];

  if (latestSow) {
    const [
      { data: milestoneRows },
      { data: criterionRows },
      { data: revisionRows },
    ] = await Promise.all([
      supabase
        .from("milestones")
        .select("id, code, title, description, start_date, end_date, amount, currency, position, status")
        .eq("sow_version_id", latestSow.id)
        .order("position", { ascending: true }),
      supabase
        .from("completion_criteria")
        .select("id, milestone_id, kind, description, verification_method, position")
        .eq("sow_version_id", latestSow.id)
        .order("position", { ascending: true }),
      supabase
        .from("sow_revision_requests")
        .select("id, project_id, sow_version_id, requester_role, requester_name_snapshot, reason, requested_at")
        .eq("sow_version_id", latestSow.id)
        .order("requested_at", { ascending: false }),
    ]);

    const content = isRecord(latestSow.content) ? latestSow.content : {};
    const criteriaByMilestone = new Map<string, CompletionCriteriaApprovalRow[]>();
    for (const criterion of (criterionRows ?? []) as CompletionCriteriaApprovalRow[]) {
      const rows = criteriaByMilestone.get(criterion.milestone_id) ?? [];
      rows.push(criterion);
      criteriaByMilestone.set(criterion.milestone_id, rows);
    }

    latestSowDraft = {
      sowVersionId: latestSow.id,
      versionNumber: Number(latestSow.version_number),
      status: latestSow.status as SowStatus,
      workDetail: typeof content.workDetailKo === "string" ? content.workDetailKo : "",
      startDate: typeof content.startDateInput === "string" ? content.startDateInput : version?.start_date ?? "",
      endDate: typeof content.endDateInput === "string" ? content.endDateInput : version?.end_date ?? "",
      budget: typeof content.budget === "string" ? content.budget : "",
      englishSow: content.englishSow ?? null,
      milestones: ((milestoneRows ?? []) as MilestoneApprovalRow[]).map((milestone) => {
        const milestoneCriteria = criteriaByMilestone.get(milestone.id) ?? [];
        const dods = milestoneCriteria
          .filter((criterion) => criterion.kind === "definition_of_done")
          .map((criterion) => criterion.description);

        return {
          code: milestone.code,
          title: milestone.title,
          period: formatPeriodForDraft(milestone.start_date, milestone.end_date),
          amount: formatAmountForDraft(milestone.amount),
          dods: dods.length ? dods : [""],
        };
      }),
    };
    revisionRequestRows = (revisionRows ?? []) as SowRevisionRequestRow[];
  }

  return {
    ok: true,
    data: {
      projectId: project.id,
      title: version?.title ?? "(제목 없음)",
      lifecycleStage: project.lifecycle_stage,
      assigneeName,
      budgetAmount: version?.budget_amount == null ? 0 : Number(version.budget_amount),
      budgetMaxAmount: version?.budget_max_amount == null ? null : Number(version.budget_max_amount),
      currency: version?.currency ?? "USD",
      startDate: version?.start_date ?? "",
      endDate: version?.end_date ?? "",
      latestSowDraft,
      revisionRequests: revisionRequestRows.map(
        (request): SowRevisionRequestRecord => ({
          id: request.id,
          projectId: request.project_id,
          sowVersionId: request.sow_version_id,
          requesterRole: request.requester_role,
          requesterName: request.requester_name_snapshot,
          reason: request.reason,
          requestedAt: request.requested_at,
          readAt: null,
        }),
      ),
    },
  };
}

export async function getSowApprovalState(
  projectId: string,
  sowVersionId?: string,
  viewerRole?: UserRole,
): Promise<BackendResult<SowApprovalState | null>> {
  if (!isUuid(projectId) || (sowVersionId !== undefined && !isUuid(sowVersionId))) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 프로젝트 ID가 아닙니다." } };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  }

  const projectResult = await supabase
    .from("projects")
    .select("id, company_id, company_contact_name_snapshot")
    .eq("id", projectId)
    .maybeSingle();
  let project = projectResult.data as SowApprovalProjectRow | null;
  let projectError = projectResult.error;

  if (
    projectError?.code === "42703" ||
    projectError?.message?.includes("company_contact_name_snapshot")
  ) {
    const fallbackResult = await supabase
      .from("projects")
      .select("id, company_id")
      .eq("id", projectId)
      .maybeSingle();

    project = fallbackResult.data as SowApprovalProjectRow | null;
    projectError = fallbackResult.error;
  }

  if (projectError) {
    return { ok: false, error: mapBackendError(projectError, "프로젝트를 확인하지 못했습니다.") };
  }
  if (!project) {
    return { ok: false, error: { code: "NOT_FOUND", message: "프로젝트를 찾을 수 없습니다." } };
  }

  const projectRow = project as SowApprovalProjectRow;

  if (projectRow.company_id !== authData.user.id) {
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
  const companyNameSnapshot =
    typeof projectRow.company_contact_name_snapshot === "string" &&
    projectRow.company_contact_name_snapshot.trim()
      ? projectRow.company_contact_name_snapshot.trim()
      : null;
  const participantRows = await getSowApprovalParticipantRows(
    supabase,
    projectId,
    projectRow.company_id,
    companyNameSnapshot,
  );
  if (!participantRows.ok) return participantRows;

  const [
    { data: milestones, error: milestonesError },
    { data: criteria, error: criteriaError },
    { data: approvals, error: approvalsError },
    { data: revisionRequests, error: revisionRequestsError },
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
    supabase
      .from("sow_revision_requests")
      .select("id, project_id, sow_version_id, requester_role, requester_name_snapshot, reason, requested_at")
      .eq("sow_version_id", sowRow.id)
      .order("requested_at", { ascending: false }),
  ]);

  if (milestonesError || criteriaError || approvalsError || revisionRequestsError) {
    return {
      ok: false,
      error: mapBackendError(
        milestonesError ?? criteriaError ?? approvalsError ?? revisionRequestsError,
        "승인 상세 정보를 불러오지 못했습니다.",
      ),
    };
  }

  const revisionRequestRows = (revisionRequests ?? []) as SowRevisionRequestRow[];
  let revisionRequestReads: SowRevisionRequestReadRow[] = [];

  if (revisionRequestRows.length) {
    const requestIds = revisionRequestRows.map((request) => request.id);
    const { data: readRows, error: readRowsError } = await supabase
      .from("sow_revision_request_reads")
      .select("sow_revision_request_id, read_at")
      .eq("project_id", sowRow.project_id)
      .eq("read_by", authData.user.id)
      .in("sow_revision_request_id", requestIds);

    if (readRowsError && !isMissingRevisionReadTable(readRowsError)) {
      return {
        ok: false,
        error: mapBackendError(readRowsError, "수정 요청 확인 이력을 불러오지 못했습니다."),
      };
    }

    revisionRequestReads = (readRows ?? []) as SowRevisionRequestReadRow[];
  }

  const effectiveViewerRole: UserRole =
    viewerRole ?? (projectRow.company_id === authData.user.id ? "company" : "freelancer");

  return {
    ok: true,
    data: await toSowApprovalState({
      sowVersion: sowRow,
      milestones: (milestones ?? []) as MilestoneApprovalRow[],
      criteria: (criteria ?? []) as CompletionCriteriaApprovalRow[],
      approvals: (approvals ?? []) as SowApprovalRow[],
      participants: participantRows.data,
      revisionRequests: revisionRequestRows,
      revisionRequestReads,
      translate: effectiveViewerRole === "freelancer",
    }),
  };
}

export async function markSowRevisionRequestsRead(
  input: MarkSowRevisionRequestsReadInput,
): Promise<BackendResult<SowApprovalState>> {
  if (!isUuid(input.projectId) || !isUuid(input.sowVersionId)) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 SOW 수정 요청 대상이 아닙니다." } };
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
    return { ok: false, error: mapBackendError(projectError, "프로젝트 권한을 확인하지 못했습니다.") };
  }
  if (!project) {
    return { ok: false, error: { code: "FORBIDDEN", message: "발주자만 수정 요청을 확인 처리할 수 있습니다." } };
  }

  const { data: requests, error: requestsError } = await supabase
    .from("sow_revision_requests")
    .select("id")
    .eq("project_id", input.projectId)
    .eq("sow_version_id", input.sowVersionId);

  if (requestsError) {
    return { ok: false, error: mapBackendError(requestsError, "수정 요청 목록을 확인하지 못했습니다.") };
  }

  if (requests?.length) {
    const readRows = requests.map((request) => ({
      project_id: input.projectId,
      sow_revision_request_id: request.id,
      read_by: authData.user.id,
    }));

    const { error: readError } = await supabase
      .from("sow_revision_request_reads")
      .upsert(readRows, {
        onConflict: "sow_revision_request_id,read_by",
        ignoreDuplicates: true,
      });

    if (readError && !isDuplicateRevisionRead(readError) && !isMissingRevisionReadTable(readError)) {
      return { ok: false, error: mapBackendError(readError, "수정 요청 확인 이력을 저장하지 못했습니다.") };
    }
  }

  const state = await getSowApprovalState(input.projectId, input.sowVersionId, "company");
  if (!state.ok) return state;
  if (!state.data) {
    return { ok: false, error: { code: "NOT_FOUND", message: "수정 요청이 연결된 SOW를 다시 불러오지 못했습니다." } };
  }

  return { ok: true, data: state.data };
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

  const projectResult = await supabase
    .from("projects")
    .select("id, company_contact_name_snapshot")
    .eq("id", input.projectId)
    .eq("company_id", authData.user.id)
    .maybeSingle();
  let project = projectResult.data as Pick<
    SowApprovalProjectRow,
    "id" | "company_contact_name_snapshot"
  > | null;
  let projectError = projectResult.error;

  if (
    projectError?.code === "42703" ||
    projectError?.message?.includes("company_contact_name_snapshot")
  ) {
    const fallbackResult = await supabase
      .from("projects")
      .select("id")
      .eq("id", input.projectId)
      .eq("company_id", authData.user.id)
      .maybeSingle();

    project = fallbackResult.data as Pick<
      SowApprovalProjectRow,
      "id" | "company_contact_name_snapshot"
    > | null;
    projectError = fallbackResult.error;
  }

  if (projectError) {
    return { ok: false, error: mapBackendError(projectError, "프로젝트를 확인하지 못했습니다.") };
  }
  if (!project) {
    return { ok: false, error: { code: "NOT_FOUND", message: "프로젝트를 찾을 수 없습니다." } };
  }

  const projectRow = project as Pick<SowApprovalProjectRow, "id" | "company_contact_name_snapshot">;

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
    const companyNameSnapshot =
      typeof projectRow.company_contact_name_snapshot === "string" &&
      projectRow.company_contact_name_snapshot.trim()
        ? projectRow.company_contact_name_snapshot.trim()
        : null;
    const approverName =
      companyNameSnapshot ??
      (await getCompanyApprovalName(supabase, authData.user.id, authData.user.email));

    const { error: approvalError } = await supabase.from("sow_approvals").insert({
      project_id: input.projectId,
      sow_version_id: input.sowVersionId,
      approver_id: authData.user.id,
      approver_role: "company",
      approver_name_snapshot: approverName,
      content_hash: input.contentHash,
    });

    if (approvalError) {
      return { ok: false, error: mapBackendError(approvalError, "SOW 승인을 저장하지 못했습니다.") };
    }
  }

  // 두 번째 승인 시 DB 트리거가 SOW, 마일스톤, 프로젝트 상태를 한 트랜잭션에서 전환한다.
  // 애플리케이션에서 같은 전환을 반복하면 RLS와 충돌하므로 승인 행 삽입 후 결과만 다시 읽는다.
  const state = await getSowApprovalState(input.projectId, input.sowVersionId, "company");
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
    .select("id, freelancer_display_name_snapshot")
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
    const approverName = await getFreelancerApprovalName(
      supabase,
      authData.user.id,
      proposal.freelancer_display_name_snapshot,
      authData.user.email,
    );

    const { error: approvalError } = await supabase.from("sow_approvals").insert({
      project_id: input.projectId,
      sow_version_id: input.sowVersionId,
      approver_id: authData.user.id,
      approver_role: "freelancer",
      approver_name_snapshot: approverName,
      content_hash: input.contentHash,
    });

    if (approvalError) {
      return { ok: false, error: mapBackendError(approvalError, "SOW 승인을 저장하지 못했습니다.") };
    }
  }

  const state = await getSowApprovalState(input.projectId, input.sowVersionId, "freelancer");
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

  const { data: selection, error: selectionError } = await supabase
    .from("selections")
    .select("proposal_id")
    .eq("project_id", input.projectId)
    .maybeSingle();

  if (selectionError) {
    return { ok: false, error: mapBackendError(selectionError, "프로젝트 참여 권한을 확인하지 못했습니다.") };
  }
  if (!selection) {
    return { ok: false, error: { code: "FORBIDDEN", message: "선정된 프리랜서만 수정 요청을 보낼 수 있습니다." } };
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
    return { ok: false, error: { code: "FORBIDDEN", message: "선정된 프리랜서만 수정 요청을 보낼 수 있습니다." } };
  }

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
  const updated = await getSowApprovalState(input.projectId, input.sowVersionId, "freelancer");
  if (!updated.ok) return updated;
  if (!updated.data) return { ok: false, error: { code: "NOT_FOUND", message: "수정 요청된 SOW를 다시 불러오지 못했습니다." } };
  return { ok: true, data: updated.data };
}

async function toSowApprovalState({
  sowVersion,
  milestones,
  criteria,
  approvals,
  participants,
  revisionRequests,
  revisionRequestReads,
  translate = false,
}: {
  sowVersion: SowVersionApprovalRow;
  milestones: MilestoneApprovalRow[];
  criteria: CompletionCriteriaApprovalRow[];
  approvals: SowApprovalRow[];
  participants: SowApprovalParticipantRows;
  revisionRequests: SowRevisionRequestRow[];
  revisionRequestReads: SowRevisionRequestReadRow[];
  translate?: boolean;
}): Promise<SowApprovalState> {
  const document = await toSowApprovalDocument(sowVersion, translate);
  const criteriaByMilestone = new Map<string, CompletionCriteriaApprovalRow[]>();
  const approvalByRole = new Map<UserRole, SowApprovalRow>();
  const revisionReadByRequestId = new Map(
    revisionRequestReads.map((read) => [read.sow_revision_request_id, read.read_at]),
  );

  for (const criterion of criteria) {
    const rows = criteriaByMilestone.get(criterion.milestone_id) ?? [];
    rows.push(criterion);
    criteriaByMilestone.set(criterion.milestone_id, rows);
  }

  for (const approval of approvals) {
    approvalByRole.set(approval.approver_role, approval);
  }

  const mappedMilestones = await Promise.all(
    milestones.map(async (milestone) => {
      const milestoneCriteria = criteriaByMilestone.get(milestone.id) ?? [];
      const acceptanceCriteria = milestoneCriteria.filter((criterion) => criterion.kind === "acceptance");
      const definitionOfDone = milestoneCriteria.filter(
        (criterion) => criterion.kind === "definition_of_done",
      );

      const title = translate ? await translateToEnglish(milestone.title) : milestone.title;

      const mappedAcceptance = await Promise.all(
        acceptanceCriteria.map(async (criterion) => {
          const mapped = toSowApprovalCriterion(criterion);
          if (translate) {
            mapped.description = await translateToEnglish(mapped.description);
          }
          return mapped;
        })
      );

      const mappedDoD = await Promise.all(
        definitionOfDone.map(async (criterion) => {
          const mapped = toSowApprovalCriterion(criterion);
          if (translate) {
            mapped.description = await translateToEnglish(mapped.description);
          }
          return mapped;
        })
      );

      return {
        id: milestone.id,
        code: milestone.code,
        title,
        period: `${milestone.start_date} - ${milestone.end_date}`,
        amount: formatAmount(milestone.amount, milestone.currency),
        status: milestone.status,
        acceptanceCriteria: mappedAcceptance,
        definitionOfDone: mappedDoD,
        verificationMethods: Array.from(
          new Set(milestoneCriteria.map((criterion) => criterion.verification_method)),
        ),
      };
    })
  );

  const mappedRevisionRequests = await Promise.all(
    revisionRequests.map(
      async (request): Promise<SowRevisionRequestRecord> => ({
        id: request.id,
        projectId: request.project_id,
        sowVersionId: request.sow_version_id,
        requesterRole: request.requester_role,
        requesterName: request.requester_name_snapshot,
        reason: translate ? await translateToEnglish(request.reason) : request.reason,
        requestedAt: request.requested_at,
        readAt: revisionReadByRequestId.get(request.id) ?? null,
      }),
    )
  );

  return {
    projectId: sowVersion.project_id,
    sowVersionId: sowVersion.id,
    version: document.version,
    status: sowVersion.status,
    contentHash: sowVersion.content_hash,
    submittedForReviewAt: sowVersion.submitted_for_review_at,
    approvedAt: sowVersion.approved_at,
    participants: {
      company: {
        role: "company",
        roleLabel: "PO",
        displayName: participants.companyName ?? "PO",
      },
      freelancer: {
        role: "freelancer",
        roleLabel: "Freelancer",
        displayName: participants.freelancerName ?? "Freelancer",
      },
    },
    document,
    milestones: mappedMilestones,
    approvals: {
      company: toSowApprovalRecord(approvalByRole.get("company") ?? null),
      freelancer: toSowApprovalRecord(approvalByRole.get("freelancer") ?? null),
    },
    revisionRequests: mappedRevisionRequests,
  };
}

async function toSowApprovalDocument(sowVersion: SowVersionApprovalRow, translate = false): Promise<SowApprovalDocument> {
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

  let translatedWorkDetail = workDetailKo;
  let workDetailTitle = "한국어 업무 상세";
  if (translate && workDetailKo) {
    translatedWorkDetail = await translateToEnglish(workDetailKo);
    workDetailTitle = "Korean Work Details";
  }

  const documentSections = [
    workDetailKo
      ? {
          title: workDetailTitle,
          body: translatedWorkDetail,
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

function formatAmountForDraft(amount: number | string) {
  const numeric = Number(amount);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : String(amount);
}

function formatPeriodForDraft(startDate: string, endDate: string) {
  const start = startDate ? startDate.replaceAll("-", ".") : "";
  const end = endDate ? endDate.replaceAll("-", ".") : "";
  return [start, end].filter(Boolean).join(" - ");
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
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
