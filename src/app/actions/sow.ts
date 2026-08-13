"use server";

import type { SaveSowVersionInput, SaveSowVersionOutput, BackendResult } from "@/lib/backend";
import { saveSowDraft, submitSowForReview } from "@/lib/backend";

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
