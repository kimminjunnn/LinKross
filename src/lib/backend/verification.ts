import type {
  BackendResult,
  ConnectRepositoryInput,
  DecideMilestoneInput,
  MilestoneSubmissionReceipt,
  MilestoneSubmissionRecord,
  ProjectRepositoryRecord,
  RequestVerificationInput,
  SubmitMilestonePullRequestInput,
  VerificationMilestoneRecord,
  VerificationResultRecord,
  VerificationRunRecord,
  VerificationWorkspace,
} from "@/lib/backend/contracts";
import { COMMISSION_ENFORCEMENT_ENABLED, COMMISSION_GRACE_DAYS } from "@/config/commission-status";
import { mapBackendError } from "@/lib/backend/errors";
import { translateToEnglish } from "@/lib/backend/translation";
import { isUuid } from "@/lib/backend/validation";
import {
  getGitHubAppInstallationUrl,
  getGitHubPullRequest,
  getInstalledGitHubRepository,
  GitHubAppError,
} from "@/lib/github/app";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACTIVE_RUN_STATUSES } from "@/lib/verification-runner/contracts";
import { parseManualGuidanceSpec, resolveMvpVerificationDefinition } from "@/lib/verification-test-spec";

// lease 갱신 주기(300초)의 두 배. 이만큼 진척이 없으면 조정기가 끊긴 것으로 본다.
const STALLED_RUN_THRESHOLD_MS = 10 * 60 * 1_000;

const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?\/?$/i;
const GITHUB_PR_URL_PATTERN = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/i;

type AccessContext = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
  isCompany: boolean;
  isSelectedFreelancer: boolean;
};

