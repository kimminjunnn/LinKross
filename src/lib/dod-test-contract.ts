import type {
  DodClarificationRequirement,
  DodTestContract,
  DodTestScenario,
} from "@/lib/backend/contracts";

export const DOD_TEST_CONTRACT_VERSION = 1 as const;

const DOD_TEST_SCENARIOS: DodTestScenario[] = [
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

export type DodTestContractField =
  | "startPath"
  | "precondition"
  | "fixture"
  | "action"
  | "target"
  | "input"
  | "expected"
  | "cleanup";

const STATEFUL_SCENARIOS = new Set<DodTestScenario>([
  "state_persistence",
  "duplicate_prevention",
  "list_filter",
  "empty_state",
  "error_recovery",
  "access_control",
]);

const INPUT_SCENARIOS = new Set<DodTestScenario>([
  "form_submission",
  "validation_error",
]);

const FIELD_QUESTIONS: Record<DodTestContractField, string> = {
  startPath: "이 완료조건을 시작할 정확한 URL은 무엇인가요?",
  precondition: "테스트를 시작하기 전에 어떤 로그인 상태나 화면 상태가 필요하나요?",
  fixture: "이 상태를 반복해서 만들 수 있는 테스트 데이터 또는 준비 절차는 무엇인가요?",
  action: "사용자가 화면에서 수행할 한 가지 행동은 무엇인가요?",
  target: "사용자가 누르거나 입력할 화면 요소의 이름은 무엇인가요?",
  input: "테스트에서 사용할 구체적인 입력값은 무엇인가요?",
  expected: "행동 후 화면에서 확인할 정확한 결과는 무엇인가요?",
  cleanup: "다음 테스트에 영향을 주지 않도록 데이터를 어떻게 정리하나요?",
};

const FIELD_SUGGESTIONS: Record<DodTestContractField, string[]> = {
  startPath: ["/login", "/todos"],
  precondition: ["로그아웃 상태에서 시작", "테스트 계정으로 로그인한 상태에서 시작"],
  fixture: ["테스트 계정에 필요한 데이터를 화면에서 미리 생성", "새 테스트 계정의 초기 상태 사용"],
  action: ["대상 버튼을 한 번 클릭", "값을 입력한 뒤 제출 버튼 클릭"],
  target: ["화면에 표시된 버튼 이름 사용", "입력란의 라벨 이름 사용"],
  input: ["고정된 합성 테스트 값 사용", "AI 추천 테스트 값 사용"],
  expected: ["이동한 URL로 확인", "화면에 표시되는 문구와 상태로 확인"],
  cleanup: ["테스트에서 만든 데이터를 화면에서 삭제", "격리된 테스트 계정을 매 실행마다 초기화"],
};

export function requiredContractFields(contract: DodTestContract): DodTestContractField[] {
  const fields: DodTestContractField[] = ["startPath", "action", "target", "expected"];
  if (STATEFUL_SCENARIOS.has(contract.scenario)) fields.splice(1, 0, "precondition", "fixture");
  if (INPUT_SCENARIOS.has(contract.scenario)) fields.splice(fields.length - 1, 0, "input");
  return fields;
}

export function missingContractFields(contract: DodTestContract): DodTestContractField[] {
  return requiredContractFields(contract).filter((field) => !contract[field]?.trim());
}

export function normalizeContractRequirements(
  contract: DodTestContract,
  proposed: DodClarificationRequirement[],
): DodClarificationRequirement[] {
  const proposedByKey = new Map(proposed.map((item) => [item.key, item]));
  return missingContractFields(contract).map((field) => {
    const candidate = proposedByKey.get(field);
    const suggestions = (candidate?.suggestions ?? FIELD_SUGGESTIONS[field])
      .map((value) => value.trim().slice(0, 120))
      .filter((value, index, all) => Boolean(value) && all.indexOf(value) === index)
      .slice(0, 3);
    return {
      key: field,
      question: candidate?.question?.trim().slice(0, 500) || FIELD_QUESTIONS[field],
      suggestions: suggestions.length >= 2 ? suggestions : FIELD_SUGGESTIONS[field],
      recommendedSuggestion:
        candidate?.recommendedSuggestion && suggestions.includes(candidate.recommendedSuggestion)
          ? candidate.recommendedSuggestion
          : suggestions[0] ?? FIELD_SUGGESTIONS[field][0],
      ...(candidate?.answer?.trim() ? { answer: candidate.answer.trim().slice(0, 1000) } : {}),
    };
  });
}

export function isCompleteTestContract(contract: DodTestContract | undefined): contract is DodTestContract {
  return Boolean(contract && missingContractFields(contract).length === 0);
}

export function contractToTestHint(contract: DodTestContract): string {
  return [
    `scenario: ${contract.scenario}`,
    `startPath: ${contract.startPath ?? ""}`,
    `precondition: ${contract.precondition ?? ""}`,
    `fixture: ${contract.fixture ?? ""}`,
    `action: ${contract.action ?? ""}`,
    `target: ${contract.target ?? ""}`,
    `input: ${contract.input ?? ""}`,
    `expected: ${contract.expected ?? ""}`,
    `cleanup: ${contract.cleanup ?? ""}`,
  ].join(" / ").slice(0, 2000);
}

export function parseDodTestContract(value: unknown): DodTestContract | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  if (
    record.version !== DOD_TEST_CONTRACT_VERSION ||
    typeof record.scenario !== "string" ||
    !DOD_TEST_SCENARIOS.includes(record.scenario as DodTestScenario)
  ) return undefined;

  const contract: DodTestContract = {
    version: DOD_TEST_CONTRACT_VERSION,
    scenario: record.scenario as DodTestScenario,
  };
  const fields: DodTestContractField[] = [
    "startPath",
    "precondition",
    "fixture",
    "action",
    "target",
    "input",
    "expected",
    "cleanup",
  ];
  for (const field of fields) {
    const raw = record[field];
    if (raw === undefined) continue;
    if (typeof raw !== "string") return undefined;
    const bounded = raw.trim().slice(0, 1000);
    if (bounded) contract[field] = bounded;
  }
  return contract;
}

