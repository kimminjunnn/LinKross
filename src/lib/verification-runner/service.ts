import "server-only";

import { createHash, randomUUID } from "node:crypto";

import type { VerificationRunStatus } from "@/lib/backend/contracts";
import { isUuid } from "@/lib/backend/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { downloadGitHubRepositoryArchive } from "@/lib/github/app";
import {
  ACTIVE_RUN_STATUSES,
  type CompleteVerificationRunInput,
  type VerificationCriterionResultInput,
  type VerificationJobLease,
  type VerificationJobManifest,
  type VerificationSourceBundle,
} from "@/lib/verification-runner/contracts";
import { createLeaseToken, hashLeaseToken } from "@/lib/verification-runner/auth";
import { RunnerHttpError } from "@/lib/verification-runner/http";
import { resolveMvpVerificationDefinition } from "@/lib/verification-test-spec";

const LEASE_SECONDS = 300;
const TRANSITION_TARGETS = [
  "installing",
  "building",
  "running",
  "failed",
  "timed_out",
  "cancelled",
] as const satisfies readonly VerificationRunStatus[];

interface ClaimedRunRow {
  id: string;
  project_id: string;
  milestone_id: string;
  submission_id: string;
  scope: "criterion" | "milestone";
  requested_criterion_id: string | null;
  attempt_number: number;
  status: "provisioning";
  lease_expires_at: string;
}

export async function claimVerificationJob(
  workerId: string,
): Promise<{ manifest: VerificationJobManifest; lease: VerificationJobLease } | null> {
  const supabase = createSupabaseAdminClient();
  const leaseToken = createLeaseToken();
  const { data, error } = await supabase.rpc("claim_verification_run", {
    p_worker_id: workerId,
    p_lease_token_hash: hashLeaseToken(leaseToken),
    p_lease_seconds: LEASE_SECONDS,
  });
  if (error) throw databaseBoundaryError(error.message);

  const run = firstRow<ClaimedRunRow>(data);
  if (!run) return null;

  const [{ data: submission, error: submissionError }, { data: milestone, error: milestoneError }] =
    await Promise.all([
      supabase
        .from("milestone_submissions")
        .select("id, repository_id, attempt_number, pull_request_number, pull_request_url, head_branch, head_commit_sha")
        .eq("id", run.submission_id)
        .single(),
      supabase
        .from("milestones")
        .select("id, code, title")
        .eq("id", run.milestone_id)
        .single(),
    ]);
  if (submissionError || milestoneError || !submission || !milestone) {
    throw new RunnerHttpError(500, "Claimed verification job is incomplete.");
  }

  const [{ data: repository, error: repositoryError }, { data: claims, error: claimsError }] =
    await Promise.all([
      supabase
        .from("project_repositories")
        .select("id, provider, owner_name, repository_name, repository_url, default_branch, is_private")
        .eq("id", submission.repository_id)
        .single(),
      supabase
        .from("milestone_submission_criteria")
        .select("criterion_id")
        .eq("submission_id", run.submission_id),
    ]);
  if (repositoryError || claimsError || !repository) {
    throw new RunnerHttpError(500, "Claimed verification job context is incomplete.");
  }

  const claimedIds = (claims ?? []).map((claim) => claim.criterion_id);
  const criterionIds = run.scope === "criterion"
    ? claimedIds.filter((id) => id === run.requested_criterion_id)
    : claimedIds;
  if (criterionIds.length === 0) {
    throw new RunnerHttpError(500, "Claimed verification job has no completion criteria.");
  }

  const { data: criteria, error: criteriaError } = await supabase
    .from("completion_criteria")
    .select("id, description, verification_method, is_required, position, test_spec")
    .eq("milestone_id", run.milestone_id)
    .in("id", criterionIds)
    .order("position", { ascending: true });
  if (criteriaError || !criteria || criteria.length !== criterionIds.length) {
    throw new RunnerHttpError(500, "Claimed verification criteria are incomplete.");
  }

  return {
    lease: { workerId, token: leaseToken },
    manifest: {
      run: {
        id: run.id,
        attemptNumber: run.attempt_number,
        scope: run.scope,
        status: "provisioning",
        leaseExpiresAt: run.lease_expires_at,
      },
      project: { id: run.project_id },
      milestone: { id: milestone.id, code: milestone.code, title: milestone.title },
      submission: {
        id: submission.id,
        attemptNumber: submission.attempt_number,
        pullRequestNumber: submission.pull_request_number,
        pullRequestUrl: submission.pull_request_url,
        headBranch: submission.head_branch,
        commitSha: submission.head_commit_sha,
      },
      repository: {
        id: repository.id,
        provider: "github",
        owner: repository.owner_name,
        name: repository.repository_name,
        url: repository.repository_url,
        defaultBranch: repository.default_branch,
        isPrivate: repository.is_private,
      },
      criteria: criteria.map((criterion) => {
        const verification = resolveMvpVerificationDefinition({
          description: criterion.description,
          verificationMethod: criterion.verification_method,
          testSpec: criterion.test_spec,
        });
        return {
          id: criterion.id,
          description: criterion.description,
          verificationMethod: verification.verificationMethod,
          testSpec: verification.testSpec,
          required: criterion.is_required,
          position: criterion.position,
        };
      }),
    },
  };
}

