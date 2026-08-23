"use server";

import { GEMINI_KEY_MISSING_MESSAGE, generateJson, geminiModel, hasGeminiKey } from "@/lib/llm/gemini";
import {
  SOW_SUMMARY_SCHEMA,
  SOW_SUMMARY_SYSTEM_MESSAGE,
  buildSowSummaryPrompt,
  type SowSummaryResult,
} from "@/lib/sow-summary-prompt";
import { matchPresetSowSummary } from "@/lib/sow-presets";

export type { SowSummaryResult };
import type {
  ApproveSowInput,
  BackendResult,
  MarkSowRevisionRequestsReadInput,
  SaveSowVersionInput,
  SaveSowVersionOutput,
  SowApprovalState,
  RequestSowRevisionInput,
} from "@/lib/backend";
import {
  approveSowAsCompany,
  approveSowAsFreelancer,
  getSowApprovalState,
  markSowRevisionRequestsRead,
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
  return getSowApprovalState(projectId, undefined, "company");
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

export async function markSowRevisionRequestsReadAction(
  input: MarkSowRevisionRequestsReadInput,
): Promise<BackendResult<SowApprovalState>> {
  return markSowRevisionRequestsRead(input);
}

export async function generateSowSummaryAction(
  workDetailKo: string,
  englishSowBackground?: string,
  englishSowObjective?: string,
  acceptanceCriteria: string[] = [],
  definitionOfDone: string[] = []
): Promise<BackendResult<SowSummaryResult>> {
  // 시연용 프리셋에 확정해 둔 요약이 있으면 LLM을 부르지 않는다.
  const frozen = matchPresetSowSummary(workDetailKo);
  if (frozen) return { ok: true, data: frozen };

  if (!hasGeminiKey()) {
    return {
      ok: false,
      error: { code: "INVALID_INPUT", message: GEMINI_KEY_MISSING_MESSAGE }
    };
  }

  try {
    const { parsed } = await generateJson<SowSummaryResult>({
      model: geminiModel("light"),
      system: SOW_SUMMARY_SYSTEM_MESSAGE,
      user: buildSowSummaryPrompt({
        workDetailKo,
        englishSowBackground,
        englishSowObjective,
        acceptanceCriteria,
        definitionOfDone,
      }),
      schema: SOW_SUMMARY_SCHEMA,
      temperature: 0.2,
    });

    if (!parsed) {
      throw new Error("AI가 요약을 반환하지 못했습니다.");
    }

    return { ok: true, data: parsed };
  } catch (error: unknown) {
    console.error("AI SOW Summary Generation Error:", error);
    const message =
      error instanceof Error ? error.message : "AI 요약 생성 중 오류가 발생했습니다.";
    return {
      ok: false,
      error: { code: "DATABASE_ERROR", message }
    };
  }
}
