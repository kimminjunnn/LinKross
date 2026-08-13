import { createHash } from "crypto";

import type {
  BackendResult,
  SaveSowVersionInput,
  SaveSowVersionOutput,
  SowWorkspaceContext,
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
