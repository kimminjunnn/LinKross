import {
  MANAGED_API_CHECK_SPEC_VERSION,
  MANAGED_BROWSER_SPEC_VERSION_V3,
  MAX_ATOM_STEPS,
  UI_CREDENTIAL_REFS,
  UI_SEMANTIC_FIELDS,
  UI_TARGET_ROLES,
  isSafePath,
  parseManagedApiCheckTestSpec,
  parseManagedBrowserAtomTestSpec,
  parseUiAtom,
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

/** expect_form_blocked 의 checkValidity() 검사가 성립하는 대상 역할. */
const FORM_CONTROL_ROLES = ["textbox", "combobox", "checkbox", "radio"];

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

/**
 * LLM이 반환하는 평면 구조. 실행 코드나 selector 문자열은 받지 않는다.
 *
 * 대상 지정은 종류별로 필드를 나눈다. 예전에는 `targetValue` 하나에 의미가
 * 다른 값을 모두 담게 해서, 모델이 `targetKind=field`에 역할 이름(`textbox`)이나
 * 임의의 입력란 이름(`companyName`)을 넣었다. `field`는 로그인 요소 세 개만
 * 뜻하므로 그런 조합은 엄격 파서에서 전부 버려졌고, 실측에서 자동화 실패의
 * 가장 큰 원인이었다. 필드를 나누면 스키마 단계에서 열거값으로 막을 수 있다.
 */
export interface FlatStep {
  atom: string;
  targetKind: string;
  /** targetKind=field일 때만. 로그인 화면의 의미 요소 세 가지. */
  targetField: string;
  /** targetKind=role일 때만. 접근성 역할. */
  targetRole: string;
  /** targetKind=role일 때 요소에 보이는 이름. */
  targetName: string;
  /** targetKind=label|text|placeholder|testId일 때 찾을 문자열. */
  targetText: string;
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
  /**
   * 거부된 지점을 사람이 읽을 수 있게 남긴다.
   *
   * `schema_rejected`는 원인이 여러 가지다(대상 없는 동작, 단언 누락, 엄격 파서
   * 불통과 등). 사유만으로는 무엇을 고쳐야 할지 알 수 없어 자동화율을 올릴 수
   * 없었다. 판정에는 쓰지 않고 진단에만 쓴다.
   */
  detail?: string;
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
  precondition?: string,
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
    return spec ? { spec } : { spec: null, reason: "schema_rejected", detail: "api_check 엄격 파서 불통과" };
  }

  if (item.automatable !== "ui") {
    return { spec: null, reason: "schema_rejected", detail: `automatable=${item.automatable}` };
  }

  // 변환에 실패한 step을 버리고 나머지로 조합을 만들면 단언이 사라진 채
  // 무조건 통과하는 시나리오가 될 수 있다. 하나라도 실패하면 조합 전체를 버린다.
  const grounding = normalizeForGrounding(groundingText ?? "");
  const steps: object[] = [];
  for (const rawStep of item.steps ?? []) {
    const atom = toAtom(rawStep);
    if (!atom) {
      return {
        spec: null,
        reason: "schema_rejected",
        detail: `atom 변환 실패: atom=${rawStep.atom} ${describeFlatTarget(rawStep)}${rawStep.atom === "fill" ? ` valueKind=${truncate(rawStep.valueKind)} value=${truncate(rawStep.value)}` : ""}`,
      };
    }
    // 완료조건에 없는 문구를 기대 결과로 지어내면 멀쩡한 결과물이 "실패"로
    // 잘못 판정된다. 근거가 없는 단언은 조합 전체를 버리고 사람 확인으로 넘긴다.
    if (grounding && !isGroundedTextAssertion(atom, grounding)) {
      return {
        spec: null,
        reason: "ungrounded_text",
        detail: `근거 없는 문구: ${truncate(ungroundedClaim(atom, grounding))}`,
      };
    }
    steps.push(atom);
  }
  // 동작만 있고 확인이 없는 조합은 무엇도 검증하지 못하므로 채택하지 않는다.
  if (!steps.some((atom) => String((atom as { atom: string }).atom).startsWith("expect_"))) {
    return { spec: null, reason: "schema_rejected", detail: "확인 단계(expect_*)가 하나도 없음" };
  }

  // expect_form_blocked 는 대상 요소의 checkValidity()/aria-invalid 를 본다
  // (`verification-runner/playwright-harness.ts`). 폼 컨트롤이 아닌 대상에는
  // 그 검사가 성립하지 않아 정상 결과물도 반드시 실패한다. 모델이 '비활성',
  // '미노출' 같은 조건에 이 동작을 골라 오는 일이 반복돼, 프롬프트 안내 대신
  // 여기서 결정적으로 막고 교정 요청에 이유를 남긴다.
  const badFormBlocked = steps.find((atom) => {
    const step = atom as { atom: string; target?: Record<string, unknown> };
    if (step.atom !== "expect_form_blocked") return false;
    const target = step.target ?? {};
    if (typeof target.text === "string") return true;
    return typeof target.role === "string" && !FORM_CONTROL_ROLES.includes(target.role);
  });
  if (badFormBlocked) {
    const target = (badFormBlocked as { target?: Record<string, unknown> }).target ?? {};
    return {
      spec: null,
      reason: "schema_rejected",
      detail: `expect_form_blocked 대상이 입력란이 아님(${String(target.role ?? "text")}). 비활성 확인은 expect_disabled, 미노출 확인은 expect_hidden 을 쓸 것`,
    };
  }

  // 계약이 로그인한 상태를 요구하는데 조합이 로그인을 하지 않으면, 그 조합은
  // 확인하려는 화면에 닿지도 못한 채 실패한다. 실측에서 이것이 정상 앱을 실패로
  // 판정하는 원인이었고(False FAIL), 동시에 권한 검사가 없는 고장 앱은 오히려
  // 통과시켰다(False PASS). 로그인 단계를 여기서 임의로 끼워 넣지는 않는다.
  // 어떤 화면에서 어떻게 로그인하는지는 앱마다 다르고, 틀린 전제를 만들면
  // 오판이 늘어난다. 조합을 버려 사람 확인으로 넘기고, 교정 요청에 이유를 남긴다.
  if (requiresLoginState(precondition) && !buildsLoginState(steps)) {
    return {
      spec: null,
      reason: "schema_rejected",
      detail: `전제 미이행: 계약이 "${truncate(precondition)}"를 요구하는데 로그인 단계가 없음`,
    };
  }
  // 데이터가 이미 있어야 하는 조건도 같은 원리다. 테스트가 그 데이터를 만들지
  // 않으면 빈 화면에서 시작하므로, 정상 앱에서도 확인할 대상을 찾지 못해 실패한다.
  if (requiresExistingData(precondition) && !buildsData(steps)) {
    return {
      spec: null,
      reason: "schema_rejected",
      detail: `전제 미이행: 계약이 "${truncate(precondition)}"를 요구하는데 데이터를 만드는 단계가 없음`,
    };
  }

  const startPath = normalizePath(item.startPath) ?? normalizePath(fallbackStartPath);
  const spec = parseManagedBrowserAtomTestSpec({
    version: MANAGED_BROWSER_SPEC_VERSION_V3,
    kind: "managed_browser",
    startPath,
    steps,
    syntheticCredentials: { ...DEFAULT_CREDENTIALS },
  });
  return spec ? { spec } : { spec: null, reason: "schema_rejected", detail: diagnoseSpecRejection(startPath, steps) };
}

