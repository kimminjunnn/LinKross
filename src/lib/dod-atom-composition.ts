import {
  MANAGED_API_CHECK_SPEC_VERSION,
  MANAGED_BROWSER_SPEC_VERSION_V3,
  parseManagedApiCheckTestSpec,
  parseManagedBrowserAtomTestSpec,
  type ManagedApiCheckTestSpec,
  type ManagedBrowserAtomTestSpec,
} from "@/lib/verification-test-spec";

/**
 * LLM이 고른 atom 조합을 실행 가능한 스펙으로 확정하는 순수 로직.
 *
 * 판정 코드는 항상 고정된 하네스에 있고 LLM은 "어떤 atom을 어떤 순서로 쓸지"만
 * 고른다(설계 §21.2). 이 모듈은 그 선택을 엄격 파서에 통과시키는 관문이며,
 * 네트워크·환경 의존이 없어 단독으로 검증할 수 있다.
 */

export const ATOM_NAMES = [
  "goto",
  "fill",
  "click",
  "press",
  "set_viewport",
  "expect_visible",
  "expect_hidden",
  "expect_enabled",
  "expect_disabled",
  "expect_focused",
  "expect_text",
  "expect_path",
  "expect_within_viewport",
  "expect_error_feedback",
  "expect_form_blocked",
  "expect_checked",
  "expect_unchecked",
  "expect_count",
  "expect_every_text",
  "expect_none_text",
] as const;

export const TARGET_KINDS = ["field", "role", "label", "text", "placeholder", "testId", "none"] as const;
export const VALUE_KINDS = ["ref", "literal", "none"] as const;

export const DEFAULT_CREDENTIALS = {
  email: "test@example.com",
  password: "Test1234!",
  invalidPassword: "wrong-password",
} as const;

/** LLM이 반환하는 평면 구조. 실행 코드나 selector 문자열은 받지 않는다. */
export interface FlatStep {
  atom: string;
  targetKind: string;
  targetValue: string;
  targetName: string;
  valueKind: string;
  value: string;
  path: string;
  contains: string;
  key: string;
  viewport: string;
  count: number;
}

export interface FlatApiStep {
  method: string;
  path: string;
  bodyJson: string;
  expectStatus: number;
}

export interface FlatItem {
  automatable: string;
  startPath: string;
  steps: FlatStep[];
  apiSteps: FlatApiStep[];
}

export type ComposedSpec = ManagedBrowserAtomTestSpec | ManagedApiCheckTestSpec;

export type ComposeRejectionReason =
  | "no_api_key"
  | "llm_failed"
  | "llm_declined"
  | "schema_rejected"
  /** 완료조건에 없는 문구를 기대 결과로 지어낸 경우. */
  | "ungrounded_text";

export interface ComposeOutcome {
  spec: ComposedSpec | null;
  /** null 사유. 갭 로그에 남겨 어휘 부족과 스키마 오류를 구분한다(§21.5). */
  reason?: ComposeRejectionReason;
}

/**
 * LLM이 고른 조합을 실행 가능한 스펙으로 확정한다.
 *
 * `fallbackStartPath`는 확정된 검수 계약에서 온 시작 경로다. 사용자가 질문에
 * 답해 확정한 값이므로 LLM이 다시 추측한 경로보다 우선한다.
 */
export function normalizeComposedItem(
  item: FlatItem,
  fallbackStartPath?: string,
  groundingText?: string,
): ComposeOutcome {
  if (item.automatable === "none") return { spec: null, reason: "llm_declined" };

  if (item.automatable === "api") {
    const steps = (item.apiSteps ?? []).map((step) => {
      const body = parseBody(step.bodyJson);
      return {
        method: step.method,
        path: step.path,
        expectStatus: step.expectStatus,
        ...(body ? { body } : {}),
      };
    });
    const spec = parseManagedApiCheckTestSpec({
      version: MANAGED_API_CHECK_SPEC_VERSION,
      kind: "api_check",
      steps,
    });
    return spec ? { spec } : { spec: null, reason: "schema_rejected" };
  }

  if (item.automatable !== "ui") return { spec: null, reason: "schema_rejected" };

  // 변환에 실패한 step을 버리고 나머지로 조합을 만들면 단언이 사라진 채
  // 무조건 통과하는 시나리오가 될 수 있다. 하나라도 실패하면 조합 전체를 버린다.
  const grounding = normalizeForGrounding(groundingText ?? "");
  const steps: object[] = [];
  for (const rawStep of item.steps ?? []) {
    const atom = toAtom(rawStep);
    if (!atom) return { spec: null, reason: "schema_rejected" };
    // 완료조건에 없는 문구를 기대 결과로 지어내면 멀쩡한 결과물이 "실패"로
    // 잘못 판정된다. 근거가 없는 단언은 조합 전체를 버리고 사람 확인으로 넘긴다.
    if (grounding && !isGroundedTextAssertion(atom, grounding)) {
      return { spec: null, reason: "ungrounded_text" };
    }
    steps.push(atom);
  }
  // 동작만 있고 확인이 없는 조합은 무엇도 검증하지 못하므로 채택하지 않는다.
  if (!steps.some((atom) => String((atom as { atom: string }).atom).startsWith("expect_"))) {
    return { spec: null, reason: "schema_rejected" };
  }

  const startPath = normalizePath(item.startPath) ?? normalizePath(fallbackStartPath);
  const spec = parseManagedBrowserAtomTestSpec({
    version: MANAGED_BROWSER_SPEC_VERSION_V3,
    kind: "managed_browser",
    startPath,
    steps,
    syntheticCredentials: { ...DEFAULT_CREDENTIALS },
  });
  return spec ? { spec } : { spec: null, reason: "schema_rejected" };
}