export async function getVerificationWorkspace(
  projectId: string,
): Promise<BackendResult<VerificationWorkspace>> {
  const access = await getProjectAccess(projectId);
  if (!access.ok) return access;
  const { supabase, isCompany } = access.data;

  const [{ data: repository, error: repositoryError }, { data: sowVersion, error: sowError }] =
    await Promise.all([
      supabase
        .from("project_repositories")
        .select("id, project_id, owner_name, repository_name, repository_url, default_branch, github_installation_id, is_private, company_confirmed_at")
        .eq("project_id", projectId)
        .maybeSingle(),
      supabase
        .from("sow_versions")
        .select("id, version_number")
        .eq("project_id", projectId)
        .eq("status", "approved")
        .maybeSingle(),
    ]);

  if (repositoryError || sowError) {
    return {
      ok: false,
      error: mapBackendError(repositoryError ?? sowError, "검수 기준 정보를 불러오지 못했습니다."),
    };
  }

  if (!sowVersion) {
    return {
      ok: true,
      data: {
        projectId,
        isCompany,
        repository: repository ? toRepository(repository) : null,
        sowVersionId: null,
        sowVersionNumber: null,
        milestones: [],
      },
    };
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
  if (milestoneIds.length === 0) {
    return {
      ok: true,
      data: {
        projectId,
        isCompany,
        repository: repository ? toRepository(repository) : null,
        sowVersionId: sowVersion.id,
        sowVersionNumber: sowVersion.version_number,
        milestones: [],
      },
    };
  }

  const [criteriaResult, submissionsResult, decisionsResult] = await Promise.all([
    supabase
      .from("completion_criteria")
      .select("id, milestone_id, description, verification_method, is_required, position, test_spec")
      .in("milestone_id", milestoneIds)
      .order("position", { ascending: true }),
    supabase
      .from("milestone_submissions")
      .select("id, milestone_id, attempt_number, pull_request_number, pull_request_title, pull_request_url, head_branch, head_commit_sha, implementation_note, submitted_at")
      .in("milestone_id", milestoneIds)
      .order("attempt_number", { ascending: false }),
    supabase
      .from("milestone_decisions")
      .select("milestone_id, submission_id, decision, reason, decided_at")
      .in("milestone_id", milestoneIds)
      .order("decided_at", { ascending: false }),
  ]);

  const firstError = criteriaResult.error ?? submissionsResult.error ?? decisionsResult.error;
  if (firstError) {
    return { ok: false, error: mapBackendError(firstError, "검수 제출 정보를 불러오지 못했습니다.") };
  }

  const submissionRows = submissionsResult.data ?? [];
  const submissionIds = submissionRows.map((row) => row.id);
  const [claimsResult, runsResult] = submissionIds.length
    ? await Promise.all([
        supabase
          .from("milestone_submission_criteria")
          .select("submission_id, criterion_id")
          .in("submission_id", submissionIds),
        supabase
          .from("verification_runs")
          .select("id, submission_id, scope, requested_criterion_id, attempt_number, status, queued_at, started_at, completed_at, preview_url, error_summary")
          .in("submission_id", submissionIds)
          .order("queued_at", { ascending: false }),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];

  if (claimsResult.error || runsResult.error) {
    return {
      ok: false,
      error: mapBackendError(claimsResult.error ?? runsResult.error, "검수 실행 정보를 불러오지 못했습니다."),
    };
  }

  const runRows = runsResult.data ?? [];
  const runIds = runRows.map((row) => row.id);
  const resultsResult = runIds.length
    ? await supabase
        .from("criterion_results")
        .select("id, run_id, criterion_id, status, observed_result, error_message")
        .in("run_id", runIds)
    : { data: [], error: null };

  if (resultsResult.error) {
    return { ok: false, error: mapBackendError(resultsResult.error, "완료조건 결과를 불러오지 못했습니다.") };
  }

  const resultRows = resultsResult.data ?? [];
  const resultIds = resultRows.map((row) => row.id);
  const evidenceResult = resultIds.length
    ? await supabase
        .from("evidence_artifacts")
        .select("id, criterion_result_id, artifact_type, external_url, storage_path")
        .in("criterion_result_id", resultIds)
    : { data: [], error: null };

  if (evidenceResult.error) {
    return { ok: false, error: mapBackendError(evidenceResult.error, "검수 증거를 불러오지 못했습니다.") };
  }

  const criteriaByMilestone = groupBy(criteriaResult.data ?? [], "milestone_id");
  const submissionsByMilestone = groupBy(submissionRows, "milestone_id");
  const claimsBySubmission = groupBy(claimsResult.data ?? [], "submission_id");
  const runsBySubmission = groupBy(runRows, "submission_id");
  const resultsByRun = groupBy(resultRows, "run_id");
  const evidenceByResult = groupBy(evidenceResult.data ?? [], "criterion_result_id");
  const storagePaths = Array.from(
    new Set(
      (evidenceResult.data ?? [])
        .map((artifact) => artifact.storage_path)
        .filter((path): path is string => Boolean(path)),
    ),
  );
  const signedUrlByPath = new Map<string, string>();
  if (storagePaths.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from("linkross-evidence")
      .createSignedUrls(storagePaths, 60 * 60);
    for (const signed of signedUrls ?? []) {
      if (signed.path && signed.signedUrl) signedUrlByPath.set(signed.path, signed.signedUrl);
    }
  }
  type DecisionRow = NonNullable<typeof decisionsResult.data>[number];
  const latestDecisionByMilestone = new Map<string, DecisionRow>();
  for (const decision of decisionsResult.data ?? []) {
    if (!latestDecisionByMilestone.has(decision.milestone_id)) {
      latestDecisionByMilestone.set(decision.milestone_id, decision);
    }
  }

  const shouldTranslate = !isCompany;

  const milestones: VerificationMilestoneRecord[] = await Promise.all(
    (milestoneRows ?? []).map(async (milestone) => {
      const title = shouldTranslate ? await translateToEnglish(milestone.title) : milestone.title;
      const description = shouldTranslate ? await translateToEnglish(milestone.description) : milestone.description;

      const checklist = await Promise.all(
        (criteriaByMilestone.get(milestone.id) ?? []).map(async (criterion) => {
          const verification = resolveMvpVerificationDefinition({
            description: criterion.description,
            verificationMethod: criterion.verification_method,
            testSpec: criterion.test_spec,
          });
          const guidance = parseManualGuidanceSpec(criterion.test_spec);
          const desc = shouldTranslate ? await translateToEnglish(criterion.description) : criterion.description;
          return {
            id: criterion.id,
            description: desc,
            verificationMethod: verification.verificationMethod,
            isRequired: criterion.is_required,
            ...(guidance
              ? { manualGuidance: { location: guidance.location, method: guidance.method, expected: guidance.expected } }
              : {}),
          };
        })
      );

      const submissions = await Promise.all(
        (submissionsByMilestone.get(milestone.id) ?? []).map((submission) =>
          toSubmission(
            submission,
            claimsBySubmission.get(submission.id) ?? [],
            runsBySubmission.get(submission.id) ?? [],
            resultsByRun,
            evidenceByResult,
            signedUrlByPath,
            shouldTranslate,
          ),
        ),
      );

      const decisionRow = latestDecisionByMilestone.get(milestone.id);
      let decision = null;
      if (decisionRow) {
        const reason = shouldTranslate && decisionRow.reason ? await translateToEnglish(decisionRow.reason) : decisionRow.reason;
        decision = {
          submissionId: decisionRow.submission_id,
          decision: decisionRow.decision,
          reason,
          decidedAt: decisionRow.decided_at,
        };
      }

      return {
        id: milestone.id,
        code: milestone.code,
        title,
        description,
        startDate: milestone.start_date,
        endDate: milestone.end_date,
        amount: Number(milestone.amount),
        currency: milestone.currency,
        status: milestone.status,
        position: milestone.position,
        checklist,
        submissions,
        decision,
      };
    })
  );

  return {
    ok: true,
    data: {
      projectId,
      isCompany,
      repository: repository ? toRepository(repository) : null,
      sowVersionId: sowVersion.id,
      sowVersionNumber: sowVersion.version_number,
      milestones,
    },
  };
}

export async function getProjectGitHubAppInstallationUrl(
  projectId: string,
): Promise<BackendResult<{ url: string }>> {
  const access = await getProjectAccess(projectId);
  if (!access.ok) return access;
  if (!access.data.isCompany) {
    return {
      ok: false,
      error: { code: "FORBIDDEN", message: "발주자만 GitHub App을 설치할 수 있습니다." },
    };
  }

  try {
    return { ok: true, data: { url: await getGitHubAppInstallationUrl() } };
  } catch (error) {
    return { ok: false, error: mapGitHubAppError(error) };
  }
}

export async function connectProjectRepository(
  input: ConnectRepositoryInput,
): Promise<BackendResult<ProjectRepositoryRecord>> {
  if (!isUuid(input.projectId)) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 프로젝트 ID가 아닙니다." } };
  }
  const match = input.repositoryUrl.trim().match(GITHUB_URL_PATTERN);
  if (!match) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "GitHub 저장소 URL을 입력해주세요." } };
  }

  const access = await getProjectAccess(input.projectId);
  if (!access.ok) return access;
  if (!access.data.isCompany) {
    return { ok: false, error: { code: "FORBIDDEN", message: "발주자만 공식 저장소를 확정할 수 있습니다." } };
  }

  const owner = match[1];
  const name = match[2];
  const installedRepository = await readInstalledRepository(owner, name);
  if (!installedRepository.ok) return installedRepository;
  const github = installedRepository.data.repository;
  if (github.archived) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "보관된 저장소는 검수 대상으로 연결할 수 없습니다." } };
  }

  const [canonicalOwner, canonicalName] = github.full_name.split("/");
  const { data, error } = await access.data.supabase
    .from("project_repositories")
    .upsert(
      {
        project_id: input.projectId,
        provider: "github",
        owner_name: canonicalOwner,
        repository_name: canonicalName,
        repository_url: github.html_url,
        default_branch: github.default_branch,
        github_repository_id: github.id,
        github_installation_id: installedRepository.data.installationId,
        is_private: github.private,
        connected_by: access.data.userId,
        company_confirmed_at: new Date().toISOString(),
      },
      { onConflict: "project_id" },
    )
    .select("id, project_id, owner_name, repository_name, repository_url, default_branch, github_installation_id, is_private, company_confirmed_at")
    .single();

  if (error || !data) {
    return { ok: false, error: mapBackendError(error, "GitHub 저장소를 연결하지 못했습니다.") };
  }
  return { ok: true, data: toRepository(data) };
}