/**
 * 스펙 전체가 버려졌을 때 원인이 된 지점을 짚는다.
 *
 * `toAtom`은 평면 응답을 atom 모양으로 옮기기만 하고, 값이 허용된 어휘인지는
 * 엄격 파서가 따로 본다. 그래서 역할 이름이 목록에 없거나 대상 문자열이 비어
 * 있는 step 하나 때문에 조합 전체가 사라지는데, 사유만으로는 그 사실을 알 수
 * 없었다. 같은 파서를 step 하나에 다시 적용해 무엇이 걸렸는지 남긴다.
 */
function diagnoseSpecRejection(startPath: string | undefined, steps: object[]): string {
  if (!isSafePath(startPath)) return `시작 경로가 유효하지 않음: ${truncate(startPath)}`;
  if (steps.length === 0) return "동작이 하나도 없음";
  if (steps.length > MAX_ATOM_STEPS) return `동작이 상한(${MAX_ATOM_STEPS})을 넘음: ${steps.length}개`;
  for (const [index, step] of steps.entries()) {
    if (parseUiAtom(step) !== null) continue;
    const named = step as { atom?: string; target?: Record<string, unknown>; path?: unknown };
    const targetKey = named.target ? Object.keys(named.target)[0] : undefined;
    const targetValue = targetKey ? named.target?.[targetKey] : undefined;
    return targetKey
      ? `${index + 1}번째 동작 거부: atom=${named.atom} 대상 ${targetKey}=${truncate(String(targetValue ?? ""))}`
      : `${index + 1}번째 동작 거부: atom=${named.atom} path=${truncate(String(named.path ?? ""))}`;
  }
  return "managed_browser 엄격 파서 불통과 (지점 특정 실패)";
}

