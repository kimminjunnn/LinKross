/**
 * 영문 SOW 초안 프롬프트의 단일 정의.
 *
 * `src/lib/sow-prompt.ts`와 같은 이유로 여기 한 곳에 둔다. 프리셋에 얼려 넣을
 * 영문 초안은 `eval/presets/build-preset-english.mjs`가 만드는데, 그 생성기와
 * 실제 화면(`src/app/actions/analyze.ts`)이 다른 프롬프트를 쓰면 프리셋이
 * 보증하는 결과와 LLM 경로의 결과가 서로 다른 물건이 된다.
 */

import type { MilestoneInput } from "@/lib/rag-translator";

export const ENGLISH_SOW_SYSTEM_MESSAGE =
  "You draft plain-English software Statements of Work. Stay grounded in the supplied Korean source. Never invent escrow, automatic payment, legal conclusions, security guarantees, or automatic acceptance. Use TBD for missing terms. Acceptance criteria must be observable, and human approval remains explicit." as const;

/** LLM이 채우는 부분. 기간·금액·프로젝트명처럼 실행 시점에 정해지는 값은 여기 없다. */
export interface EnglishSowDraft {
  background: string;
  objective: string;
  inScope: string[];
  outOfScope: string[];
  translatedMilestones: Array<{ titleEn: string; dodsEn: string[] }>;
  acceptanceCriteria: string[];
  definitionOfDone: string[];
  clientResponsibilities: string;
  vendorResponsibilities: string;
  unmappedContent: string[];
}

export const ENGLISH_SOW_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    background: { type: "string" },
    objective: { type: "string" },
    inScope: { type: "array", items: { type: "string" } },
    outOfScope: { type: "array", items: { type: "string" } },
    translatedMilestones: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { titleEn: { type: "string" }, dodsEn: { type: "array", items: { type: "string" } } },
        required: ["titleEn", "dodsEn"],
      },
    },
    acceptanceCriteria: { type: "array", items: { type: "string" } },
    definitionOfDone: { type: "array", items: { type: "string" } },
    clientResponsibilities: { type: "string" },
    vendorResponsibilities: { type: "string" },
    unmappedContent: { type: "array", items: { type: "string" } },
  },
  required: [
    "background",
    "objective",
    "inScope",
    "outOfScope",
    "translatedMilestones",
    "acceptanceCriteria",
    "definitionOfDone",
    "clientResponsibilities",
    "vendorResponsibilities",
    "unmappedContent",
  ],
} as const;

export interface EnglishSowPromptInput {
  workDetail: string;
  startDate: string;
  endDate: string;
  milestones: Pick<MilestoneInput, "title" | "dods">[];
  glossary: Array<{ kr: string; en: string }>;
}

export function buildEnglishSowPrompt(input: EnglishSowPromptInput): string {
  return JSON.stringify({
    source: input.workDetail,
    period: { start: input.startDate, end: input.endDate },
    milestones: input.milestones.map(({ title, dods }) => ({ title, completionConditions: dods })),
    glossary: input.glossary,
  });
}