const CONTRACT_FIELDS: DodTestContractField[] = [
  "startPath",
  "precondition",
  "fixture",
  "action",
  "target",
  "input",
  "expected",
  "cleanup",
];

function isContractField(key: string): key is DodTestContractField {
  return (CONTRACT_FIELDS as string[]).includes(key);
}

/**
 * 확정된 질문의 답변을 계약 필드에 그대로 반영한다.
 *
 * `requirements[].key`가 곧 계약 필드명이므로 이 병합은 LLM 없이 결정적으로
 * 수행할 수 있다. 답변을 LLM에 다시 넘겨 재작성하게 하면 사용자가 이미 확정한
 * 값이 조용히 바뀌거나 누락되어 "답변을 다 했는데도 미완성" 상태로 되돌아간다.
 * 이미 값이 있는 필드는 사용자의 답변으로만 덮어쓰고, 그 외에는 보존한다.
 */
export function applyAnswersToContract(
  contract: DodTestContract,
  requirements: DodClarificationRequirement[],
): DodTestContract {
  const next: DodTestContract = { ...contract };
  for (const requirement of requirements) {
    const answer = requirement.answer?.trim();
    if (!answer || !isContractField(requirement.key)) continue;
    const bounded = answer.slice(0, 1000);
    next[requirement.key] = requirement.key === "startPath"
      ? extractContractPath(bounded) ?? bounded
      : bounded;
  }
  return next;
}

