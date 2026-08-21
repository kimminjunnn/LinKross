import "server-only";

import OpenAI from "openai";

import type {
  DodClarificationRequirement,
  DodTestContract,
  DodTestScenario,
} from "@/lib/backend/contracts";
import {
  DOD_TEST_CONTRACT_VERSION,
  extractContractPath,
  normalizeContractRequirements,
} from "@/lib/dod-test-contract";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_ANALYSIS_BATCH = 100;

/**
 * 한 번의 LLM 호출에 담는 완료조건 수.
 *
 * 예전에는 요청 전체를 한 호출에 담고, 응답 개수가 맞지 않으면 배치 전체를
 * 실패시켰다. 그래서 출력 한도에 걸린 응답 하나로 완료조건 수십 개가 한꺼번에
 * 분석을 잃었다. 실측에서 같은 입력을 세 번 돌렸을 때 한 회차만 40개 중 20개를
 * 통째로 잃어 자동화율이 92.5%에서 47.5%로 떨어졌다. 조합 단계가 이미 쓰고 있는
 * 방식(작게 나눠 담고, 잘리면 절반으로 다시 시도)을 여기에도 적용한다.
 */
const ANALYSIS_CHUNK_SIZE = 12;

export const TEST_SCENARIOS: DodTestScenario[] = [
  "navigation",
  "form_submission",
  "validation_error",
  "state_change",
  "state_persistence",
  "duplicate_prevention",
  "list_filter",
  "empty_state",
  "error_recovery",
  "access_control",
  "generic_ui",
];

export interface DodContractAnalysisItem {
  milestoneTitle: string;
  dod: string;
}

export interface DodContractAnalysis {
  /** 원문 범위 안에서 다듬은 DoD 문장. */
  revisedDod: string;
  /** 원문만으로 확정한 검수 계약. 확정할 수 없는 필드는 비어 있다. */
  testContract: DodTestContract;
  /** 계약의 빈 필수 필드에 1:1 대응하는 질문. 이후 새 질문을 만들지 않는다. */
  requirements: DodClarificationRequirement[];
}

type RawAnalysis = {
  itemIndex: number;
  revisedDod: string;
  testContract: Record<string, string> & { scenario: DodTestScenario };
  requirements: DodClarificationRequirement[];
};

/**
 * 각 DoD를 읽어 Playwright 검수 계약으로 옮기고, 원문만으로 확정할 수 없는
 * 필드에 대한 질문 세트를 "한 번에" 만든다.
 *
 * 질문은 이 호출에서만 생성된다. 이후 저장·재저장 과정에서 새 질문을 만들지
 * 않으므로 사용자는 DoD마다 한 번의 질문·답변만 거친다.
 */
export async function analyzeDodContracts(
  items: DodContractAnalysisItem[],
): Promise<DodContractAnalysis[]> {
  if (items.length === 0) return [];
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
  }
  if (items.length > MAX_ANALYSIS_BATCH) {
    throw new Error(`한 번에 분석할 완료조건은 ${MAX_ANALYSIS_BATCH}개 이하여야 합니다.`);
  }

  const results: DodContractAnalysis[] = [];
  for (let index = 0; index < items.length; index += ANALYSIS_CHUNK_SIZE) {
    results.push(...(await analyzeChunk(items.slice(index, index + ANALYSIS_CHUNK_SIZE))));
  }
  return results;
}

/**
 * 한 묶음을 분석한다. 응답이 잘려 개수가 맞지 않으면 절반으로 나눠 다시 시도해,
 * 완료조건 하나 때문에 같은 호출에 실린 나머지까지 분석을 잃지 않게 한다.
 */
async function analyzeChunk(items: DodContractAnalysisItem[]): Promise<DodContractAnalysis[]> {
  if (items.length === 0) return [];

  let parsed: { items: RawAnalysis[] } | null;
  try {
    const completion = await openai.chat.completions.parse({
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      messages: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content: JSON.stringify({
            items: items.map((item, itemIndex) => ({
              itemIndex,
              milestoneTitle: item.milestoneTitle,
              dod: item.dod,
            })),
          }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "dod_verification_analysis", strict: true, schema: buildSchema() },
      },
      temperature: 0.1,
    });
    parsed = completion.choices[0].message.parsed as { items: RawAnalysis[] } | null;
  } catch (error) {
    // 인증·과금·네트워크 실패는 나눠도 똑같이 실패한다. 여기서 끝낸다.
    console.error("[dod-contract-analyzer] 분석 호출 실패", error);
    throw error;
  }

  if (!parsed || !Array.isArray(parsed.items) || parsed.items.length !== items.length) {
    if (items.length <= 1) {
      throw new Error("AI가 완료조건 분석 결과를 정확히 반환하지 못했습니다.");
    }
    const middle = Math.ceil(items.length / 2);
    return [
      ...(await analyzeChunk(items.slice(0, middle))),
      ...(await analyzeChunk(items.slice(middle))),
    ];
  }

  const byIndex = new Map(parsed.items.map((analysis) => [analysis.itemIndex, analysis]));
  return items.map((item, itemIndex) => {
    const analysis = byIndex.get(itemIndex);
    if (!analysis) throw new Error("일부 완료조건의 분석 결과가 누락되었습니다.");
    const testContract = normalizeTestContract(analysis.testContract);
    return {
      revisedDod: analysis.revisedDod?.trim() || item.dod,
      testContract,
      requirements: normalizeContractRequirements(testContract, analysis.requirements ?? []),
    };
  });
}

