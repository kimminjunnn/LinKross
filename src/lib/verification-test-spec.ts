import type { VerificationMethod } from "@/lib/backend/contracts";

export const MANAGED_BROWSER_SPEC_VERSION = 1 as const;

export const MANAGED_BROWSER_PRESETS = [
  "login_fields",
  "login_success",
  "login_invalid_password",
  "login_email_required",
] as const;

export type ManagedBrowserPreset = (typeof MANAGED_BROWSER_PRESETS)[number];

export interface ManagedBrowserTestSpec {
  version: typeof MANAGED_BROWSER_SPEC_VERSION;
  kind: "managed_browser";
  preset: ManagedBrowserPreset;
  startPath: string;
  expectedPath?: string;
  syntheticCredentials: {
    email: string;
    password: string;
    invalidPassword: string;
  };
}

export const MANAGED_API_CHECK_SPEC_VERSION = 1 as const;
const MANAGED_API_CHECK_METHODS = ["GET", "POST"] as const;
const MAX_API_CHECK_STEPS = 10;

export interface ManagedApiCheckStep {
  method: (typeof MANAGED_API_CHECK_METHODS)[number];
  path: string;
  body?: Record<string, string>;
  expectStatus: number;
}

export interface ManagedApiCheckTestSpec {
  version: typeof MANAGED_API_CHECK_SPEC_VERSION;
  kind: "api_check";
  steps: ManagedApiCheckStep[];
}

export const MANAGED_BROWSER_SPEC_VERSION_V2 = 2 as const;

/**
 * 어휘 세대 v3: 선택 상태·개수·목록 내용 확인을 추가했다(설계 §21.3).
 * 새 조합은 v3으로 기록하고, 이미 저장된 v2 조합도 그대로 실행한다.
 */
export const MANAGED_BROWSER_SPEC_VERSION_V3 = 3 as const;

const SUPPORTED_ATOM_SPEC_VERSIONS = [
  MANAGED_BROWSER_SPEC_VERSION_V2,
  MANAGED_BROWSER_SPEC_VERSION_V3,
] as const;

export const MAX_ATOM_STEPS = 24;
const MAX_ATOM_TEXT = 200;
const MAX_ATOM_COUNT = 100;

export const UI_TARGET_ROLES = [
  "textbox",
  "button",
  "link",
  "checkbox",
  "radio",
  "combobox",
  "heading",
  "alert",
  "img",
  "list",
  "listitem",
  "dialog",
  "table",
] as const;

export const UI_PRESS_KEYS = ["Enter", "Tab", "Shift+Tab", "Escape", "Space", "ArrowDown", "ArrowUp"] as const;

export const UI_VIEWPORT_PRESETS = ["mobile", "tablet", "desktop"] as const;

export const UI_SEMANTIC_FIELDS = ["email", "password", "submit"] as const;

export const UI_CREDENTIAL_REFS = ["email", "password", "invalidPassword"] as const;

export type UiTarget =
  | { field: (typeof UI_SEMANTIC_FIELDS)[number] }
  | { role: (typeof UI_TARGET_ROLES)[number]; name?: string }
  | { label: string }
  | { text: string }
  | { placeholder: string }
  | { testId: string };

export type UiValue =
  | { ref: (typeof UI_CREDENTIAL_REFS)[number] }
  | { literal: string };

export type UiAtom =
  | { atom: "goto"; path: string }
  | { atom: "fill"; target: UiTarget; value: UiValue }
  /** 드롭다운(`<select>`)에서 항목을 고른다. 값은 옵션의 표시 문구를 먼저, 없으면 value를 찾는다. */
  | { atom: "select_option"; target: UiTarget; value: UiValue }
  | { atom: "click"; target: UiTarget }
  | { atom: "press"; key: (typeof UI_PRESS_KEYS)[number] }
  | { atom: "set_viewport"; preset: (typeof UI_VIEWPORT_PRESETS)[number] }
  | { atom: "expect_visible"; target: UiTarget }
  | { atom: "expect_hidden"; target: UiTarget }
  | { atom: "expect_enabled"; target: UiTarget }
  | { atom: "expect_disabled"; target: UiTarget }
  | { atom: "expect_focused"; target: UiTarget }
  | { atom: "expect_text"; contains: string; target?: UiTarget }
  | { atom: "expect_path"; path: string }
  | { atom: "expect_within_viewport"; target: UiTarget }
  | { atom: "expect_error_feedback" }
  | { atom: "expect_form_blocked"; target: UiTarget }
  | { atom: "expect_checked"; target: UiTarget }
  | { atom: "expect_unchecked"; target: UiTarget }
  | { atom: "expect_count"; target: UiTarget; count: number }
  | { atom: "expect_every_text"; contains: string; target: UiTarget }
  | { atom: "expect_none_text"; contains: string; target: UiTarget };