export async function submitMilestonePullRequest(
  input: SubmitMilestonePullRequestInput,
): Promise<BackendResult<MilestoneSubmissionReceipt>> {
  if (!isUuid(input.projectId) || !isUuid(input.milestoneId)) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 마일스톤 제출 대상이 아닙니다." } };
  }
  const prMatch = input.pullRequestUrl.trim().match(GITHUB_PR_URL_PATTERN);
  if (!prMatch) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "GitHub PR URL 형식이 올바르지 않습니다." } };
  }

  const access = await getProjectAccess(input.projectId);
  if (!access.ok) return access;
  if (!access.data.isSelectedFreelancer) {
    return { ok: false, error: { code: "FORBIDDEN", message: "선정된 프리랜서만 코드를 제출할 수 있습니다." } };
  }

  if (COMMISSION_ENFORCEMENT_ENABLED) {
    const graceExpiredAt = new Date(Date.now() - COMMISSION_GRACE_DAYS * 86_400_000).toISOString();
    const { data: gracedCommissionCharge, error: gracedCommissionChargeError } = await access.data.supabase
      .from("commission_charges")
      .select("id")
      .eq("freelancer_id", access.data.userId)
      .eq("status", "pending")
      .lt("due_at", graceExpiredAt)
      .limit(1)
      .maybeSingle();
    if (gracedCommissionChargeError) {
      return { ok: false, error: mapBackendError(gracedCommissionChargeError, "수수료 납부 상태를 확인하지 못했습니다.") };
    }
    if (gracedCommissionCharge) {
      return {
        ok: false,
        error: { code: "FORBIDDEN", message: "미납 수수료 유예기간이 지나 새 마일스톤 제출이 제한되었습니다. 수수료 납부 후 다시 시도해주세요." },
      };
    }
  }

  const { data: repository, error: repositoryError } = await access.data.supabase
    .from("project_repositories")
    .select("id, owner_name, repository_name, github_repository_id, github_installation_id")
    .eq("project_id", input.projectId)
    .maybeSingle();
  if (repositoryError) {
    return { ok: false, error: mapBackendError(repositoryError, "연결 저장소를 확인하지 못했습니다.") };
  }
  if (!repository) {
    return { ok: false, error: { code: "CONFLICT", message: "발주자가 공식 GitHub 저장소를 먼저 연결해야 합니다." } };
  }
  if (!repository.github_repository_id || !repository.github_installation_id) {
    return {
      ok: false,
      error: {
        code: "CONFLICT",
        message: "GitHub App으로 공식 저장소를 다시 연결한 뒤 PR을 제출해주세요.",
      },
    };
  }
  if (
    prMatch[1].toLowerCase() !== repository.owner_name.toLowerCase() ||
    prMatch[2].toLowerCase() !== repository.repository_name.toLowerCase()
  ) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "프로젝트 공식 저장소의 PR만 제출할 수 있습니다." } };
  }

  const { data: milestone, error: milestoneError } = await access.data.supabase
    .from("milestones")
    .select("id, status")
    .eq("id", input.milestoneId)
    .eq("project_id", input.projectId)
    .maybeSingle();
  if (milestoneError || !milestone) {
    return { ok: false, error: mapBackendError(milestoneError, "마일스톤을 확인하지 못했습니다.") };
  }
  if (["approved", "cancelled"].includes(milestone.status)) {
    return { ok: false, error: { code: "CONFLICT", message: "완료되거나 취소된 마일스톤에는 새 제출을 추가할 수 없습니다." } };
  }

  const uniqueCriterionIds = Array.from(new Set(input.claimedCriterionIds));
  if (
    uniqueCriterionIds.length === 0 ||
    uniqueCriterionIds.length > 50 ||
    uniqueCriterionIds.some((id) => !isUuid(id))
  ) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "구현 완료한 조건을 한 개 이상 선택해주세요." } };
  }
  const { data: criteria, error: criteriaError } = await access.data.supabase
    .from("completion_criteria")
    .select("id")
    .eq("milestone_id", input.milestoneId)
    .in("id", uniqueCriterionIds);
  if (criteriaError || (criteria ?? []).length !== uniqueCriterionIds.length) {
    return { ok: false, error: mapBackendError(criteriaError, "완료조건 선택을 확인하지 못했습니다.") };
  }

  const prNumber = Number(prMatch[3]);
  if (!Number.isSafeInteger(prNumber) || prNumber <= 0) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "GitHub PR 번호가 올바르지 않습니다." } };
  }
  const pullRequest = await readPullRequest({
    installationId: repository.github_installation_id,
    repositoryId: repository.github_repository_id,
    owner: repository.owner_name,
    repository: repository.repository_name,
    pullRequestNumber: prNumber,
  });
  if (!pullRequest.ok) return pullRequest;
  const github = pullRequest.data;
  if (github.state !== "open") {
    return { ok: false, error: { code: "CONFLICT", message: "열려 있는 GitHub PR만 검수 대상으로 제출할 수 있습니다." } };
  }
  if (github.base.repo.id !== repository.github_repository_id) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "공식 프로젝트 저장소를 대상으로 하는 PR만 제출할 수 있습니다." } };
  }
  if (!/^[0-9a-f]{40}$/i.test(github.head.sha)) {
    return { ok: false, error: { code: "CONFLICT", message: "GitHub에서 전체 Commit SHA를 확인하지 못했습니다." } };
  }

  const { data: existing, error: existingError } = await access.data.supabase
    .from("milestone_submissions")
    .select("id, head_commit_sha")
    .eq("milestone_id", input.milestoneId)
    .eq("head_commit_sha", github.head.sha)
    .maybeSingle();
  if (existingError) {
    return { ok: false, error: mapBackendError(existingError, "기존 PR 제출 기록을 확인하지 못했습니다.") };
  }

  if (existing) {
    return queueSubmissionVerification(access.data, input, existing);
  }

  const { data: previous } = await access.data.supabase
    .from("milestone_submissions")
    .select("id, attempt_number")
    .eq("milestone_id", input.milestoneId)
    .order("attempt_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: submission, error: submissionError } = await access.data.supabase
    .from("milestone_submissions")
    .insert({
      project_id: input.projectId,
      milestone_id: input.milestoneId,
      repository_id: repository.id,
      attempt_number: (previous?.attempt_number ?? 0) + 1,
      pull_request_number: github.number,
      pull_request_title: github.title,
      pull_request_url: github.html_url,
      head_branch: github.head.ref,
      head_commit_sha: github.head.sha,
      implementation_note: input.implementationNote?.trim() || null,
      submitted_by: access.data.userId,
      previous_submission_id: previous?.id ?? null,
    })
    .select("id, head_commit_sha")
    .single();

  if (submissionError || !submission) {
    if (submissionError?.code === "23505") {
      const { data: concurrentSubmission } = await access.data.supabase
        .from("milestone_submissions")
        .select("id, head_commit_sha")
        .eq("milestone_id", input.milestoneId)
        .eq("head_commit_sha", github.head.sha)
        .maybeSingle();
      if (concurrentSubmission) {
        return queueSubmissionVerification(access.data, input, concurrentSubmission);
      }
    }
    return { ok: false, error: mapBackendError(submissionError, "PR 제출 기록을 저장하지 못했습니다.") };
  }

  const claims = await saveSubmissionCriteria(
    access.data,
    submission.id,
    input.milestoneId,
    uniqueCriterionIds,
  );
  if (!claims.ok) return claims;

  return queueSubmissionVerification(access.data, input, submission);
}

