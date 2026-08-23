/**
 * SOW 요약 프롬프트의 단일 정의.
 *
 * 승인 화면이 부르는 요약과, 프리셋에 얼려 넣을 요약을 만드는 생성기
 * (`eval/presets/build-preset-english.mjs`)가 같은 프롬프트를 쓰게 한다.
 */

export type SowSummaryResult = {
  coreScope: string;
  keyAcceptance: string;
  needsReview: string;
  english?: {
    coreScope: string;
    keyAcceptance: string;
    needsReview: string;
  };
};

const SOW_SUMMARY_SENTENCE = { type: "string", description: "한 문장" } as const;

export const SOW_SUMMARY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    coreScope: SOW_SUMMARY_SENTENCE,
    keyAcceptance: SOW_SUMMARY_SENTENCE,
    needsReview: SOW_SUMMARY_SENTENCE,
    english: {
      type: "object",
      additionalProperties: false,
      properties: {
        coreScope: SOW_SUMMARY_SENTENCE,
        keyAcceptance: SOW_SUMMARY_SENTENCE,
        needsReview: SOW_SUMMARY_SENTENCE,
      },
      required: ["coreScope", "keyAcceptance", "needsReview"],
    },
  },
  required: ["coreScope", "keyAcceptance", "needsReview", "english"],
} as const;

export const SOW_SUMMARY_SYSTEM_MESSAGE = "You are an expert IT Project Manager and System Analyst." as const;

export interface SowSummaryPromptInput {
  workDetailKo: string;
  englishSowBackground?: string;
  englishSowObjective?: string;
  acceptanceCriteria: string[];
  definitionOfDone: string[];
}

export function buildSowSummaryPrompt(input: SowSummaryPromptInput): string {
  return `
당신은 프로젝트 관리(PM) 및 시스템 분석 전문가입니다.
제공된 업무명세서(SOW) 정보를 기반으로 발주자(PO)가 검토해야 할 핵심 사항들을 한국어로 1문장씩 요약해 주세요.

업무명세서(SOW) 정보:
- 한국어 업무 상세: ${input.workDetailKo || "없음"}
- 영어 배경/목적: Background: ${input.englishSowBackground || "없음"}, Objective: ${input.englishSowObjective || "없음"}
- 완료 조건(Acceptance Criteria): ${input.acceptanceCriteria.join(", ") || "없음"}
- 완료 정의(Definition of Done): ${input.definitionOfDone.join(", ") || "없음"}

출력은 반드시 다음 JSON 스키마를 준수해 주세요. coreScope/keyAcceptance/needsReview는 한국어로 작성하고, english 객체는 같은 의미를 영어로 번역해 작성해 주세요:
{
  "coreScope": "이 프로젝트의 핵심 개발 범위 및 목적 요약 (한국어 1문장, 예: '로드사이클 라이더의 FTP 측정 및 분석 알고리즘, 대시보드 구축')",
  "keyAcceptance": "가장 중요한 검수 기준 또는 핵심 완료 조건 요약 (한국어 1문장, 예: '이메일 로그인 기능 및 FTP 20분 테스트 결과를 통한 자동 계산 E2E 검수 통과')",
  "needsReview": "발주자가 특히 눈여겨보고 직접 확인해야 하는 부분 또는 주의점 요약 (한국어 1문장, 예: '로그인 시 /dashboard 이동 및 오류 메시지 예외 처리 동작 여부 확인')",
  "english": {
    "coreScope": "English translation of coreScope with the same meaning in 1 sentence",
    "keyAcceptance": "English translation of keyAcceptance with the same meaning in 1 sentence",
    "needsReview": "English translation of needsReview with the same meaning in 1 sentence"
  }
}
`;
}