export async function heartbeatVerificationJob(
  runId: string,
  lease: VerificationJobLease,
): Promise<{ leaseExpiresAt: string }> {
  assertRunId(runId);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("heartbeat_verification_run", {
    p_run_id: runId,
    p_worker_id: lease.workerId,
    p_lease_token_hash: hashLeaseToken(lease.token),
    p_lease_seconds: LEASE_SECONDS,
  });
  if (error) throw databaseBoundaryError(error.message);
  const row = firstRow<{ lease_expires_at: string }>(data);
  if (!row) throw new RunnerHttpError(409, "Verification lease is no longer active.");
  return { leaseExpiresAt: row.lease_expires_at };
}

export async function downloadVerificationSourceBundle(
  manifest: VerificationJobManifest,
  lease: VerificationJobLease,
): Promise<VerificationSourceBundle> {
  await heartbeatVerificationJob(manifest.run.id, lease);
  const supabase = createSupabaseAdminClient();
  const { data: run, error: runError } = await supabase
    .from("verification_runs")
    .select("id, submission_id, project_id, milestone_id, status")
    .eq("id", manifest.run.id)
    .single();
  if (
    runError ||
    !run ||
    run.submission_id !== manifest.submission.id ||
    run.project_id !== manifest.project.id ||
    run.milestone_id !== manifest.milestone.id ||
    !ACTIVE_RUN_STATUSES.includes(run.status as never)
  ) {
    throw new RunnerHttpError(409, "Verification source no longer matches the claimed run.");
  }

  const { data: submission, error: submissionError } = await supabase
    .from("milestone_submissions")
    .select("id, repository_id, head_commit_sha")
    .eq("id", run.submission_id)
    .single();
  if (
    submissionError ||
    !submission ||
    submission.repository_id !== manifest.repository.id ||
    submission.head_commit_sha !== manifest.submission.commitSha
  ) {
    throw new RunnerHttpError(409, "Verification submission changed after the run was claimed.");
  }

  const { data: repository, error: repositoryError } = await supabase
    .from("project_repositories")
    .select("id, owner_name, repository_name, github_repository_id, github_installation_id")
    .eq("id", submission.repository_id)
    .single();
  if (
    repositoryError ||
    !repository ||
    !repository.github_repository_id ||
    !repository.github_installation_id ||
    repository.owner_name !== manifest.repository.owner ||
    repository.repository_name !== manifest.repository.name
  ) {
    throw new RunnerHttpError(409, "GitHub repository installation no longer matches the claimed run.");
  }

  const bundle = await downloadGitHubRepositoryArchive({
    installationId: repository.github_installation_id,
    repositoryId: repository.github_repository_id,
    owner: repository.owner_name,
    repository: repository.repository_name,
    commitSha: submission.head_commit_sha,
  });
  return { ...bundle, commitSha: submission.head_commit_sha };
}

export async function uploadVerificationLog(input: {
  projectId: string;
  runId: string;
  content: string;
}): Promise<{ storagePath: string; sha256: string; sizeBytes: number }> {
  return uploadVerificationArtifact({
    projectId: input.projectId,
    runId: input.runId,
    content: Buffer.from(input.content, "utf8"),
    fileName: `runner-${randomUUID()}.log`,
    contentType: "text/plain; charset=utf-8",
  });
}

