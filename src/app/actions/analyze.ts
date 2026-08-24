"use server";

import { GEMINI_KEY_MISSING_MESSAGE, generateJson, hasGeminiKey } from "@/lib/llm/gemini";

import { assertActionRole } from "@/lib/auth/workspace-access";
import type {
  DodClarificationRequirement,
  DodTestContract,
  DodVerificationDesign,
} from "@/lib/backend";
import { analyzeDodContracts } from "@/lib/dod-contract-analyzer";
import {
  applyAnswersToContract,
  contractToDodSentence,
  isCompleteTestContract,
  unansweredContractFieldLabels,
} from "@/lib/dod-test-contract";
import { conversationFromRequirements, unansweredRequirements } from "@/lib/dod-verification-state";
import { SOW_RESPONSE_SCHEMA, SOW_SYSTEM_MESSAGE, buildSowPrompt } from "@/lib/sow-prompt";
import { matchPresetEnglishSow, matchSowPreset, toPresetMilestoneInputs } from "@/lib/sow-presets";
import {
  ENGLISH_SOW_RESPONSE_SCHEMA,
  ENGLISH_SOW_SYSTEM_MESSAGE,
  buildEnglishSowPrompt,
  type EnglishSowDraft,
} from "@/lib/sow-english-prompt";
import type { EnglishSOWResult, MilestoneInput } from "@/lib/rag-translator";
import { retrieveGlossaryTerms } from "@/lib/rag-translator";

export type AIAnalysisResult = {
  milestones: MilestoneInput[];
  extractedStartDate?: string | null;
  extractedEndDate?: string | null;
  extractedBudget?: string | null;
  /** 프리셋으로 응답했을 때만 채워진다. 화면은 이 값을 보고 추가 분석을 건너뛴다. */
  presetId?: string;
};

export type DodVerificationAnalysisResult = {
  milestoneCode: string;
  dodIndex: number;
  revisedDod: string;
  design: DodVerificationDesign;
};

/**
 * 각 DoD의 검수 계약과 질문 세트를 한 번에 확정한다.
 *
 * 질문은 이 호출에서만 만들어지고 그대로 잠긴다(`questionSetLocked`). 이후
 * 저장·재저장에서 새 질문이 생기지 않으므로 사용자는 DoD마다 한 번의 질문·답변만
 * 거친다.
 */
export async function analyzeDodsForVerificationWithLLM(
  milestones: MilestoneInput[],
): Promise<DodVerificationAnalysisResult[]> {
  await assertActionRole("company");
  const flattened = milestones.flatMap((milestone) =>
    milestone.dods.map((dod, dodIndex) => ({
      milestoneCode: milestone.code,
      milestoneTitle: milestone.title,
      dodIndex,
      dod,
    })),
  );
  if (flattened.length === 0) return [];

  const analyses = await analyzeDodContracts(
    flattened.map((item) => ({ milestoneTitle: item.milestoneTitle, dod: item.dod })),
  );

  return flattened.map((item, index) => {
    const analysis = analyses[index];
    if (!analysis) throw new Error("일부 완료조건의 분석 결과가 누락되었습니다.");
    const { requirements, testContract } = analysis;
    const pending = unansweredRequirements(requirements);
    return {
      milestoneCode: item.milestoneCode,
      dodIndex: item.dodIndex,
      revisedDod: analysis.revisedDod || item.dod,
      design: {
        // 질문이 남아 있으면 답변을 받고, 없으면 저장 단계가 실행 스펙을 만들 때까지
        // 과도기 상태로 둔다. 실행 스펙이 없는 항목을 완료로 표시하지 않는다.
        status: pending.length > 0 ? "clarification_required" : "contract_ready",
        ...(testContract.startPath ? { startPath: testContract.startPath } : {}),
        ...(pending.length > 0
          ? {
              question: pending[0].question,
              ...(pending[0].suggestions ? { suggestions: pending[0].suggestions } : {}),
              ...(pending[0].recommendedSuggestion
                ? { recommendedSuggestion: pending[0].recommendedSuggestion }
                : {}),
            }
          : {}),
        conversation: conversationFromRequirements(requirements),
        requirements,
        testContract,
        questionSetLocked: true,
        humanReviewAccepted: false,
        message: pending.length > 0
          ? `자동 테스트를 만들기 위해 확인이 필요한 항목 ${pending.length}개를 한 번에 정리했습니다.`
          : "원문만으로 검수 계약을 확정했습니다. 실행 가능한 자동 테스트를 만드는 중입니다.",
      },
    };
  });
}

