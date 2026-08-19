"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import type {
  BackendResult,
  ConnectRepositoryInput,
  DecideMilestoneInput,
  MilestoneSubmissionReceipt,
  RequestVerificationInput,
  SubmitMilestonePullRequestInput,
} from "@/lib/backend";
import {
  connectProjectRepository,
  decideMilestone,
  requestVerificationRun,
  submitMilestonePullRequest,
} from "@/lib/backend";
import { executeNextVerificationInVercelSandbox } from "@/lib/verification-runner/vercel-sandbox";

function triggerImmediateVerification() {
  after(async () => {
    try {
      await executeNextVerificationInVercelSandbox(`server-action:${randomUUID()}`);
    } catch (error) {
      console.error("[verification] 즉시 검수 실행 트리거가 실패했습니다.", error);
    }
  });
}

function revalidateVerification(projectId: string) {
  revalidatePath(`/company/projects/${projectId}/verification`);
  revalidatePath(`/freelancer/projects/${projectId}`);
  revalidatePath(`/freelancer/projects/${projectId}/verification`);
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
): Promise<BackendResult<MilestoneSubmissionReceipt>> {
  const result = await submitMilestonePullRequest(input);
  if (result.ok) {
    revalidateVerification(input.projectId);
    if (result.data.verificationStatus === "queued") triggerImmediateVerification();
  }
  return result;
}

export async function requestVerificationRunAction(
  input: RequestVerificationInput,
): Promise<BackendResult<{ runId: string; status: string }>> {
  const result = await requestVerificationRun(input);
  if (result.ok) {
    revalidateVerification(input.projectId);
    if (result.data.status === "queued") triggerImmediateVerification();
  }
  return result;
}

export async function decideMilestoneAction(
  input: DecideMilestoneInput,
): Promise<BackendResult<{ decisionId: string }>> {
  const result = await decideMilestone(input);
  if (result.ok) revalidateVerification(input.projectId);
  return result;
}