export async function requestVerificationRun(
  input: RequestVerificationInput,
): Promise<BackendResult<{ runId: string; status: string; retriable: boolean }>> {
  if (![input.projectId, input.milestoneId, input.submissionId].every(isUuid)) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 검수 요청 대상이 아닙니다." } };
  }
  if (input.scope === "criterion" && (!input.criterionId || !isUuid(input.criterionId))) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "검수할 완료조건이 필요합니다." } };
  }

  const access = await getProjectAccess(input.projectId);
  if (!access.ok) return access;
  return requestVerificationRunForAccess(access.data, input);
}

async function requestVerificationRunForAccess(
  access: AccessContext,
  input: RequestVerificationInput,
): Promise<BackendResult<{
  runId: string;
  status: VerificationRunRecord["status"];
  /** 지금 실행을 걸어도 되는지. 대기 중이거나, 진행 중인데 멈춰 버린 실행이다. */
  retriable: boolean;
}>> {
  const { data: submission, error: submissionError } = await access.supabase
    .from("milestone_submissions")
    .select("id")
    .eq("id", input.submissionId)
    .eq("milestone_id", input.milestoneId)
    .eq("project_id", input.projectId)
    .maybeSingle();
  if (submissionError || !submission) {
    return { ok: false, error: mapBackendError(submissionError, "검수 제출을 확인하지 못했습니다.") };
  }

  if (input.scope === "criterion") {
    const { data: claim, error: claimError } = await access.supabase
      .from("milestone_submission_criteria")
      .select("criterion_id")
      .eq("submission_id", input.submissionId)
      .eq("criterion_id", input.criterionId!)
      .maybeSingle();
    if (claimError || !claim) {
      return { ok: false, error: mapBackendError(claimError, "제출 완료된 조건만 검수할 수 있습니다.") };
    }
  }

  let latestQuery = access.supabase
    .from("verification_runs")
    .select("id, status, attempt_number, started_at")
    .eq("submission_id", input.submissionId)
    .eq("scope", input.scope)
    .order("attempt_number", { ascending: false })
    .limit(1);
  latestQuery = input.scope === "criterion"
    ? latestQuery.eq("requested_criterion_id", input.criterionId!)
    : latestQuery.is("requested_criterion_id", null);
  const { data: latestRows, error: latestError } = await latestQuery;
  if (latestError) return { ok: false, error: mapBackendError(latestError, "이전 검수 요청을 확인하지 못했습니다.") };
  const previousRun = latestRows?.[0];
  if (previousRun && ACTIVE_RUN_STATUSES.includes(previousRun.status)) {
    // 조정기가 함수 실행시간 한도에 잘리면 실행은 진행 중 상태로 남고 lease만
    // 만료된다. 그 상태에서 재검수를 눌러도 아무 일도 일어나지 않아 화면이
    // 영원히 "검수 중"에 머물렀다. 멈춘 실행은 다시 걸 수 있게 표시한다.
    // 실제 재선점은 lease가 만료된 실행만 가져가므로 살아 있는 실행은 안전하다.
    return {
      ok: true,
      data: {
        runId: previousRun.id,
        status: previousRun.status,
        retriable: previousRun.status === "queued" || isStalledRun(previousRun.started_at),
      },
    };
  }
  const nextAttempt = (previousRun?.attempt_number ?? 0) + 1;
  const idempotencyKey = [input.submissionId, input.scope, input.criterionId ?? "all", nextAttempt].join(":");

  const { data: run, error: runError } = await access.supabase
    .from("verification_runs")
    .insert({
      project_id: input.projectId,
      milestone_id: input.milestoneId,
      submission_id: input.submissionId,
      scope: input.scope,
      requested_criterion_id: input.scope === "criterion" ? input.criterionId : null,
      attempt_number: nextAttempt,
      idempotency_key: idempotencyKey,
      status: "queued",
      requested_by: access.userId,
    })
    .select("id, status")
    .single();

  if (runError || !run) {
    if (runError?.code === "23505") {
      const { data: concurrentRun } = await access.supabase
        .from("verification_runs")
        .select("id, status")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (concurrentRun) {
        return { ok: true, data: { runId: concurrentRun.id, status: concurrentRun.status, retriable: false } };
      }
    }
    return { ok: false, error: mapBackendError(runError, "검수 요청을 저장하지 못했습니다.") };
  }
  return { ok: true, data: { runId: run.id, status: run.status, retriable: true } };
}

