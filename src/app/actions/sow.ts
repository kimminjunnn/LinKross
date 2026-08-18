"use server";

import type {
  ApproveSowInput,
  BackendResult,
  SaveSowVersionInput,
  SaveSowVersionOutput,
  SowApprovalState,
  RequestSowRevisionInput,
} from "@/lib/backend";
import {
  approveSowAsCompany,
  approveSowAsFreelancer,
  getSowApprovalState,
  saveSowDraft,
  requestSowRevision,
  submitSowForReview,
} from "@/lib/backend";

export async function saveSowDraftAction(
  input: SaveSowVersionInput,
): Promise<BackendResult<SaveSowVersionOutput>> {
  return saveSowDraft(input);
}

export async function submitSowForReviewAction(
  input: SaveSowVersionInput,
): Promise<BackendResult<SaveSowVersionOutput>> {
  return submitSowForReview(input);
}

export async function getSowApprovalStateAction(
  projectId: string,
): Promise<BackendResult<SowApprovalState | null>> {
  return getSowApprovalState(projectId);
}

export async function approveSowAsCompanyAction(
  input: ApproveSowInput,
): Promise<BackendResult<SowApprovalState>> {
  return approveSowAsCompany(input);
}

export async function approveSowAsFreelancerAction(
  input: ApproveSowInput,
): Promise<BackendResult<SowApprovalState>> {
  return approveSowAsFreelancer(input);
}

export async function requestSowRevisionAction(
  input: RequestSowRevisionInput,
): Promise<BackendResult<SowApprovalState>> {
  return requestSowRevision(input);
}