export async function uploadVerificationArtifact(input: {
  projectId: string;
  runId: string;
  content: Uint8Array;
  fileName: string;
  contentType: "image/png" | "application/zip" | "text/plain; charset=utf-8";
}): Promise<{ storagePath: string; sha256: string; sizeBytes: number }> {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,199}$/.test(input.fileName)) {
    throw new RunnerHttpError(400, "Verification evidence file name is invalid.");
  }
  const content = Buffer.from(input.content);
  if (content.byteLength > 100 * 1024 * 1024) {
    throw new RunnerHttpError(413, "Verification evidence exceeds the storage limit.");
  }
  const storagePath = `${input.projectId}/${input.runId}/${input.fileName}`;
  const sha256 = createHash("sha256").update(content).digest("hex");
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage
    .from("linkross-evidence")
    .upload(storagePath, content, {
      cacheControl: "3600",
      contentType: input.contentType,
      upsert: false,
    });
  if (error) throw new RunnerHttpError(503, "Verification evidence storage is unavailable.");
  return { storagePath, sha256, sizeBytes: content.byteLength };
}

export async function transitionVerificationJob(
  runId: string,
  lease: VerificationJobLease,
  input: unknown,
): Promise<{ status: VerificationRunStatus; leaseExpiresAt: string | null }> {
  assertRunId(runId);
  const transition = parseTransition(input);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("transition_verification_run", {
    p_run_id: runId,
    p_worker_id: lease.workerId,
    p_lease_token_hash: hashLeaseToken(lease.token),
    p_expected_status: transition.expectedStatus,
    p_next_status: transition.nextStatus,
    p_environment_provider: transition.environmentProvider,
    p_environment_reference: transition.environmentReference,
    p_error_summary: transition.errorSummary,
    p_lease_seconds: LEASE_SECONDS,
  });
  if (error) throw databaseBoundaryError(error.message);
  const row = firstRow<{ status: VerificationRunStatus; lease_expires_at: string | null }>(data);
  if (!row) throw new RunnerHttpError(409, "Verification transition was not applied.");
  return { status: row.status, leaseExpiresAt: row.lease_expires_at };
}

export async function completeVerificationJob(
  runId: string,
  lease: VerificationJobLease,
  input: unknown,
): Promise<{ status: VerificationRunStatus; completedAt: string }> {
  assertRunId(runId);
  const completion = parseCompletion(input);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("complete_verification_run", {
    p_run_id: runId,
    p_worker_id: lease.workerId,
    p_lease_token_hash: hashLeaseToken(lease.token),
    p_status: completion.status,
    p_results: completion.results,
    p_preview_url: completion.previewUrl ?? null,
    p_error_summary: completion.errorSummary ?? null,
    p_duration_ms: completion.durationMs ?? null,
  });
  if (error) throw databaseBoundaryError(error.message);
  const row = firstRow<{ status: VerificationRunStatus; completed_at: string }>(data);
  if (!row) throw new RunnerHttpError(409, "Verification completion was not applied.");
  return { status: row.status, completedAt: row.completed_at };
}

function parseTransition(input: unknown) {
  if (!isRecord(input)) throw new RunnerHttpError(400, "Invalid transition payload.");
  const expectedStatus = input.expectedStatus;
  const nextStatus = input.nextStatus;
  if (!ACTIVE_RUN_STATUSES.includes(expectedStatus as never)) {
    throw new RunnerHttpError(400, "Invalid expected verification status.");
  }
  if (!TRANSITION_TARGETS.includes(nextStatus as never)) {
    throw new RunnerHttpError(400, "Invalid next verification status.");
  }
  return {
    expectedStatus: expectedStatus as VerificationRunStatus,
    nextStatus: nextStatus as VerificationRunStatus,
    environmentProvider: optionalText(input.environmentProvider, 100),
    environmentReference: optionalText(input.environmentReference, 500),
    errorSummary: optionalText(input.errorSummary, 4_000),
  };
}

function parseCompletion(input: unknown): CompleteVerificationRunInput {
  if (!isRecord(input) || !["passed", "failed", "needs_review"].includes(String(input.status))) {
    throw new RunnerHttpError(400, "Invalid completion payload.");
  }
  if (!Array.isArray(input.results) || input.results.length === 0 || input.results.length > 50) {
    throw new RunnerHttpError(400, "Completion results must contain 1 to 50 criteria.");
  }
  const results = input.results.map(parseCriterionResult);
  const criterionIds = new Set(results.map((result) => result.criterionId));
  if (criterionIds.size !== results.length) {
    throw new RunnerHttpError(400, "Criterion results must be unique.");
  }

  const status = input.status as CompleteVerificationRunInput["status"];
  if (status === "passed" && results.some((result) => result.status !== "passed")) {
    throw new RunnerHttpError(400, "A passed run requires every criterion to pass.");
  }
  if (status === "failed" && !results.some((result) => result.status === "failed")) {
    throw new RunnerHttpError(400, "A failed run requires at least one failed criterion.");
  }
  if (
    status === "needs_review" &&
    (!results.some((result) => result.status === "needs_review") ||
      results.some((result) => result.status === "failed"))
  ) {
    throw new RunnerHttpError(400, "A review run requires review results and cannot contain a failure.");
  }

  return {
    status,
    results,
    previewUrl: optionalHttpsUrl(input.previewUrl),
    errorSummary: optionalText(input.errorSummary, 4_000),
    durationMs: optionalNonNegativeInteger(input.durationMs),
  };
}