/**
 * 확정된 질문의 답변을 계약에 반영하고 최종 DoD 문장을 만든다.
 *
 * 계약 병합은 LLM 없이 결정적으로 수행한다. 문장 다듬기만 LLM에 맡기고,
 * 실패하면 계약에서 문장을 만들어 답변이 사라지지 않게 한다.
 */
export async function finalizeDodForVerificationWithLLM(input: {
  milestoneTitle: string;
  dod: string;
  requirements: DodClarificationRequirement[];
  testContract?: DodTestContract;
}): Promise<{ revisedDod: string; testContract: DodTestContract; isComplete: boolean; missingFields: string[] }> {
  await assertActionRole("company");
  if (!input.dod.trim()) {
    throw new Error("최종 DoD를 만들 원본 완료조건이 없습니다.");
  }
  if (unansweredRequirements(input.requirements).length > 0) {
    throw new Error("최종 DoD 생성에 필요한 답변이 모두 준비되지 않았습니다.");
  }

  const baseContract: DodTestContract = input.testContract
    ?? { version: 1, scenario: "generic_ui" };
  const testContract = applyAnswersToContract(baseContract, input.requirements);
  const fallbackSentence = contractToDodSentence(testContract, input.dod);

  let revisedDod = fallbackSentence;
  try {
    revisedDod = (await polishDodSentence({
      milestoneTitle: input.milestoneTitle,
      originalDod: input.dod,
      testContract,
      requirements: input.requirements,
    })) || fallbackSentence;
  } catch (error) {
    // 문장 다듬기는 보조 단계다. 실패해도 확정된 계약과 답변은 그대로 유지한다.
    console.error("[analyze] 최종 DoD 문장 다듬기 실패", error);
  }

  return {
    revisedDod,
    testContract,
    isComplete: isCompleteTestContract(testContract),
    missingFields: unansweredContractFieldLabels(testContract),
  };
}

async function polishDodSentence(input: {
  milestoneTitle: string;
  originalDod: string;
  testContract: DodTestContract;
  requirements: DodClarificationRequirement[];
}): Promise<string | null> {
  if (!hasGeminiKey()) return null;
  const { parsed } = await generateJson<{ revisedDod: string }>({
    system: [
          "당신은 Playwright 자동 테스트용 Definition of Done 문장을 최종 확정하는 QA 설계자입니다.",
          "확정된 검수 계약과 질의응답만 사용해 최종 DoD 한 문장을 작성하세요.",
          "새 질문을 만들거나 원문에 없는 기능을 추가하지 마세요.",
          "계약의 시작 URL, 한 가지 사용자 행동, 입력·사전 상태, 화면에서 관찰 가능한 결과를 문장에 담으세요.",
          "여러 독립 조건을 합치지 말고 문장 끝은 확인·표시·이동·차단·완료 같은 명사형으로 끝내세요.",
    ].join("\n"),
    user: JSON.stringify({
      milestoneTitle: input.milestoneTitle,
      originalDod: input.originalDod,
      testContract: input.testContract,
      answers: input.requirements.map(({ key, question, answer }) => ({ key, question, answer })),
    }),
    schema: {
      type: "object",
      additionalProperties: false,
      properties: { revisedDod: { type: "string" } },
      required: ["revisedDod"],
    },
    temperature: 0.1,
  });
  return parsed?.revisedDod?.trim() || null;
}

