import type {
  DodClarificationRequirement,
  DodTestContract,
  DodVerificationConversationMessage,
  DodVerificationDesign,
  VerificationDesignStatus,
} from "@/lib/backend/contracts";
import { contractToTestHint } from "@/lib/dod-test-contract";

/**
 * DoD 검수 설계 상태의 단일 판정 지점.
 *
 * 상태를 UI·서버 액션·저장 경로가 각자 계산하면 같은 DoD가 화면마다 다른 상태로
 * 보이고, 저장할 때마다 완료가 미완료로 되돌아간다. 판정은 이 모듈에서만 하고
 * 나머지는 결과를 표시하기만 한다.
 *
 * 확정 상태는 세 가지뿐이다.
 * - `clarification_required`: 확정된 질문 세트에 아직 답변하지 않은 항목이 있다.
 * - `automation_ready`: 엄격 파서를 통과한 실행 가능한 테스트 스펙이 실제로 있다.
 * - `human_review_required`: 자동화가 불가능하다고 확정했다. 사람이 확인한다.
 *
 * `contract_ready`·`dod_ready`는 예전 초안에만 남아 있는 과도기 값이며, 저장이
 * 끝난 뒤에는 절대 남지 않는다. 이 값들은 "질문은 끝났지만 실행 스펙은 아직
 * 없음"을 뜻하는데, 화면에는 완료처럼 보여 되돌아감의 원인이 되었다.
 */

export const TRANSIENT_STATUSES: VerificationDesignStatus[] = ["contract_ready", "dod_ready"];

export function isTransientStatus(status: VerificationDesignStatus | undefined): boolean {
  return status !== undefined && TRANSIENT_STATUSES.includes(status);
}

/** 사용자가 더 이상 할 일이 없는 상태인지. 제출 가능 여부 판단에 쓴다. */
export function isSettledStatus(design: DodVerificationDesign | undefined): boolean {
  if (design?.status === "automation_ready") return true;
  return design?.status === "human_review_required" && design.humanReviewAccepted === true;
}

export function unansweredRequirements(
  requirements: DodClarificationRequirement[] | undefined,
): DodClarificationRequirement[] {
  return (requirements ?? []).filter((requirement) => !requirement.answer?.trim());
}

export function answeredRequirementCount(
  requirements: DodClarificationRequirement[] | undefined,
): number {
  return (requirements ?? []).length - unansweredRequirements(requirements).length;
}

/**
 * 확정된 질문 세트와 답변을 대화 형태로 되살린다.
 *
 * 저장할 때마다 대화를 "현재 질문 한 줄"로 덮어쓰면 사용자는 이미 답한 질문이
 * 사라졌다가 다시 나타나는 것처럼 느낀다. 질문 세트가 곧 대화의 원본이므로
 * 매번 같은 순서로 다시 만들어 준다.
 */
export function conversationFromRequirements(
  requirements: DodClarificationRequirement[] | undefined,
): DodVerificationConversationMessage[] {
  const messages: DodVerificationConversationMessage[] = [];
  for (const requirement of requirements ?? []) {
    messages.push({ role: "assistant", content: requirement.question });
    const answer = requirement.answer?.trim();
    if (answer) messages.push({ role: "user", content: answer });
  }
  return messages;
}

export interface ResolveDesignInput {
  /** 최초 분석에서 확정한 질문 세트. 빈 배열도 "질문 없음"이라는 확정 결과다. */
  requirements: DodClarificationRequirement[];
  /** 답변을 반영한 검수 계약. */
  contract?: DodTestContract;
  /** 엄격 파서를 통과한 실행 가능한 스펙이 있는지. */
  hasExecutableSpec: boolean;
  /** 사람 확인 항목임을 사용자가 확인했는지. */
  humanReviewAccepted?: boolean;
  startPath?: string;
  /** 자동화 불가로 확정했을 때 사용자에게 보여줄 안내. */
  manualGuidance?: { location: string; method: string; expected: string };
}

export interface ResolvedDesign {
  status: VerificationDesignStatus;
  design: DodVerificationDesign;
}

/**
 * 확정된 입력만으로 상태를 결정한다. 같은 입력이면 언제나 같은 상태가 나온다.
 * 이 결정성이 "저장할 때마다 상태가 흔들리는" 문제를 막는다.
 */
