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
  cancelVerificationRun,
  connectProjectRepository,
  decideMilestone,
  requestVerificationRun,
  submitMilestonePullRequest,
} from "@/lib/backend";
import { executeNextVerificationInVercelSandbox } from "@/lib/verification-runner/vercel-sandbox";

// 클레임은 전역 FIFO(가장 오래 대기한 항목 하나)라서, 밀린 다른 실행이 있으면
// 방금 만든 요청이 아니라 그 오래된 것부터 처리되고 끝나버린다. 내 runId가
// 나올 때까지, 혹은 큐가 빌 때까지 반복해서 "재검수를 눌렀는데 아무 일도 안
// 일어난다"는 상황이 생기지 않게 한다. 페이지의 maxDuration(300초) 안에서
// 안전하게 끝나도록 반복 횟수에 상한을 둔다.
const MAX_CLAIM_ATTEMPTS = 8;

async function triggerImmediateVerification(targetRunId: string): Promise<void> {
  try {
    for (let attempt = 0; attempt < MAX_CLAIM_ATTEMPTS; attempt += 1) {
      const result = await executeNextVerificationInVercelSandbox(`server-action:${randomUUID()}`);
      if (!result.claimed) return; // 큐가 비었다 - 처리할 게 더 없다.
      if (result.runId === targetRunId) return; // 목표 실행을 처리했다.
      // 다른(밀린) 실행을 처리했다 - 내 것을 찾을 때까지 계속한다.
    }
    console.error(
      `[verification] ${MAX_CLAIM_ATTEMPTS}회 반복해도 목표 실행(${targetRunId})을 처리하지 못했습니다. 큐가 많이 밀려 있을 수 있습니다.`,
    );
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
    if (result.data.verificationStatus === "queued") {
      await triggerImmediateVerification(result.data.verificationRunId);
    }
    revalidateVerification(input.projectId);
  }
  return result;
}

export async function requestVerificationRunAction(
  input: RequestVerificationInput,
): Promise<BackendResult<{ runId: string; status: string; retriable: boolean }>> {
  const result = await requestVerificationRun(input);
  if (result.ok) {
    // 대기 중이거나, 진행 중으로 보이지만 조정기가 끊겨 멈춘 실행이면 다시 건다.
    // 멈춘 실행을 되살릴 수단이 없어 화면이 영원히 "검수 중"에 머무르던 문제를 막는다.
    if (result.data.retriable) await triggerImmediateVerification(result.data.runId);
    revalidateVerification(input.projectId);
  }
  return result;
}

export async function cancelVerificationRunAction(
  input: { projectId: string; runId: string },
): Promise<BackendResult<{ runId: string; status: string }>> {
  const result = await cancelVerificationRun(input);
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