/**
 * 진행 중으로 보이지만 실제로는 끊긴 실행인지 판단한다.
 *
 * Runner lease는 300초마다 갱신된다. 그보다 넉넉히 지나도록 진척이 없으면
 * 조정기가 죽은 것이다. 살아 있는 실행을 성급히 멈춘 것으로 보지 않도록
 * 여유를 둔다.
 */
function isStalledRun(startedAt: string | null): boolean {
  if (!startedAt) return true;
  const started = new Date(startedAt).getTime();
  if (!Number.isFinite(started)) return true;
  return Date.now() - started > STALLED_RUN_THRESHOLD_MS;
}

async function saveSubmissionCriteria(
  access: AccessContext,
  submissionId: string,
  milestoneId: string,
  criterionIds: string[],
): Promise<BackendResult<{ saved: true }>> {
  const { error } = await access.supabase
    .from("milestone_submission_criteria")
    .insert(
      criterionIds.map((criterionId) => ({
        submission_id: submissionId,
        milestone_id: milestoneId,
        criterion_id: criterionId,
      })),
    );
  if (error) {
    return { ok: false, error: mapBackendError(error, "제출 완료조건을 저장하지 못했습니다.") };
  }
  return { ok: true, data: { saved: true } };
}

async function queueSubmissionVerification(
  access: AccessContext,
  input: Pick<SubmitMilestonePullRequestInput, "projectId" | "milestoneId">,
  submission: { id: string; head_commit_sha: string },
): Promise<BackendResult<MilestoneSubmissionReceipt>> {
  const verification = await requestVerificationRunForAccess(access, {
    projectId: input.projectId,
    milestoneId: input.milestoneId,
    submissionId: submission.id,
    scope: "milestone",
  });
  if (!verification.ok) return verification;

  return {
    ok: true,
    data: {
      submissionId: submission.id,
      headCommitSha: submission.head_commit_sha,
      verificationRunId: verification.data.runId,
      verificationStatus: verification.data.status,
    },
  };
}