function normalizePath(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.startsWith("/") ? trimmed : undefined;
}

export function toAtom(step: FlatStep): object | null {
  const target = toTarget(step);

  switch (step.atom) {
    case "goto":
    case "expect_path":
      return { atom: step.atom, path: step.path };
    case "press":
      return { atom: "press", key: step.key };
    case "set_viewport":
      return { atom: "set_viewport", preset: step.viewport };
    case "expect_error_feedback":
      return { atom: "expect_error_feedback" };
    case "expect_text": {
      if (!step.contains.trim()) return null;
      // `{text: ...}` 대상은 "그 문구를 가진 요소"를 먼저 찾은 뒤 그 안에서 다시
      // 문구를 확인한다. LLM은 여기에 화면 문구가 아니라 요소 설명("빈 상태 화면")을
      // 넣기 쉬운데, 그러면 요소를 찾지 못해 항상 실패한다. 문구 단언은 contains
      // 하나로 충분하므로 이 경우 대상을 떼고 화면 전체에서 확인한다.
      const scoped = target && !("text" in (target as Record<string, unknown>)) ? target : undefined;
      return scoped
        ? { atom: "expect_text", contains: step.contains, target: scoped }
        : { atom: "expect_text", contains: step.contains };
    }
    case "fill":
      return target ? { atom: "fill", target, value: toValue(step) } : null;
    case "expect_count": {
      if (!target || !Number.isInteger(step.count) || step.count < 0) return null;
      return { atom: "expect_count", target, count: step.count };
    }
    case "expect_every_text":
    case "expect_none_text": {
      // 대상과 문구가 모두 있어야 목록 내용을 판정할 수 있다.
      if (!target || !step.contains.trim()) return null;
      return { atom: step.atom, contains: step.contains, target };
    }
    case "click":
    case "expect_visible":
    case "expect_hidden":
    case "expect_enabled":
    case "expect_disabled":
    case "expect_focused":
    case "expect_within_viewport":
    case "expect_form_blocked":
    case "expect_checked":
    case "expect_unchecked":
      return target ? { atom: step.atom, target } : null;
    default:
      return null;
  }
}

function toTarget(step: FlatStep): object | null {
  switch (step.targetKind) {
    case "field":
      return { field: step.targetValue };
    case "role":
      return step.targetName ? { role: step.targetValue, name: step.targetName } : { role: step.targetValue };
    case "label":
      return { label: step.targetValue };
    case "text":
      return { text: step.targetValue };
    case "placeholder":
      return { placeholder: step.targetValue };
    case "testId":
      return { testId: step.targetValue };
    default:
      return null;
  }
}

function toValue(step: FlatStep): object {
  return step.valueKind === "ref" ? { ref: step.value } : { literal: step.value };
}

function parseBody(bodyJson: string): Record<string, string> | undefined {
  if (!bodyJson || bodyJson.trim() === "" || bodyJson.trim() === "{}") return undefined;
  try {
    const parsed = JSON.parse(bodyJson) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    const body: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== "string") return undefined;
      body[key] = value;
    }
    return Object.keys(body).length > 0 ? body : undefined;
  } catch {
    return undefined;
  }
}

/** 비교를 위해 공백과 따옴표를 지우고 소문자로 맞춘다. */
function normalizeForGrounding(text: string): string {
  return text.replace(/[\s`'"“”‘’]/g, "").toLowerCase();
}

/**
 * 문구 단언이 완료조건·검수 계약에 실제로 등장하는 표현인지 확인한다.
 * 화면에 보일 문구는 사용자가 합의한 범위 안에서만 나와야 한다.
 */
function isGroundedTextAssertion(atom: object, grounding: string): boolean {
  const step = atom as { atom: string; contains?: string; target?: Record<string, unknown> };
  const claims: string[] = [];
  if (
    (step.atom === "expect_text" || step.atom === "expect_every_text" || step.atom === "expect_none_text") &&
    step.contains
  ) claims.push(step.contains);
  if (typeof step.target?.name === "string") claims.push(step.target.name);
  if (typeof step.target?.text === "string") claims.push(step.target.text);
  if (typeof step.target?.label === "string") claims.push(step.target.label);
  return claims.every((claim) => {
    const normalized = normalizeForGrounding(claim);
    return normalized.length === 0 || grounding.includes(normalized);
  });
}
