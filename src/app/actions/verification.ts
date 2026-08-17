"use server";

import { revalidatePath } from "next/cache";

import type {
  BackendResult,
  ConnectRepositoryInput,
  DecideMilestoneInput,
  RequestVerificationInput,
  SubmitMilestonePullRequestInput,
} from "@/lib/backend";
import {
  connectProjectRepository,
  decideMilestone,
  requestVerificationRun,
  submitMilestonePullRequest,
} from "@/lib/backend";

function revalidateVerification(projectId: string) {
  revalidatePath(`/company/projects/${projectId}/verification`);
  revalidatePath(`/freelancer/projects/${projectId}`);
}

export async function connectProjectRepositoryAction(
  input: ConnectRepositoryInput,
): Promise<BackendResult<{ repositoryUrl: string }>> {
  const result = await connectProjectRepository(input);
  if (!result.ok) return result;
  revalidateVerification(input.projectId);
  return { ok: true, data: { repositoryUrl: result.data.url } };
}

export async function submitMilestonePullRequestAction(
  input: SubmitMilestonePullRequestInput,
): Promise<BackendResult<{ submissionId: string; headCommitSha: string }>> {
  const result = await submitMilestonePullRequest(input);
  if (result.ok) revalidateVerification(input.projectId);
  return result;
}

export async function requestVerificationRunAction(
  input: RequestVerificationInput,
): Promise<BackendResult<{ runId: string; status: string }>> {
  const result = await requestVerificationRun(input);
  if (result.ok) revalidateVerification(input.projectId);
  return result;
}

export async function decideMilestoneAction(
  input: DecideMilestoneInput,
): Promise<BackendResult<{ decisionId: string }>> {
  const result = await decideMilestone(input);
  if (result.ok) revalidateVerification(input.projectId);
  return result;
}