/**
 * 어느 필드 때문에 변환이 실패했는지 짚는다.
 *
 * 동작마다 필수 필드가 다르다. `expect_text`는 대상이 없어도 되지만 `contains`가
 * 비면 안 된다. 무조건 대상만 보고하면 "대상 없음"이라는 엉뚱한 진단이 남아
 * 무엇을 고쳐야 할지 잘못 알려 준다.
 */
function describeFlatTarget(step: FlatStep): string {
  if (step.atom === "expect_text" && !step.contains.trim()) return "확인할 문구(contains)가 비어 있음";
  if ((step.atom === "expect_every_text" || step.atom === "expect_none_text") && !step.contains.trim()) {
    return "확인할 문구(contains)가 비어 있음";
  }
  if (step.atom === "goto" || step.atom === "expect_path") return `path=${truncate(step.path)}`;
  if (step.atom === "press") return `key=${truncate(step.key)}`;
  if (step.atom === "set_viewport") return `viewport=${truncate(step.viewport)}`;
  if (step.atom === "expect_count" && !Number.isInteger(step.count)) return `count=${step.count}`;
  return describeTargetKind(step);
}

function describeTargetKind(step: FlatStep): string {
  switch (step.targetKind) {
    case "field": return `field=${truncate(step.targetField)}`;
    case "role": return `role=${truncate(step.targetRole)} name=${truncate(step.targetName)}`;
    case "label":
    case "text":
    case "placeholder":
    case "testId": return `${step.targetKind}=${truncate(step.targetText)}`;
    case "none": return "대상 없음";
    default: return `targetKind=${truncate(step.targetKind)}`;
  }
}

/**
 * 계약의 사전 상태가 "로그인한 상태"를 뜻하는지 본다.
 * "로그인하지 않은 상태"처럼 부정형은 로그인을 요구하지 않으므로 제외한다.
 */
export function requiresLoginState(precondition?: string): boolean {
  const text = (precondition ?? "").replace(/\s/g, "");
  if (!text) return false;
  if (/로그인하지않|로그인되지않|비로그인|미로그인|로그아웃/.test(text)) return false;
  return /로그인/.test(text);
}

/**
 * 조합이 로그인 상태를 실제로 만드는지 본다.
 * 비밀번호 입력란에 값을 넣는 단계가 있으면 로그인을 수행한 것으로 본다.
 */
export function buildsLoginState(steps: object[]): boolean {
  return steps.some((step) => {
    const target = (step as { target?: Record<string, unknown> }).target;
    return target?.field === "password";
  });
}

/**
 * 계약의 사전 상태가 "데이터가 이미 있는 상태"를 요구하는지 본다.
 * 비어 있어야 하는 조건(빈 상태 확인)은 데이터를 만들면 안 되므로 제외한다.
 */
export function requiresExistingData(precondition?: string): boolean {
  const text = (precondition ?? "").replace(/\s/g, "");
  if (!text) return false;
  if (/없는상태|없음|비어있|하나도없/.test(text)) return false;
  return /존재|있는상태|등록된|생성된|추가된|담긴/.test(text);
}

/**
 * 조합이 화면에서 데이터를 직접 만드는지 본다.
 * 로그인 자격증명이 아닌 값을 입력한 뒤 누르는 단계가 있으면 만든 것으로 본다.
 */
export function buildsData(steps: object[]): boolean {
  const fillIndex = steps.findIndex((step) => {
    const typed = step as { atom: string; target?: Record<string, unknown> };
    return typed.atom === "fill" && typed.target?.field === undefined;
  });
  if (fillIndex < 0) return false;
  return steps.slice(fillIndex + 1).some((step) => (step as { atom: string }).atom === "click");
}

function truncate(value: string | undefined): string {
  const text = (value ?? "").trim();
  return text.length > 60 ? `${text.slice(0, 60)}…` : text || "(빈 값)";
}