/**
 * 진행 중인 검수 실행을 사용자가 중단한다.
 *
 * 조정기가 끊기면 실행은 진행 중 상태로 남고 화면은 계속 "검수 중"을 표시한다.
 * 자동 복구(멈춘 실행 재선점)만으로는 사용자가 지금 당장 멈출 방법이 없어,
 * 명시적인 중단 경로를 둔다.
 *
 * verification_runs에는 UPDATE 정책이 없어 사용자 세션으로는 상태를 바꿀 수
 * 없다. 프로젝트 접근 권한을 먼저 확인한 뒤 서버 권한으로 기록한다.
 */
export async function cancelVerificationRun(input: {
  projectId: string;
  runId: string;
}): Promise<BackendResult<{ runId: string; status: VerificationRunRecord["status"] }>> {
  if (!isUuid(input.projectId) || !isUuid(input.runId)) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 검수 실행이 아닙니다." } };
  }

  const access = await getProjectAccess(input.projectId);
  if (!access.ok) return access;

  const { data: run, error: runError } = await access.data.supabase
    .from("verification_runs")
    .select("id, status, project_id")
    .eq("id", input.runId)
    .eq("project_id", input.projectId)
    .maybeSingle();
  if (runError || !run) {
    return { ok: false, error: mapBackendError(runError, "검수 실행을 찾을 수 없습니다.") };
  }
  if (!ACTIVE_RUN_STATUSES.includes(run.status as never)) {
    return {
      ok: false,
      error: { code: "CONFLICT", message: "이미 끝난 검수는 중단할 수 없습니다." },
    };
  }

  // 조정기가 아직 살아 있다면 완료 기록이 거부되고 격리 환경은 스스로 정리된다.
  const { data: cancelled, error: cancelError } = await createSupabaseAdminClient()
    .from("verification_runs")
    .update({
      status: "cancelled",
      completed_at: new Date().toISOString(),
      error_summary: "발주자 또는 프리랜서가 검수를 중단했습니다.",
    })
    .eq("id", input.runId)
    .in("status", [...ACTIVE_RUN_STATUSES])
    .select("id, status")
    .maybeSingle();
  if (cancelError || !cancelled) {
    return { ok: false, error: mapBackendError(cancelError, "검수를 중단하지 못했습니다.") };
  }
  return { ok: true, data: { runId: cancelled.id, status: cancelled.status } };
}

