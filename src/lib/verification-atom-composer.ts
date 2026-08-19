import "server-only";

import OpenAI from "openai";

import {
  MANAGED_API_CHECK_SPEC_VERSION,
  MANAGED_BROWSER_SPEC_VERSION_V2,
  parseManagedApiCheckTestSpec,
  parseManagedBrowserAtomTestSpec,
  UI_CREDENTIAL_REFS,
  UI_PRESS_KEYS,
  UI_SEMANTIC_FIELDS,
  UI_TARGET_ROLES,
  UI_VIEWPORT_PRESETS,
  type ManagedApiCheckTestSpec,
  type ManagedBrowserAtomTestSpec,
} from "@/lib/verification-test-spec";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_COMPOSE_BATCH = 20;

const ATOM_NAMES = [
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
] as const;

const TARGET_KINDS = ["field", "role", "label", "text", "placeholder", "testId", "none"] as const;
const VALUE_KINDS = ["ref", "literal", "none"] as const;

const DEFAULT_CREDENTIALS = {
  email: "test@example.com",
  password: "Test1234!",
  invalidPassword: "wrong-password",
} as const;

/**
 * LLM이 고른 atom 조합. 판정 로직은 고정된 코드(하네스)에 있고, 여기서는
 * "어떤 atom을 어떤 순서로 쓸지"만 받는다. 실행 코드나 selector는 받지 않는다.
 */
interface FlatStep {
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
}

interface FlatApiStep {
  method: string;
  path: string;
  bodyJson: string;
  expectStatus: number;
}

interface FlatItem {
  automatable: string;
  startPath: string;
  steps: FlatStep[];
  apiSteps: FlatApiStep[];
}

export type ComposedSpec = ManagedBrowserAtomTestSpec | ManagedApiCheckTestSpec;

export interface ComposeOutcome {
  spec: ComposedSpec | null;
  /** null 사유. 갭 로그에 남겨 어휘 부족과 스키마 오류를 구분한다. */
  reason?: "no_api_key" | "llm_failed" | "llm_declined" | "schema_rejected";
}

/**
 * 정규식 프리셋에 매칭되지 않은 DoD를 atom 조합으로 표현해 본다.
 * 반드시 엄격 파서를 통과한 조합만 채택하며, 실패하면 null을 돌려 호출자가
 * 기존대로 manual + 사람 확인 안내로 처리하게 한다.
 */
export async function composeVerificationAtoms(
  descriptions: string[],
): Promise<ComposeOutcome[]> {
  if (descriptions.length === 0) return [];
  if (!process.env.OPENAI_API_KEY) {
    return descriptions.map(() => ({ spec: null, reason: "no_api_key" as const }));
  }

  const bounded = descriptions.slice(0, MAX_COMPOSE_BATCH);

  let items: FlatItem[];
  try {
    const completion = await openai.chat.completions.parse({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content:
            "아래 완료 조건(DoD)마다 자동 검증 조합을 작성하세요.\n\n" +
            bounded.map((description, index) => `${index + 1}. ${description}`).join("\n"),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "verification_atom_composition", schema: buildSchema(), strict: true },
      },
      temperature: 0,
    });

    const parsed = completion.choices[0].message.parsed as { items: FlatItem[] } | null;
    if (!parsed || !Array.isArray(parsed.items) || parsed.items.length !== bounded.length) {
      return descriptions.map(() => ({ spec: null, reason: "llm_failed" as const }));
    }
    items = parsed.items;
  } catch (error) {
    console.error("[verification-atom-composer] LLM composition failed", error);
    return descriptions.map(() => ({ spec: null, reason: "llm_failed" as const }));
  }

  const outcomes = items.map((item) => normalizeAndValidate(item));
  return descriptions.map((_, index) => outcomes[index] ?? { spec: null, reason: "llm_failed" as const });
}