export function normalizeTestContract(raw: Record<string, string> & { scenario: DodTestScenario }): DodTestContract {
  const read = (field: string): string | undefined => {
    const value = raw[field];
    return typeof value === "string" ? value.trim().slice(0, 1000) || undefined : undefined;
  };
  const startPath = read("startPath");
  return {
    version: DOD_TEST_CONTRACT_VERSION,
    scenario: TEST_SCENARIOS.includes(raw.scenario) ? raw.scenario : "generic_ui",
    ...(startPath ? { startPath: extractContractPath(startPath) ?? startPath } : {}),
    ...(read("precondition") ? { precondition: read("precondition") } : {}),
    ...(read("fixture") ? { fixture: read("fixture") } : {}),
    ...(read("action") ? { action: read("action") } : {}),
    ...(read("target") ? { target: read("target") } : {}),
    ...(read("input") ? { input: read("input") } : {}),
    ...(read("expected") ? { expected: read("expected") } : {}),
    ...(read("cleanup") ? { cleanup: read("cleanup") } : {}),
  };
}

function buildSystemPrompt(): string {
  return [
    "당신은 비개발 발주자와 함께 완료조건(DoD)을 자동 검수 가능한 문장으로 구체화하는 QA 설계 도우미입니다.",
    "목표는 문장이 그럴듯해 보이는지가 아니라, 실제 Playwright 자동 테스트 한 개를 반복 실행할 수 있는지입니다.",
    "각 DoD를 독립적으로 읽고 testContract 구조로 옮기세요: 정확한 시작 URL, 테스트 시작 전 필요한 로그인·화면 상태, 반복 가능한 테스트 데이터 준비 방법, 사용자의 한 가지 행동, 행동 대상의 화면상 이름, 입력값, 관찰 가능한 기대 결과, 정리 방법.",
    "원문에서 확정할 수 없는 값은 절대 추측하지 말고 빈 문자열로 두세요. 추측한 값은 잘못된 자동 판정으로 이어집니다.",
    "",
    "[precondition은 상태이지 행동이 아닙니다]",
    "precondition에는 테스트가 시작되는 순간의 상태만 적으세요. 로그인 여부와 화면 상태가 여기에 해당합니다.",
    "테스트가 수행할 조작(입력, 클릭, 제출)은 precondition이 아니라 action에 적습니다. 행동을 precondition에 넣으면 테스트가 필요한 시작 상태를 만들지 못합니다.",
    "좋은 예: \"테스트 계정으로 로그인한 상태\", \"로그아웃 상태\", \"할 일이 하나도 없는 상태\"",
    "나쁜 예: \"할 일 입력란에 텍스트 입력\"(행동), \"저장 버튼 클릭\"(행동)",
    "로그인이 필요한 화면인지 완료조건만으로 알 수 없다면 추측하지 말고 빈 문자열로 두어 질문이 생기게 하세요. 발주자는 화면을 보고 바로 답할 수 있습니다.",
    "",
    "질문은 이번 한 번만 만들 수 있습니다. 이후 단계에서는 새 질문을 만들 수 없습니다.",
    "따라서 비어 있는 필수 계약 필드 전부에 대한 질문을 requirements에 누락 없이 한 번에 담으세요.",
    "requirements.key는 반드시 startPath, precondition, fixture, action, target, input, expected, cleanup 중 해당 필드명을 그대로 사용하세요. 사용자의 답변이 그 필드에 그대로 들어갑니다.",
    "따라서 질문은 그 필드 하나만 묻고, 답변이 곧 그 필드의 값이 되도록 작성하세요. 여러 필드를 한 질문에 섞지 마세요.",
    "각 질문에는 사용자가 바로 고를 수 있는 실행 가능한 선택지 2~3개와 recommendedSuggestion을 반드시 제공하세요.",
    "선택지는 그대로 필드 값으로 쓸 수 있는 형태여야 합니다(예: startPath 질문의 선택지는 `/login`처럼 경로 자체).",
    "test id, CSS selector, 함수명 같은 구현 세부사항은 묻지 마세요. 비개발자가 화면을 보고 답할 수 있는 것만 물으세요.",
    "",
    "revisedDod는 원문과 같은 범위만 사용하고 새 기능을 창작하지 마세요.",
    "원문에 없는 기능(비밀번호 재설정, 소셜 로그인, 수정·삭제 등)은 상식적으로 필요해 보여도 절대 추가하지 마세요.",
    "여러 상태나 결과를 한 문장에 합치지 말고, 문장 끝은 확인·표시·이동·차단·노출 같은 명사형으로 끝내세요.",
  ].join("\n");
}

function buildSchema(): Record<string, unknown> {
  const contractFields = [
    "startPath",
    "precondition",
    "fixture",
    "action",
    "target",
    "input",
    "expected",
    "cleanup",
  ];

  return {
    type: "object",
    additionalProperties: false,
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            itemIndex: { type: "integer" },
            revisedDod: { type: "string" },
            testContract: {
              type: "object",
              additionalProperties: false,
              properties: {
                scenario: { type: "string", enum: TEST_SCENARIOS },
                ...Object.fromEntries(
                  contractFields.map((field) => [field, { type: "string" } as Record<string, unknown>]),
                ),
              },
              required: ["scenario", ...contractFields],
            },
            requirements: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  key: { type: "string", enum: contractFields },
                  question: { type: "string" },
                  suggestions: { type: "array", minItems: 2, maxItems: 3, items: { type: "string" } },
                  recommendedSuggestion: { type: "string" },
                },
                required: ["key", "question", "suggestions", "recommendedSuggestion"],
              },
            },
          },
          required: ["itemIndex", "revisedDod", "testContract", "requirements"],
        },
      },
    },
    required: ["items"],
  };
}
