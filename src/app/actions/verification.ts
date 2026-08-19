"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

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

async function triggerImmediateVerification(): Promise<void> {
  // Vercel의 after()/waitUntil 백그라운드 실행은 이 배포에서 신뢰성 있게 발동하지
  // 않는 것이 실측으로 확인됐다(큐에만 쌓이고 아무도 claim하지 않는 사례 발생).
  // 응답을 늦추더라도 여기서 직접 기다려 확실히 실행되게 한다. 페이지의
  // maxDuration(300초)이 이 대기 시간을 감당한다.
  try {
    await executeNextVerificationInVercelSandbox(`server-action:${randomUUID()}`);
  } catch (error) {
    console.error("[verification] 즉시 검수 실행 트리거가 실패했습니다.", error);
  }
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
    if (result.data.verificationStatus === "queued") await triggerImmediateVerification();
    revalidateVerification(input.projectId);
  }
  return result;
}

export async function requestVerificationRunAction(
  input: RequestVerificationInput,
): Promise<BackendResult<{ runId: string; status: string }>> {
  const result = await requestVerificationRun(input);
  if (result.ok) {
    if (result.data.status === "queued") await triggerImmediateVerification();
    revalidateVerification(input.projectId);
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