export async function decideMilestone(
  input: DecideMilestoneInput,
): Promise<BackendResult<{ decisionId: string }>> {
  if (![input.projectId, input.milestoneId, input.submissionId].every(isUuid)) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 승인 대상이 아닙니다." } };
  }
  if (input.verificationRunId && !isUuid(input.verificationRunId)) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "올바른 검수 실행이 아닙니다." } };
  }
  if (input.decision === "revision_required" && !input.reason?.trim()) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "수정 요청 사유를 입력해주세요." } };
  }

  const access = await getProjectAccess(input.projectId);
  if (!access.ok) return access;
  if (!access.data.isCompany) {
    return { ok: false, error: { code: "FORBIDDEN", message: "발주자만 최종 결정을 기록할 수 있습니다." } };
  }

  if (input.decision === "approved") {
    if (!input.verificationRunId) {
      return { ok: false, error: { code: "CONFLICT", message: "검수 실행 결과를 선택해야 승인할 수 있습니다." } };
    }
    const { data: run, error: runError } = await access.data.supabase
      .from("verification_runs")
      .select("status")
      .eq("id", input.verificationRunId)
      .eq("submission_id", input.submissionId)
      .maybeSingle();
    if (runError || !run || !["passed", "needs_review"].includes(run.status)) {
      return { ok: false, error: mapBackendError(runError, "통과 또는 사람 확인 결과가 있는 실행만 승인할 수 있습니다.") };
    }
  }

  const { data, error } = await access.data.supabase
    .from("milestone_decisions")
    .insert({
      project_id: input.projectId,
      milestone_id: input.milestoneId,
      submission_id: input.submissionId,
      verification_run_id: input.verificationRunId ?? null,
      decision: input.decision,
      reason: input.reason?.trim() || null,
      decided_by: access.data.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: mapBackendError(error, "마일스톤 결정을 저장하지 못했습니다.") };
  }
  return { ok: true, data: { decisionId: data.id } };
}

async function getProjectAccess(projectId: string): Promise<BackendResult<AccessContext>> {
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
    .select("id, company_id")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError) {
    return { ok: false, error: mapBackendError(projectError, "프로젝트 권한을 확인하지 못했습니다.") };
  }
  if (!project) {
    return { ok: false, error: { code: "NOT_FOUND", message: "프로젝트를 찾을 수 없습니다." } };
  }
  const isCompany = project.company_id === authData.user.id;
  const { data: selection, error: selectionError } = await supabase
    .from("selections")
    .select("proposal_id")
    .eq("project_id", projectId)
    .maybeSingle();
  if (selectionError) {
    return {
      ok: false,
      error: mapBackendError(selectionError, "프로젝트 참여 권한을 확인하지 못했습니다."),
    };
  }
  const { data: selectedProposal, error: proposalError } = selection
    ? await supabase
        .from("proposals")
        .select("freelancer_id")
        .eq("id", selection.proposal_id)
        .eq("project_id", projectId)
        .maybeSingle()
    : { data: null, error: null };
  if (proposalError) {
    return {
      ok: false,
      error: mapBackendError(proposalError, "선정 프리랜서 권한을 확인하지 못했습니다."),
    };
  }
  const isSelectedFreelancer = selectedProposal?.freelancer_id === authData.user.id;
  if (!isCompany && !isSelectedFreelancer) {
    return {
      ok: false,
      error: { code: "FORBIDDEN", message: "프로젝트 참여자만 검수 정보를 확인할 수 있습니다." },
    };
  }

  return {
    ok: true,
    data: { supabase, userId: authData.user.id, isCompany, isSelectedFreelancer },
  };
}

async function readInstalledRepository(
  owner: string,
  repository: string,
): Promise<BackendResult<Awaited<ReturnType<typeof getInstalledGitHubRepository>>>> {
  try {
    return { ok: true, data: await getInstalledGitHubRepository(owner, repository) };
  } catch (error) {
    return { ok: false, error: mapGitHubAppError(error) };
  }
}