export interface ManagedBrowserAtomTestSpec {
  version: typeof MANAGED_BROWSER_SPEC_VERSION_V2 | typeof MANAGED_BROWSER_SPEC_VERSION_V3;
  kind: "managed_browser";
  startPath: string;
  steps: UiAtom[];
  syntheticCredentials: {
    email: string;
    password: string;
    invalidPassword: string;
  };
}

export type ManagedTestSpec =
  | ManagedBrowserTestSpec
  | ManagedBrowserAtomTestSpec
  | ManagedApiCheckTestSpec;

export const MANUAL_GUIDANCE_SPEC_VERSION = 1 as const;

export interface ManualGuidanceSpec {
  version: typeof MANUAL_GUIDANCE_SPEC_VERSION;
  kind: "manual_guidance";
  location: string;
  method: string;
  expected: string;
}

const DEFAULT_CREDENTIALS = {
  email: "test@example.com",
  password: "Test1234!",
  invalidPassword: "wrong-password",
} as const;

export function createMvpVerificationDefinition(description: string): {
  verificationMethod: VerificationMethod;
  testSpec: ManagedTestSpec | Record<string, never>;
} {
  const preset = inferLoginPreset(description);
  if (preset) {
    return {
      verificationMethod: "automated_e2e",
      testSpec: {
        version: MANAGED_BROWSER_SPEC_VERSION,
        kind: "managed_browser",
        preset,
        startPath: "/login",
        ...(preset === "login_success" ? { expectedPath: "/dashboard" } : {}),
        syntheticCredentials: { ...DEFAULT_CREDENTIALS },
      },
    };
  }

  // 계정 잠금 조건은 프리셋으로 판정하지 않는다. 아래를 참고.
  return { verificationMethod: "manual", testSpec: {} };
}

/**
 * 계정 잠금 조건("N회 연속 실패하면 잠긴다")은 프리셋으로 판정하지 않는다.
 *
 * 예전에는 5회 실패 뒤 6번째 요청이 429를 반환한다고 가정한 고정 시퀀스를
 * 만들었다. 두 가지가 잘못됐다.
 *
 * 1. 임계값과 해석을 LinKross가 발명했다. "5회 연속 실패하면 잠긴다"는 5번째
 *    응답 자체가 차단인지, 5번 실패 후 6번째부터 차단인지 정하지 않는다.
 *    합의되지 않은 기준으로 프리랜서의 정상 구현을 실패로 판정했다.
 * 2. 실패 횟수가 0에서 시작하지 않는다. 같은 실행에서 브라우저 검수가 먼저
 *    돌며 틀린 비밀번호로 로그인을 시도하고, 그 서버를 그대로 이어 쓴다.
 *    실제로 같은 저장소가 통과와 실패를 오갔다.
 *
 * 이제 이런 조건은 atom 조합 단계로 넘어가고, 표현할 수 없으면 사람 확인으로
 * 남는다. 판정하지 못하는 것이 잘못 판정하는 것보다 낫다.
 */
export function resolveMvpVerificationDefinition(input: {
  description: string;
  verificationMethod: VerificationMethod;
  testSpec: unknown;
}): {
  verificationMethod: VerificationMethod;
  testSpec: ManagedTestSpec | null;
} {
  const storedApiSpec = parseManagedApiCheckTestSpec(input.testSpec);
  if (storedApiSpec) {
    return { verificationMethod: input.verificationMethod, testSpec: storedApiSpec };
  }

  const storedAtomSpec = parseManagedBrowserAtomTestSpec(input.testSpec);
  if (storedAtomSpec) {
    return { verificationMethod: input.verificationMethod, testSpec: storedAtomSpec };
  }

  const storedSpec = parseManagedBrowserTestSpec(input.testSpec);
  if (storedSpec) {
    return { verificationMethod: input.verificationMethod, testSpec: storedSpec };
  }

  const inferred = createMvpVerificationDefinition(input.description);
  const inferredSpec = parseManagedBrowserTestSpec(inferred.testSpec);
  if (inferred.verificationMethod === "automated_e2e" && inferredSpec) {
    return { verificationMethod: "automated_e2e", testSpec: inferredSpec };
  }
  return { verificationMethod: input.verificationMethod, testSpec: null };
}