function parseCriterionResult(value: unknown): VerificationCriterionResultInput {
  if (!isRecord(value) || typeof value.criterionId !== "string" || !isUuid(value.criterionId)) {
    throw new RunnerHttpError(400, "Invalid criterion result.");
  }
  if (!["passed", "failed", "needs_review", "not_run"].includes(String(value.status))) {
    throw new RunnerHttpError(400, "Invalid criterion result status.");
  }
  if (!Array.isArray(value.evidence) || value.evidence.length > 20) {
    throw new RunnerHttpError(400, "Each criterion may include up to 20 evidence records.");
  }
  return {
    criterionId: value.criterionId,
    status: value.status as VerificationCriterionResultInput["status"],
    observedResult: optionalText(value.observedResult, 8_000),
    errorMessage: optionalText(value.errorMessage, 8_000),
    durationMs: optionalNonNegativeInteger(value.durationMs),
    evidence: value.evidence.map((artifact) => {
      if (!isRecord(artifact) || !["screenshot", "video", "trace", "log", "preview", "document"].includes(String(artifact.type))) {
        throw new RunnerHttpError(400, "Invalid evidence artifact.");
      }
      const storagePath = optionalStoragePath(artifact.storagePath);
      const externalUrl = optionalHttpsUrl(artifact.externalUrl);
      if (!storagePath && !externalUrl) {
        throw new RunnerHttpError(400, "Evidence requires a storage path or HTTPS URL.");
      }
      const sha256 = optionalText(artifact.sha256, 64);
      if (sha256 && !/^[0-9a-f]{64}$/i.test(sha256)) {
        throw new RunnerHttpError(400, "Evidence SHA-256 is invalid.");
      }
      return {
        type: artifact.type as VerificationCriterionResultInput["evidence"][number]["type"],
        storagePath,
        externalUrl,
        mimeType: optionalText(artifact.mimeType, 200),
        sizeBytes: optionalNonNegativeInteger(artifact.sizeBytes),
        sha256,
        isRedacted: artifact.isRedacted === true,
      };
    }),
  };
}

function assertRunId(runId: string) {
  if (!isUuid(runId)) throw new RunnerHttpError(400, "Invalid verification run ID.");
}

function databaseBoundaryError(message: string): RunnerHttpError {
  if (message.includes("RUN_NOT_FOUND")) return new RunnerHttpError(404, "Verification run not found.");
  if (message.includes("LEASE_INVALID") || message.includes("LEASE_EXPIRED")) {
    return new RunnerHttpError(409, "Verification lease is invalid or expired.");
  }
  if (message.includes("INVALID_TRANSITION") || message.includes("RESULT_")) {
    return new RunnerHttpError(409, "Verification state or results conflict with the active run.");
  }
  return new RunnerHttpError(503, "Verification database boundary is unavailable.");
}

function firstRow<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return value && typeof value === "object" ? value as T : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalText(value: unknown, maxLength: number): string | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value !== "string" || value.length > maxLength) {
    throw new RunnerHttpError(400, "Text field is invalid or too long.");
  }
  return value;
}

function optionalNonNegativeInteger(value: unknown): number | undefined {
  if (value == null) return undefined;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new RunnerHttpError(400, "Numeric field must be a non-negative integer.");
  }
  return value;
}

function optionalHttpsUrl(value: unknown): string | undefined {
  const text = optionalText(value, 2_000);
  if (!text) return undefined;
  try {
    if (new URL(text).protocol !== "https:") throw new Error("HTTPS required");
  } catch {
    throw new RunnerHttpError(400, "External URLs must use HTTPS.");
  }
  return text;
}

function optionalStoragePath(value: unknown): string | undefined {
  const path = optionalText(value, 500);
  if (!path) return undefined;
  if (!/^[A-Za-z0-9][A-Za-z0-9/_.-]*$/.test(path) || path.includes("..")) {
    throw new RunnerHttpError(400, "Evidence storage path is invalid.");
  }
  return path;
}