async function readPullRequest(
  input: Parameters<typeof getGitHubPullRequest>[0],
): Promise<BackendResult<Awaited<ReturnType<typeof getGitHubPullRequest>>>> {
  try {
    return { ok: true, data: await getGitHubPullRequest(input) };
  } catch (error) {
    return { ok: false, error: mapGitHubAppError(error) };
  }
}

function mapGitHubAppError(error: unknown) {
  if (error instanceof GitHubAppError) {
    return {
      code: error.status === 404 ? "NOT_FOUND" as const : "CONFLICT" as const,
      message: error.message,
      diagnosticCode: error.diagnosticCode,
    };
  }
  return {
    code: "CONFLICT" as const,
    message: "GitHub 요청을 처리하지 못했습니다. 다시 시도해주세요.",
  };
}

function toRepository(row: {
  id: string;
  project_id: string;
  owner_name: string;
  repository_name: string;
  repository_url: string;
  default_branch: string | null;
  github_installation_id: number | null;
  is_private: boolean;
  company_confirmed_at: string | null;
}): ProjectRepositoryRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    owner: row.owner_name,
    name: row.repository_name,
    url: row.repository_url,
    defaultBranch: row.default_branch,
    installationId: row.github_installation_id,
    isPrivate: row.is_private,
    companyConfirmedAt: row.company_confirmed_at,
  };
}

async function toSubmission(
  submission: {
    id: string;
    attempt_number: number;
    pull_request_number: number;
    pull_request_title: string;
    pull_request_url: string;
    head_branch: string;
    head_commit_sha: string;
    implementation_note: string | null;
    submitted_at: string;
  },
  claims: Array<{ criterion_id: string }>,
  runs: Array<{
    id: string;
    scope: "criterion" | "milestone";
    requested_criterion_id: string | null;
    attempt_number: number;
    status: VerificationRunRecord["status"];
    queued_at: string;
    started_at: string | null;
    completed_at: string | null;
    preview_url: string | null;
    error_summary: string | null;
  }>,
  resultsByRun: Map<string, Array<{
    id: string;
    criterion_id: string;
    status: VerificationResultRecord["status"];
    observed_result: string | null;
    error_message: string | null;
  }>>,
  evidenceByResult: Map<string, Array<{
    id: string;
    artifact_type: string;
    external_url: string | null;
    storage_path: string | null;
  }>>,
  signedUrlByPath: Map<string, string>,
  translate = false,
): Promise<MilestoneSubmissionRecord> {
  const implementationNote = translate && submission.implementation_note
    ? await translateToEnglish(submission.implementation_note)
    : submission.implementation_note;

  const mappedRuns = await Promise.all(
    runs.map(async (run) => {
      const errorSummary = translate && run.error_summary
        ? await translateToEnglish(run.error_summary)
        : run.error_summary;

      const results = await Promise.all(
        (resultsByRun.get(run.id) ?? []).map(async (result) => {
          const observedResult = translate && result.observed_result
            ? await translateToEnglish(result.observed_result)
            : result.observed_result;
          const errorMessage = translate && result.error_message
            ? await translateToEnglish(result.error_message)
            : result.error_message;

          return {
            id: result.id,
            criterionId: result.criterion_id,
            status: result.status,
            observedResult,
            errorMessage,
            evidence: (evidenceByResult.get(result.id) ?? []).map((artifact) => ({
              id: artifact.id,
              type: artifact.artifact_type,
              url: artifact.external_url
                ?? (artifact.storage_path ? signedUrlByPath.get(artifact.storage_path) ?? null : null),
              storagePath: artifact.storage_path,
            })),
          };
        })
      );

      return {
        id: run.id,
        scope: run.scope,
        requestedCriterionId: run.requested_criterion_id,
        attemptNumber: run.attempt_number,
        status: run.status,
        queuedAt: run.queued_at,
        startedAt: run.started_at,
        completedAt: run.completed_at,
        previewUrl: run.preview_url,
        errorSummary,
        results,
      };
    })
  );

  return {
    id: submission.id,
    attemptNumber: submission.attempt_number,
    pullRequestNumber: submission.pull_request_number,
    pullRequestTitle: submission.pull_request_title,
    pullRequestUrl: submission.pull_request_url,
    headBranch: submission.head_branch,
    headCommitSha: submission.head_commit_sha,
    implementationNote,
    submittedAt: submission.submitted_at,
    claimedCriterionIds: claims.map((claim) => claim.criterion_id),
    runs: mappedRuns,
  };
}

function groupBy<T extends Record<string, unknown>>(
  rows: T[],
  key: keyof T,
): Map<string, T[]> {
  const result = new Map<string, T[]>();
  for (const row of rows) {
    const value = String(row[key]);
    const group = result.get(value) ?? [];
    group.push(row);
    result.set(value, group);
  }
  return result;
}