/** 어떤 문구가 근거 없이 등장했는지 찾아 진단에 남긴다. */
function ungroundedClaim(atom: object, grounding: string): string {
  const step = atom as { contains?: string; target?: Record<string, unknown> };
  const claims = [step.contains, step.target?.name, step.target?.text, step.target?.label];
  for (const claim of claims) {
    if (typeof claim !== "string" || claim.length === 0) continue;
    if (!grounding.includes(normalizeForGrounding(claim))) return claim;
  }
  return "(확인 불가)";
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
    case "fill": {
      if (!target) return null;
      if (isUnnamedRole(target)) return null;
      // 제출 버튼은 값을 넣는 대상이 아니다. 실제로 모델이 여기에 fill 을 골라
      // 하네스가 버튼에 입력을 시도하다 실패했고, 정상 앱이 오류로 판정됐다.
      if ((target as { field?: string }).field === "submit") return null;
      const value = toValue(step);
      return value ? { atom: "fill", target, value } : null;
    }
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
    case "click": {
      // 이름 없는 역할 대상은 화면의 첫 번째 요소를 누른다. 버튼이 둘 이상인
      // 화면에서는 무엇을 눌렀는지 정해지지 않으므로 검증으로 성립하지 않는다.
      // 실측에서 로그아웃 버튼이 먼저 있는 화면에 대해 조합이 `click(role=button)`
      // 을 골랐고, 세션이 끊긴 채로 확인이 진행돼 정상 앱이 실패로 판정됐다.
      if (target && isUnnamedRole(target)) return null;
      return target ? { atom: "click", target } : null;
    }
    case "expect_visible":
    case "expect_hidden":
    case "expect_enabled":
    case "expect_disabled":
    case "expect_focused":
    case "expect_within_viewport":
    case "expect_form_blocked": {
      if (!target) return null;
      // 제출이 막히는 것은 입력값 검증의 결과이므로 그 입력란에서 확인해야 한다.
      // 제출 버튼 자체는 언제나 유효하므로 이 확인이 항상 실패한다.
      if (step.atom === "expect_form_blocked" && (target as { field?: string }).field === "submit") return null;
      // 일곱 개 단언을 한 블록에서 처리하면서 돌려주는 atom 이름을
      // "expect_form_blocked"로 고정해 두었다. 그래서 expect_visible·expect_hidden·
      // expect_disabled 등이 전부 제출 차단 검사로 바뀌어 저장됐고, 정상 결과물이
      // 실패로 판정됐다. 고른 동작을 그대로 돌려준다.
      return { atom: step.atom, target };
    }
    case "expect_checked":
    case "expect_unchecked":
      return target ? { atom: step.atom, target } : null;
    default:
      return null;
  }
}

/**
 * 허용된 어휘만 대상으로 옮긴다.
 *
 * 값이 어휘에 없으면 여기서 null을 돌려 조합 전체를 버린다. 비슷한 것으로
 * 바꿔치기하지 않는다. 예를 들어 `field=companyName`을 `label="companyName"`으로
 * 고쳐 쓰면 한국어 라벨("회사명")과 맞지 않아 정상 앱을 실패로 판정한다.
 * 판정하지 못하는 것보다 잘못 판정하는 것이 나쁘다(CLAUDE.md §11).
 */
/**
 * 이름 없이 역할만 지정한 대상인지 본다.
 *
 * 조작(누르기·입력)에는 무엇을 조작하는지가 정해져야 한다. 확인 동작은 다르다.
 * `expect_count(role=listitem)`처럼 같은 역할의 요소를 한꺼번에 세는 것이 목적일
 * 수 있으므로 이름 없는 역할을 그대로 허용한다.
 */
function isUnnamedRole(target: object): boolean {
  const typed = target as { role?: string; name?: string };
  return typeof typed.role === "string" && !typed.name?.trim();
}

function toTarget(step: FlatStep): object | null {
  switch (step.targetKind) {
    case "field":
      return UI_SEMANTIC_FIELDS.includes(step.targetField as never) ? { field: step.targetField } : null;
    case "role": {
      if (!UI_TARGET_ROLES.includes(step.targetRole as never)) return null;
      const name = step.targetName?.trim();
      return name ? { role: step.targetRole, name } : { role: step.targetRole };
    }
    case "label":
    case "text":
    case "placeholder":
    case "testId": {
      const text = step.targetText?.trim();
      return text ? { [step.targetKind]: text } : null;
    }
    default:
      return null;
  }
}

function toValue(step: FlatStep): object | null {
  if (step.valueKind === "ref") {
    return UI_CREDENTIAL_REFS.includes(step.value as never) ? { ref: step.value } : null;
  }
  return step.value.length > 0 ? { literal: step.value } : null;
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
