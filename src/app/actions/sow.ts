"use server";

import type {
  ApproveSowInput,
  BackendResult,
  SaveSowVersionInput,
  SaveSowVersionOutput,
  SowApprovalState,
} from "@/lib/backend";
import {
  approveSowAsCompany,
  getSowApprovalState,
  saveSowDraft,
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