export function resolveDesign(input: ResolveDesignInput): ResolvedDesign {
  const pending = unansweredRequirements(input.requirements);
  const conversation = conversationFromRequirements(input.requirements);
  const base: DodVerificationDesign = {
    ...(input.startPath ? { startPath: input.startPath } : {}),
    ...(input.contract
      ? { testContract: input.contract, testHint: contractToTestHint(input.contract) }
      : {}),
    requirements: input.requirements,
    conversation,
    questionSetLocked: true,
  };

  if (pending.length > 0) {
    return {
      status: "clarification_required",
      design: {
        ...base,
        status: "clarification_required",
        question: pending[0].question,
        ...(pending[0].suggestions ? { suggestions: pending[0].suggestions } : {}),
        ...(pending[0].recommendedSuggestion
          ? { recommendedSuggestion: pending[0].recommendedSuggestion }
          : {}),
        humanReviewAccepted: false,
        message: `자동 테스트를 만들기 위해 확인이 필요한 항목 ${pending.length}개에 답해 주세요.`,
      },
    };
  }

  if (input.hasExecutableSpec) {
    return {
      status: "automation_ready",
      design: {
        ...base,
        status: "automation_ready",
        question: undefined,
        suggestions: undefined,
        recommendedSuggestion: undefined,
        humanReviewAccepted: false,
        message: "이 완료조건으로 실행할 자동 테스트가 준비되었습니다.",
      },
    };
  }

  return {
    status: "human_review_required",
    design: {
      ...base,
      status: "human_review_required",
      question: undefined,
      suggestions: undefined,
      recommendedSuggestion: undefined,
      humanReviewAccepted: input.humanReviewAccepted === true,
      message: input.humanReviewAccepted === true
        ? "발주자가 직접 확인하는 항목으로 확정했습니다."
        : buildManualMessage(input.manualGuidance),
    },
  };
}

function buildManualMessage(guidance: ResolveDesignInput["manualGuidance"]): string {
  if (!guidance) {
    return "이 조건은 자동 테스트로 판정할 수 없어 발주자가 Preview에서 직접 확인해야 합니다.";
  }
  return [
    "자동 테스트로 판정할 수 없어 직접 확인이 필요합니다.",
    `확인 위치: ${guidance.location}`,
    `확인 방법: ${guidance.method}`,
    `기대 결과: ${guidance.expected}`,
  ].join("\n");
}

/**
 * 이미 실행 가능한 스펙이 있는 DoD를 다시 설계할 필요가 있는지 판단한다.
 *
 * 사용자가 다른 DoD에 답할 때마다 전체가 저장되므로, 문장이 그대로인데도 매번
 * 다시 판정하면 이전에 준비된 자동 테스트가 이유 없이 사라질 수 있다. 문장이
 * 바뀐 경우에만 다시 설계한다.
 */
export function shouldReuseExistingSpec(input: {
  storedDescription?: string;
  storedMethod?: string;
  hasStoredSpec: boolean;
  currentDod: string;
}): boolean {
  return (
    input.hasStoredSpec &&
    input.storedMethod === "automated_e2e" &&
    typeof input.storedDescription === "string" &&
    input.storedDescription.trim() === input.currentDod.trim()
  );
}

export interface DesignProgressSummary {
  total: number;
  automationReady: number;
  clarificationRequired: number;
  humanReviewRequired: number;
  humanReviewUnaccepted: number;
  transient: number;
}

export function summarizeDesigns(
  designs: Array<DodVerificationDesign | undefined>,
): DesignProgressSummary {
  return designs.reduce<DesignProgressSummary>(
    (summary, design) => ({
      total: summary.total + 1,
      automationReady: summary.automationReady + (design?.status === "automation_ready" ? 1 : 0),
      clarificationRequired:
        summary.clarificationRequired + (design?.status === "clarification_required" ? 1 : 0),
      humanReviewRequired:
        summary.humanReviewRequired + (design?.status === "human_review_required" ? 1 : 0),
      humanReviewUnaccepted:
        summary.humanReviewUnaccepted +
        (design?.status === "human_review_required" && design.humanReviewAccepted !== true ? 1 : 0),
      transient: summary.transient + (isTransientStatus(design?.status) ? 1 : 0),
    }),
    {
      total: 0,
      automationReady: 0,
      clarificationRequired: 0,
      humanReviewRequired: 0,
      humanReviewUnaccepted: 0,
      transient: 0,
    },
  );
}