export function parseManagedApiCheckTestSpec(value: unknown): ManagedApiCheckTestSpec | null {
  if (!isRecord(value)) return null;
  if (
    value.version !== MANAGED_API_CHECK_SPEC_VERSION ||
    value.kind !== "api_check" ||
    !Array.isArray(value.steps) ||
    value.steps.length === 0 ||
    value.steps.length > MAX_API_CHECK_STEPS
  ) {
    return null;
  }

  const steps: ManagedApiCheckStep[] = [];
  for (const rawStep of value.steps) {
    if (!isRecord(rawStep)) return null;
    if (!MANAGED_API_CHECK_METHODS.includes(rawStep.method as never)) return null;
    if (!isSafePath(rawStep.path)) return null;
    if (
      typeof rawStep.expectStatus !== "number" ||
      !Number.isInteger(rawStep.expectStatus) ||
      rawStep.expectStatus < 100 ||
      rawStep.expectStatus > 599
    ) {
      return null;
    }
    let body: Record<string, string> | undefined;
    if (rawStep.body !== undefined) {
      if (!isRecord(rawStep.body)) return null;
      body = {};
      for (const [key, val] of Object.entries(rawStep.body)) {
        const boundedKey = boundedText(key, 100);
        const boundedValue = boundedText(val, 500);
        if (!boundedKey || boundedValue === null) return null;
        body[boundedKey] = boundedValue;
      }
    }
    steps.push({
      method: rawStep.method as ManagedApiCheckStep["method"],
      path: rawStep.path,
      expectStatus: rawStep.expectStatus,
      ...(body ? { body } : {}),
    });
  }

  return { version: MANAGED_API_CHECK_SPEC_VERSION, kind: "api_check", steps };
}

export function parseManagedBrowserTestSpec(value: unknown): ManagedBrowserTestSpec | null {
  if (!isRecord(value)) return null;
  if (
    value.version !== MANAGED_BROWSER_SPEC_VERSION ||
    value.kind !== "managed_browser" ||
    !MANAGED_BROWSER_PRESETS.includes(value.preset as ManagedBrowserPreset) ||
    !isSafePath(value.startPath)
  ) {
    return null;
  }
  if (value.expectedPath !== undefined && !isSafePath(value.expectedPath)) return null;
  if (!isRecord(value.syntheticCredentials)) return null;

  const email = boundedText(value.syntheticCredentials.email, 254);
  const password = boundedText(value.syntheticCredentials.password, 200);
  const invalidPassword = boundedText(value.syntheticCredentials.invalidPassword, 200);
  if (!email || !password || !invalidPassword) return null;

  return {
    version: MANAGED_BROWSER_SPEC_VERSION,
    kind: "managed_browser",
    preset: value.preset as ManagedBrowserPreset,
    startPath: value.startPath,
    ...(typeof value.expectedPath === "string" ? { expectedPath: value.expectedPath } : {}),
    syntheticCredentials: { email, password, invalidPassword },
  };
}

export function parseManagedBrowserAtomTestSpec(value: unknown): ManagedBrowserAtomTestSpec | null {
  if (!isRecord(value)) return null;
  if (
    !SUPPORTED_ATOM_SPEC_VERSIONS.includes(value.version as never) ||
    value.kind !== "managed_browser" ||
    !isSafePath(value.startPath) ||
    !Array.isArray(value.steps) ||
    value.steps.length === 0 ||
    value.steps.length > MAX_ATOM_STEPS ||
    !isRecord(value.syntheticCredentials)
  ) {
    return null;
  }

  const email = boundedText(value.syntheticCredentials.email, 254);
  const password = boundedText(value.syntheticCredentials.password, 200);
  const invalidPassword = boundedText(value.syntheticCredentials.invalidPassword, 200);
  if (!email || !password || !invalidPassword) return null;

  const steps: UiAtom[] = [];
  for (const rawStep of value.steps) {
    const step = parseUiAtom(rawStep);
    if (!step) return null;
    steps.push(step);
  }

  return {
    version: value.version as ManagedBrowserAtomTestSpec["version"],
    kind: "managed_browser",
    startPath: value.startPath,
    steps,
    syntheticCredentials: { email, password, invalidPassword },
  };
}

