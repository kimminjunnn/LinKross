import type {
  BackendResult,
  ProjectProposal,
  SelectProposalInput,
  SelectProposalOutput,
  SubmitProposalInput,
  SubmitProposalOutput,
} from "@/lib/backend/contracts";
import { COMMISSION_ENFORCEMENT_ENABLED } from "@/config/commission-status";
import { mapBackendError } from "@/lib/backend/errors";
import { validateSelectProposal, validateSubmitProposal } from "@/lib/backend/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ProposalRow {
  id: string;
  project_id: string;
  freelancer_id: string;
  requirement_version_id: string;
  content: string;
  optional_notes: string | null;
  status: "submitted" | "withdrawn";
  submitted_at: string;
  withdrawn_at: string | null;
  freelancer_display_name_snapshot: string | null;
  freelancer_headline_snapshot: string | null;
  freelancer_skills_snapshot: string | null;
  freelancer_portfolio_urls_snapshot: string[] | null;
}

export async function submitProposal(
  input: SubmitProposalInput,
): Promise<BackendResult<SubmitProposalOutput>> {
  const validationError = validateSubmitProposal(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  }

  const { data: freelancerProfile, error: freelancerProfileError } = await supabase
    .from("freelancer_profiles")
    .select("id")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (freelancerProfileError) {
    return { ok: false, error: mapBackendError(freelancerProfileError, "프리랜서 정보를 확인하지 못했습니다.") };
  }
  if (!freelancerProfile) {
    return {
      ok: false,
      error: {
        code: "FREELANCER_PROFILE_REQUIRED",
        message: "제안서를 제출하려면 먼저 프리랜서 프로필(이름, 소개 등)을 등록해주세요.",
      },
    };
  }

  if (COMMISSION_ENFORCEMENT_ENABLED) {
    const { data: overdueCharge, error: overdueChargeError } = await supabase
      .from("commission_charges")
      .select("id")
      .eq("freelancer_id", authData.user.id)
      .eq("status", "pending")
      .lt("due_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();
    if (overdueChargeError) {
      return { ok: false, error: mapBackendError(overdueChargeError, "수수료 납부 상태를 확인하지 못했습니다.") };
    }
    if (overdueCharge) {
      return {
        ok: false,
        error: { code: "COMMISSION_OVERDUE", message: "미납된 플랫폼 수수료가 있어 새 프로젝트에 지원할 수 없습니다." },
      };
    }
  }

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      project_id: input.projectId,
      freelancer_id: authData.user.id,
      content: input.content.trim(),
      optional_notes: emptyToNull(input.optionalNotes),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: mapBackendError(error, "수행 제안서를 제출하지 못했습니다.") };
  }

  return { ok: true, data: { proposalId: data.id } };
}

export async function listProjectProposals(
  projectId: string,
): Promise<BackendResult<ProjectProposal[]>> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  }

  const ownership = await verifyProjectOwner(supabase, projectId, authData.user.id);
  if (!ownership.ok) return ownership;

  const [{ data: proposals, error: proposalsError }, { data: selection, error: selectionError }] =
    await Promise.all([
      supabase
        .from("proposals")
        .select(
          "id, project_id, freelancer_id, requirement_version_id, content, optional_notes, status, submitted_at, withdrawn_at, freelancer_display_name_snapshot, freelancer_headline_snapshot, freelancer_skills_snapshot, freelancer_portfolio_urls_snapshot",
        )
        .eq("project_id", projectId)
        .order("submitted_at", { ascending: false }),
      supabase.from("selections").select("proposal_id").eq("project_id", projectId).maybeSingle(),
    ]);

  if (proposalsError || selectionError) {
    return {
      ok: false,
      error: mapBackendError(proposalsError ?? selectionError, "수행 제안서 목록을 불러오지 못했습니다."),
    };
  }

  const selectedProposalId = selection?.proposal_id ?? null;
  return {
    ok: true,
    data: ((proposals ?? []) as ProposalRow[]).map((proposal) => ({
      id: proposal.id,
      projectId: proposal.project_id,
      freelancerId: proposal.freelancer_id,
      requirementVersionId: proposal.requirement_version_id,
      content: proposal.content,
      optionalNotes: proposal.optional_notes,
      status: proposal.status,
      submittedAt: proposal.submitted_at,
      withdrawnAt: proposal.withdrawn_at,
      freelancer: {
        displayName: proposal.freelancer_display_name_snapshot,
        headline: proposal.freelancer_headline_snapshot,
        skills: proposal.freelancer_skills_snapshot,
        portfolioUrls: proposal.freelancer_portfolio_urls_snapshot ?? [],
      },
      isSelected: proposal.id === selectedProposalId,
    })),
  };
}

export async function selectProposal(
  input: SelectProposalInput,
): Promise<BackendResult<SelectProposalOutput>> {
  const validationError = validateSelectProposal(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: { code: "AUTH_REQUIRED", message: "로그인이 필요합니다." } };
  }

  const ownership = await verifyProjectOwner(supabase, input.projectId, authData.user.id);
  if (!ownership.ok) return ownership;

  const { data, error } = await supabase
    .from("selections")
    .insert({
      project_id: input.projectId,
      proposal_id: input.proposalId,
      selected_by: authData.user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: mapBackendError(error, "프리랜서를 선정하지 못했습니다.") };
  }

  return { ok: true, data: { selectionId: data.id } };
}

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function verifyProjectOwner(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  projectId: string,
  userId: string,
): Promise<BackendResult<null>> {
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("company_id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: mapBackendError(error, "프로젝트 권한을 확인하지 못했습니다.") };
  }
  if (!data) {
    return { ok: false, error: { code: "FORBIDDEN", message: "이 프로젝트의 발주자만 접근할 수 있습니다." } };
  }

  return { ok: true, data: null };
}