export async function analyzeWorkDetailWithLLM(
  workDetail: string,
  currentStartDate: string,
  currentEndDate: string
): Promise<AIAnalysisResult> {
  await assertActionRole("company");

  // 시연용 프리셋이 있으면 LLM을 부르지 않는다. 같은 원문에서 매번 다른 문장과
  // 다른 검수 계약이 나오면 시연이 재현되지 않고, 완료조건마다 붙는 질문·조합
  // 호출이 그대로 대기 시간이 된다. 프리셋은 실행 스펙까지 확정된 상태로 온다.
  const preset = matchSowPreset(workDetail);
  if (preset) {
    return {
      presetId: preset.preset.id,
      milestones: toPresetMilestoneInputs(preset.preset, {
        startDate: currentStartDate,
        endDate: currentEndDate,
        budget: workDetail.match(/^\s*예산\s*[:：]\s*([\d,]+)/m)?.[1],
      }),
    };
  }

  if (!hasGeminiKey()) {
    throw new Error(GEMINI_KEY_MISSING_MESSAGE);
  }

  const prompt = buildSowPrompt({ workDetail, startDate: currentStartDate, endDate: currentEndDate });

  try {
    const { parsed } = await generateJson<AIAnalysisResult>({
      system: SOW_SYSTEM_MESSAGE,
      user: prompt,
      schema: SOW_RESPONSE_SCHEMA,
      temperature: 0.2,
    });

    if (!parsed) {
      throw new Error("LLM Parsing failed");
    }

    return parsed;
  } catch (error: unknown) {
    console.error("LLM Analysis Error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "LLM 연동 분석 중 오류가 발생했습니다.",
    );
  }
}

export async function generateEnglishSowWithLLM(input: {
  projectTitle: string;
  assigneeName: string | null;
  workDetail: string;
  startDate: string;
  endDate: string;
  milestones: MilestoneInput[];
}): Promise<EnglishSOWResult> {
  await assertActionRole("company");
  if (!input.workDetail.trim() || input.milestones.length === 0) throw new Error("SOW 원문과 마일스톤이 필요합니다.");
  if (input.workDetail.length > 20_000 || input.milestones.length > 10) throw new Error("SOW 입력은 20,000자와 마일스톤 10개 이하여야 합니다.");

  // 용어집은 정규식 대조라 LLM이 필요 없다. 프리셋 경로에서도 그대로 계산한다.
  const retrievedTerms = retrieveGlossaryTerms(`${input.workDetail} ${input.milestones.flatMap((milestone) => [milestone.title, ...milestone.dods]).join(" ")}`);

  // 시연용 프리셋에 확정해 둔 영문 초안이 있으면 LLM을 부르지 않는다.
  // 마일스톤 구성과 완료조건 문장이 프리셋과 같을 때만 돌아온다.
  const frozen = matchPresetEnglishSow(input.workDetail, input.milestones);
  const draft: EnglishSowDraft | null = frozen ?? (await requestEnglishSowDraft(input, retrievedTerms));
  if (!draft || draft.translatedMilestones.length !== input.milestones.length) throw new Error("AI가 마일스톤 구조를 정확히 반환하지 못했습니다. 다시 시도해주세요.");

  return {
    version: "1.0",
    header: { projectName: input.projectTitle, client: "Client", vendor: input.assigneeName ?? "Selected freelancer", effectiveDate: `${input.startDate} ~ ${input.endDate}` },
    overview: { background: draft.background, objective: draft.objective },
    scopeOfWork: { inScope: draft.inScope, outOfScope: draft.outOfScope },
    timelineAndMilestones: input.milestones.map((milestone, index) => ({ code: milestone.code, titleEn: draft.translatedMilestones[index].titleEn, period: milestone.period, amount: milestone.amount, dodsEn: draft.translatedMilestones[index].dodsEn })),
    acceptanceCriteria: draft.acceptanceCriteria,
    definitionOfDone: draft.definitionOfDone,
    rolesAndResponsibilities: { client: draft.clientResponsibilities, vendor: draft.vendorResponsibilities },
    retrievedTerms,
    unmappedContent: draft.unmappedContent,
  };
}

/** 프리셋이 없을 때만 타는 경로. 프롬프트와 스키마는 프리셋 생성기와 공유한다. */
async function requestEnglishSowDraft(
  input: { workDetail: string; startDate: string; endDate: string; milestones: MilestoneInput[] },
  glossary: Array<{ kr: string; en: string }>,
): Promise<EnglishSowDraft | null> {
  if (!hasGeminiKey()) throw new Error(GEMINI_KEY_MISSING_MESSAGE);
  const { parsed } = await generateJson<EnglishSowDraft>({
    system: ENGLISH_SOW_SYSTEM_MESSAGE,
    user: buildEnglishSowPrompt({
      workDetail: input.workDetail,
      startDate: input.startDate,
      endDate: input.endDate,
      milestones: input.milestones,
      glossary,
    }),
    schema: ENGLISH_SOW_RESPONSE_SCHEMA,
    temperature: 0.1,
  });
  return parsed;
}