function normalizeAndValidate(item: FlatItem): ComposeOutcome {
  if (item.automatable === "none") return { spec: null, reason: "llm_declined" };

  if (item.automatable === "api") {
    const steps = (item.apiSteps ?? []).map((step) => ({
      method: step.method,
      path: step.path,
      expectStatus: step.expectStatus,
      ...(parseBody(step.bodyJson) ? { body: parseBody(step.bodyJson) } : {}),
    }));
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
  const steps: object[] = [];
  for (const rawStep of item.steps ?? []) {
    const atom = toAtom(rawStep);
    if (!atom) return { spec: null, reason: "schema_rejected" };
    steps.push(atom);
  }
  // 동작만 있고 확인이 없는 조합은 무엇도 검증하지 못하므로 채택하지 않는다.
  if (!steps.some((atom) => String((atom as { atom: string }).atom).startsWith("expect_"))) {
    return { spec: null, reason: "schema_rejected" };
  }

  const spec = parseManagedBrowserAtomTestSpec({
    version: MANAGED_BROWSER_SPEC_VERSION_V2,
    kind: "managed_browser",
    startPath: item.startPath,
    steps,
    syntheticCredentials: { ...DEFAULT_CREDENTIALS },
  });
  return spec ? { spec } : { spec: null, reason: "schema_rejected" };
}

function toAtom(step: FlatStep): object | null {
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
    case "expect_text":
      return target
        ? { atom: "expect_text", contains: step.contains, target }
        : { atom: "expect_text", contains: step.contains };
    case "fill":
      return target ? { atom: "fill", target, value: toValue(step) } : null;
    case "click":
    case "expect_visible":
    case "expect_hidden":
    case "expect_enabled":
    case "expect_disabled":
    case "expect_focused":
    case "expect_within_viewport":
    case "expect_form_blocked":
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

function buildSystemPrompt(): string {
  return [
    "당신은 웹 서비스 완료 조건(DoD)을 자동 검증 가능한 동작 조합으로 옮기는 도구입니다.",
    "당신은 코드를 작성하지 않습니다. 정해진 동작(atom) 목록에서 골라 순서대로 나열하기만 합니다.",
    "",
    "검증 대상 앱은 격리 환경에서 실행되며 합성 계정만 사용합니다:",
    `  이메일=${DEFAULT_CREDENTIALS.email}, 비밀번호=${DEFAULT_CREDENTIALS.password}, 잘못된 비밀번호=${DEFAULT_CREDENTIALS.invalidPassword}`,
    "값을 넣을 때는 valueKind=ref 와 value=email|password|invalidPassword 를 사용하세요.",
    "",
    "가장 중요한 규칙: 확신이 없으면 automatable=none 을 선택하세요.",
    "DoD 문장만으로 어느 화면(startPath)인지, 어떤 요소인지 확실히 알 수 없으면 none 입니다.",
    "틀린 조합은 멀쩡한 결과물을 '실패'로 잘못 판정해 프리랜서에게 부당한 수정 요청을 만듭니다.",
    "판정을 못 내리는 것보다 잘못 내리는 것이 훨씬 나쁩니다.",
    "",
    "automatable=none 을 선택해야 하는 경우:",
    "- 주관적 판단(디자인이 깔끔하다, 색상이 브랜드와 어울린다)",
    "- 성능·속도(응답이 1초 이내다) — 이 도구는 시간을 측정하지 않습니다",
    "- 서버 로그·내부 저장 상태(비밀번호가 로그에 남지 않는다)",
    "- 외부 발송(이메일·SMS가 실제로 도착한다) — 격리 환경은 외부 통신이 차단됩니다",
    "- 미리 심어둔 데이터가 있어야 확인 가능한 조건(오늘 접수된 목록이 보인다)",
    "- 특정 시각·날짜에 의존하는 조건",
    "",
    "automatable=ui: 브라우저에서 보고 조작해 확인할 수 있는 경우. steps 를 채우고 apiSteps 는 비웁니다.",
    "- '버튼이 동작하지 않는다', '로그인이 되지 않는다' 등 제출 차단/실패 조건은 버튼 자체의 disabled 속성(expect_disabled)을 함부로 추정하지 마세요. 버튼은 클릭 가능하지만 제출이 차단되는 것이 일반적입니다.",
    "- expect_path 는 '어딘가로 이동하지 않았다'만 증명하며 '왜' 이동하지 않았는지는 증명하지 못합니다. 잘못된 비밀번호처럼 원인이 다른 실패도 같은 경로에 남기 때문에, expect_path 단독으로는 서로 다른 두 DoD('이메일이 없으면 막힌다'와 '비밀번호가 틀리면 막힌다')를 구분하지 못하고 둘 다 통과시켜 버립니다.",
    "- 특정 입력란이 비어 있거나 형식이 틀려서 제출이 막히는 조건(예: '이메일을 입력하지 않으면 로그인이 되지 않는다')은 반드시 그 입력란 자체에 expect_form_blocked 를 사용하세요. expect_path 는 보조 단언으로만 추가하고, 단독으로 쓰지 마세요.",
    "- 서버 응답에 따라 화면에 문구가 뜨는 조건(예: '비밀번호가 틀리면 오류가 표시된다')은 expect_error_feedback 을 사용하세요.",
    "- 페이지가 열린 직후에는 어떤 요소도 키보드 포커스를 갖고 있지 않습니다. expect_focused 로 특정 요소의 포커스를 확인하려면, 그 요소로 포커스가 이동하도록 만드는 press(Tab 등) 단계가 반드시 그 앞에 먼저 있어야 합니다. press 없이 곧바로 expect_focused 를 쓰면 항상 실패합니다.",
    "automatable=api: HTTP 요청과 응답 상태 코드로 확인하는 것이 더 안정적인 경우(횟수 제한, 중복 차단 등). apiSteps 를 채우고 steps 는 비웁니다.",
    "",
    "사용하지 않는 필드는 빈 문자열(숫자는 0)로 두세요.",
    "expect_text 의 contains 에는 화면에 실제로 보일 문구만 넣으세요. 확실하지 않으면 automatable=none 입니다.",
  ].join("\n");
}

function buildSchema(): Record<string, unknown> {
  const stepSchema = {
    type: "object",
    properties: {
      atom: { type: "string", enum: [...ATOM_NAMES], description: "수행할 동작" },
      targetKind: {
        type: "string",
        enum: [...TARGET_KINDS],
        description: "대상 지정 방식. field=미리 정의된 로그인 요소, role=접근성 역할, 없으면 none",
      },
      targetValue: {
        type: "string",
        description: `targetKind=field면 ${UI_SEMANTIC_FIELDS.join("|")}, targetKind=role이면 ${UI_TARGET_ROLES.join("|")} 중 하나. 그 외에는 찾을 라벨·문구·placeholder·테스트ID 문자열`,
      },
      targetName: { type: "string", description: "targetKind=role일 때 버튼·링크에 보이는 이름. 없으면 빈 문자열" },
      valueKind: { type: "string", enum: [...VALUE_KINDS], description: "fill에서만 사용" },
      value: { type: "string", description: `valueKind=ref면 ${UI_CREDENTIAL_REFS.join("|")} 중 하나` },
      path: { type: "string", description: "goto·expect_path에서 사용하는 / 로 시작하는 경로" },
      contains: { type: "string", description: "expect_text에서 화면에 보여야 할 문구" },
      key: { type: "string", enum: ["", ...UI_PRESS_KEYS], description: "press에서 누를 키" },
      viewport: { type: "string", enum: ["", ...UI_VIEWPORT_PRESETS], description: "set_viewport에서 쓸 화면 크기" },
    },
    required: [
      "atom",
      "targetKind",
      "targetValue",
      "targetName",
      "valueKind",
      "value",
      "path",
      "contains",
      "key",
      "viewport",
    ],
    additionalProperties: false,
  };

  const apiStepSchema = {
    type: "object",
    properties: {
      method: { type: "string", enum: ["GET", "POST"] },
      path: { type: "string", description: "/ 로 시작하는 API 경로" },
      bodyJson: { type: "string", description: "요청 본문을 문자열 값만 가진 JSON 문자열로. 없으면 빈 문자열" },
      expectStatus: { type: "integer", description: "기대하는 HTTP 상태 코드" },
    },
    required: ["method", "path", "bodyJson", "expectStatus"],
    additionalProperties: false,
  };

  return {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: "입력한 DoD와 같은 순서, 같은 개수",
        items: {
          type: "object",
          properties: {
            automatable: {
              type: "string",
              enum: ["ui", "api", "none"],
              description: "확신이 없으면 반드시 none",
            },
            startPath: { type: "string", description: "automatable=ui일 때 시작 화면 경로. 그 외에는 빈 문자열" },
            steps: { type: "array", items: stepSchema },
            apiSteps: { type: "array", items: apiStepSchema },
          },
          required: ["automatable", "startPath", "steps", "apiSteps"],
          additionalProperties: false,
        },
      },
    },
    required: ["items"],
    additionalProperties: false,
  };
}