/** 한국어 조사가 붙은 표현(`/login에서`)에서 URL 부분만 읽는다. */
export function extractContractPath(text: string): string | undefined {
  const match = text.match(/(?:^|[\s`'"(])(\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]{0,500})/);
  const path = match?.[1];
  return path && /^\/(?!\/)[^\s?#]{0,500}$/.test(path) ? path : undefined;
}

const SCENARIO_LABELS: Record<DodTestScenario, string> = {
  navigation: "화면 이동",
  form_submission: "폼 제출",
  validation_error: "입력 검증 오류",
  state_change: "상태 변경",
  state_persistence: "상태 유지(새로고침·재접속)",
  duplicate_prevention: "중복 생성 방지",
  list_filter: "목록 필터",
  empty_state: "빈 상태 화면",
  error_recovery: "오류 복구",
  access_control: "접근 권한 차단",
  generic_ui: "일반 화면 확인",
};

const FIELD_LABELS: Record<DodTestContractField, string> = {
  startPath: "시작 URL",
  precondition: "사전 상태",
  fixture: "테스트 데이터 준비",
  action: "사용자 행동",
  target: "행동 대상(화면에 보이는 이름)",
  input: "입력값",
  expected: "기대 결과",
  cleanup: "정리 방법",
};

/**
 * 확정된 검수 계약을 atom 조합 단계가 읽을 구조화된 요약으로 만든다.
 *
 * 계약을 한 줄 문자열로 눌러 넘기면 질문·답변으로 확보한 구분(시작 URL과
 * 기대 결과 등)이 사라져 조합 단계가 문장을 다시 추측하게 된다. 라벨을 유지해
 * 넘기면 같은 정보로 더 안정적인 조합을 고를 수 있다.
 */
export function contractToCompositionBrief(dod: string, contract?: DodTestContract): string {
  if (!contract) return dod;
  const lines = [
    `완료조건: ${dod}`,
    `시나리오 유형: ${SCENARIO_LABELS[contract.scenario] ?? contract.scenario}`,
    ...CONTRACT_FIELDS.flatMap((field) => {
      const value = contract[field]?.trim();
      return value ? [`${FIELD_LABELS[field]}: ${value}`] : [];
    }),
  ];
  return lines.join("\n").slice(0, 2000);
}

/**
 * 계약만으로 확정 DoD 문장을 만든다.
 *
 * LLM 문장 다듬기가 실패해도 확정된 답변이 사라지지 않도록 하는 대체 경로다.
 * 계약에 있는 값만 사용하므로 없는 기능을 새로 만들어내지 않는다.
 */
export function contractToDodSentence(contract: DodTestContract, fallback: string): string {
  const parts = [
    contract.startPath ? `\`${contract.startPath}\`에서` : null,
    contract.precondition?.trim() || null,
    contract.fixture?.trim() || null,
    contract.input?.trim() ? `${contract.input.trim()} 입력 후` : null,
    contract.target?.trim() && contract.action?.trim()
      ? `${contract.target.trim()}에 ${contract.action.trim()}`
      : contract.action?.trim() || null,
    contract.expected?.trim() ? `시 ${contract.expected.trim()}` : null,
  ].filter((part): part is string => Boolean(part));
  if (parts.length < 2) return fallback;
  const sentence = parts.join(" ").replace(/\s+/g, " ").trim();
  return /(확인|표시|이동|차단|노출|유지|완료|생성|거부|제한)$/.test(sentence)
    ? sentence
    : `${sentence} 확인`;
}

/**
 * 아직 채워지지 않은 필수 계약 필드를 사용자가 읽을 수 있는 이름으로 돌려준다.
 * 답변을 모두 받았는데도 계약이 완성되지 않은 경우, 무엇이 비었는지 그대로
 * 밝히기 위해 쓴다. 비어 있는 것을 완료로 표시하지 않기 위한 안전장치다.
 */
export function unansweredContractFieldLabels(contract: DodTestContract): string[] {
  return missingContractFields(contract).map((field) => FIELD_LABELS[field]);
}