/**
 * 단일 atom을 엄격 규칙으로 검사한다.
 *
 * 조합 단계가 어느 step 때문에 스펙 전체를 버렸는지 짚으려면 같은 규칙을
 * step 하나에도 적용할 수 있어야 한다. 판정 규칙은 여기 하나뿐이며 진단이
 * 별도 사본을 갖지 않게 하려고 공개한다.
 */
export function parseUiAtom(value: unknown): UiAtom | null {
  if (!isRecord(value)) return null;

  switch (value.atom) {
    case "goto":
    case "expect_path": {
      if (!isSafePath(value.path)) return null;
      return { atom: value.atom, path: value.path };
    }
    case "fill":
    case "select_option": {
      const target = parseUiTarget(value.target);
      const fillValue = parseUiValue(value.value);
      return target && fillValue ? { atom: value.atom, target, value: fillValue } : null;
    }
    case "press": {
      return UI_PRESS_KEYS.includes(value.key as never)
        ? { atom: "press", key: value.key as (typeof UI_PRESS_KEYS)[number] }
        : null;
    }
    case "set_viewport": {
      return UI_VIEWPORT_PRESETS.includes(value.preset as never)
        ? { atom: "set_viewport", preset: value.preset as (typeof UI_VIEWPORT_PRESETS)[number] }
        : null;
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
    case "expect_unchecked": {
      const target = parseUiTarget(value.target);
      return target ? { atom: value.atom, target } : null;
    }
    case "expect_count": {
      const target = parseUiTarget(value.target);
      if (!target) return null;
      // 개수는 판정을 좌우하므로 정수와 상한을 엄격히 본다.
      if (
        typeof value.count !== "number" ||
        !Number.isInteger(value.count) ||
        value.count < 0 ||
        value.count > MAX_ATOM_COUNT
      ) return null;
      return { atom: "expect_count", target, count: value.count };
    }
    case "expect_every_text":
    case "expect_none_text": {
      const contains = boundedText(value.contains, MAX_ATOM_TEXT);
      const target = parseUiTarget(value.target);
      return contains && target ? { atom: value.atom, contains, target } : null;
    }
    case "expect_text": {
      const contains = boundedText(value.contains, MAX_ATOM_TEXT);
      if (!contains) return null;
      if (value.target === undefined) return { atom: "expect_text", contains };
      const target = parseUiTarget(value.target);
      return target ? { atom: "expect_text", contains, target } : null;
    }
    case "expect_error_feedback":
      return { atom: "expect_error_feedback" };
    default:
      return null;
  }
}

function parseUiTarget(value: unknown): UiTarget | null {
  if (!isRecord(value)) return null;

  if (typeof value.field === "string") {
    return UI_SEMANTIC_FIELDS.includes(value.field as never)
      ? { field: value.field as (typeof UI_SEMANTIC_FIELDS)[number] }
      : null;
  }
  if (typeof value.role === "string") {
    if (!UI_TARGET_ROLES.includes(value.role as never)) return null;
    const role = value.role as (typeof UI_TARGET_ROLES)[number];
    if (value.name === undefined) return { role };
    const name = boundedText(value.name, MAX_ATOM_TEXT);
    return name ? { role, name } : null;
  }
  for (const key of ["label", "text", "placeholder", "testId"] as const) {
    if (typeof value[key] === "string") {
      const text = boundedText(value[key], MAX_ATOM_TEXT);
      return text ? ({ [key]: text } as UiTarget) : null;
    }
  }
  return null;
}

function parseUiValue(value: unknown): UiValue | null {
  if (!isRecord(value)) return null;
  if (typeof value.ref === "string") {
    return UI_CREDENTIAL_REFS.includes(value.ref as never)
      ? { ref: value.ref as (typeof UI_CREDENTIAL_REFS)[number] }
      : null;
  }
  if (typeof value.literal === "string") {
    const literal = boundedText(value.literal, MAX_ATOM_TEXT);
    return literal ? { literal } : null;
  }
  return null;
}

export function compileManagedBrowserSpecToAtoms(
  spec: ManagedBrowserTestSpec | ManagedBrowserAtomTestSpec,
): ManagedBrowserAtomTestSpec {
  if (spec.version !== MANAGED_BROWSER_SPEC_VERSION) return spec;

  const email: UiTarget = { field: "email" };
  const password: UiTarget = { field: "password" };
  const submit: UiTarget = { field: "submit" };

  const steps: UiAtom[] = (() => {
    switch (spec.preset) {
      case "login_fields":
        return [
          { atom: "expect_visible", target: email },
          { atom: "expect_enabled", target: email },
          { atom: "expect_visible", target: password },
          { atom: "expect_enabled", target: password },
          { atom: "expect_visible", target: submit },
          { atom: "expect_enabled", target: submit },
        ];
      case "login_success":
        return [
          { atom: "fill", target: email, value: { ref: "email" } },
          { atom: "fill", target: password, value: { ref: "password" } },
          { atom: "click", target: submit },
          { atom: "expect_path", path: spec.expectedPath || "/dashboard" },
        ];
      case "login_invalid_password":
        return [
          { atom: "fill", target: email, value: { ref: "email" } },
          { atom: "fill", target: password, value: { ref: "invalidPassword" } },
          { atom: "click", target: submit },
          { atom: "expect_path", path: spec.startPath },
          { atom: "expect_error_feedback" },
        ];
      case "login_email_required":
      default:
        return [
          { atom: "fill", target: password, value: { ref: "password" } },
          { atom: "click", target: submit },
          { atom: "expect_path", path: spec.startPath },
          { atom: "expect_form_blocked", target: email },
        ];
    }
  })();

  return {
    version: MANAGED_BROWSER_SPEC_VERSION_V2,
    kind: "managed_browser",
    startPath: spec.startPath,
    steps,
    syntheticCredentials: { ...spec.syntheticCredentials },
  };
}

export function parseManualGuidanceSpec(value: unknown): ManualGuidanceSpec | null {
  if (!isRecord(value)) return null;
  if (value.version !== MANUAL_GUIDANCE_SPEC_VERSION || value.kind !== "manual_guidance") return null;

  const location = boundedText(value.location, 300);
  const method = boundedText(value.method, 300);
  const expected = boundedText(value.expected, 300);
  if (!location || !method || !expected) return null;

  return { version: MANUAL_GUIDANCE_SPEC_VERSION, kind: "manual_guidance", location, method, expected };
}

function inferLoginPreset(description: string): ManagedBrowserPreset | null {
  const normalized = description.toLowerCase().replace(/[`'"“”‘’]/g, "").replace(/\s+/g, " ").trim();
  const mentionsEmail = /이메일|email/.test(normalized);
  const mentionsPassword = /비밀번호|password/.test(normalized);
  // "이메일/비밀번호 입력"만 언급해도 로그인 성공·실패 같은 결과를 주장하는 문장이
  // login_fields(입력란 표시 여부만 확인)로 잘못 채가는 걸 막는다. 결과 단어가 있으면
  // 그 결과를 실제로 검증하는 프리셋이거나, 없으면 atom 컴포저로 넘긴다.
  const mentionsOutcome = /성공|이동|리다이렉트|redirect|navigat/.test(normalized);

  if (mentionsEmail && mentionsPassword && /입력|enter|fill|type/.test(normalized) && !mentionsOutcome) {
    return "login_fields";
  }
  if (/dashboard|대시보드/.test(normalized) && /로그인|login|sign in/.test(normalized)) {
    return "login_success";
  }
  if (mentionsPassword && /잘못|invalid|incorrect|wrong|오류|error/.test(normalized)) {
    return "login_invalid_password";
  }
  if (mentionsEmail && /미입력|비어|empty|required|누락|without/.test(normalized)) {
    return "login_email_required";
  }
  return null;
}

export function isSafePath(value: unknown): value is string {
  return typeof value === "string" && /^\/(?!\/)[^\s?#]{0,500}$/.test(value);
}

function boundedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maxLength ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
