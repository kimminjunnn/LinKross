import "server-only";

import OpenAI from "openai";

import {
  ATOM_NAMES,
  DEFAULT_CREDENTIALS,
  TARGET_KINDS,
  VALUE_KINDS,
  normalizeComposedItem,
  type ComposeOutcome,
  type ComposedSpec,
  type FlatItem,
} from "@/lib/dod-atom-composition";
import { contractToCompositionBrief } from "@/lib/dod-test-contract";
import type { DodTestContract } from "@/lib/backend/contracts";
import {
  MAX_ATOM_STEPS,
  UI_CREDENTIAL_REFS,
  UI_PRESS_KEYS,
  UI_SEMANTIC_FIELDS,
  UI_TARGET_ROLES,
  UI_VIEWPORT_PRESETS,
} from "@/lib/verification-test-spec";

export type { ComposeOutcome, ComposedSpec };

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 한 번의 LLM 호출에 담는 완료조건 수. 너무 크면 응답이 출력 한도에 걸려
// 파싱에 실패하고, 그러면 그 호출에 실린 완료조건이 한꺼번에 자동화를 잃는다.
const COMPOSE_CHUNK_SIZE = 8;

export interface CompositionRequest {
  /** 확정된 DoD 문장. */
  description: string;
  /** 질문·답변으로 확정된 검수 계약. 있으면 구조 그대로 전달한다. */
  contract?: DodTestContract;
}

/**
 * 정규식 프리셋에 매칭되지 않은 DoD를 atom 조합으로 표현해 본다.
 * 반드시 엄격 파서를 통과한 조합만 채택하며, 실패하면 null을 돌려 호출자가
 * 기존대로 manual + 사람 확인 안내로 처리하게 한다.
 */
export async function composeVerificationAtoms(
  requests: CompositionRequest[],
): Promise<ComposeOutcome[]> {
  if (requests.length === 0) return [];
  if (!process.env.OPENAI_API_KEY) {
    return requests.map(() => ({ spec: null, reason: "no_api_key" as const }));
  }

  // 요청을 잘라 버리지 않는다. 예전에는 상한을 넘는 완료조건이 조용히 사라져
  // 자동화 가능한 항목까지 사람 확인으로 떨어졌다.
  const outcomes: ComposeOutcome[] = [];
  for (let index = 0; index < requests.length; index += COMPOSE_CHUNK_SIZE) {
    outcomes.push(...(await composeChunk(requests.slice(index, index + COMPOSE_CHUNK_SIZE))));
  }
  return outcomes;
}

/**
 * 한 번의 LLM 호출로 조합을 받는다. 호출이 통째로 실패하면 절반으로 나눠 다시
 * 시도해, 항목 하나 때문에 같은 호출에 실린 나머지까지 자동화를 잃지 않게 한다.
 */
async function composeChunk(bounded: CompositionRequest[]): Promise<ComposeOutcome[]> {
  if (bounded.length === 0) return [];

  let items: FlatItem[];
  try {
    const completion = await openai.chat.completions.parse({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content:
            "아래 완료 조건(DoD)마다 자동 검증 조합을 작성하세요.\n" +
            "각 항목의 라벨(시작 URL, 사전 상태, 사용자 행동, 기대 결과 등)은 발주자가 질문에 답해 확정한 값입니다. 그 값을 그대로 사용하고 다시 추측하지 마세요.\n\n" +
            bounded
              .map(
                (request, index) =>
                  `[${index + 1}]\n${contractToCompositionBrief(request.description, request.contract)}`,
              )
              .join("\n\n"),
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
      // 응답이 출력 한도에 걸려 잘린 경우다. 나눠 담으면 통과할 수 있다.
      return splitAndRetry(bounded);
    }
    items = parsed.items;
  } catch (error) {
    // 인증·과금·네트워크 실패는 나눠도 똑같이 실패한다. 재시도하면 실패한
    // 호출만 배로 늘어나므로 여기서 끝낸다.
    console.error("[verification-atom-composer] LLM composition failed", error);
    return bounded.map(() => ({ spec: null, reason: "llm_failed" as const }));
  }

  // 확정된 계약의 시작 URL이 LLM이 다시 고른 경로보다 우선한다. 화면 문구 단언은
  // 완료조건과 확정된 계약에 실제로 등장하는 표현만 허용한다.
  return items.map((item, index) => {
    const request = bounded[index];
    return normalizeComposedItem(
      item,
      request?.contract?.startPath,
      request ? contractToCompositionBrief(request.description, request.contract) : undefined,
    );
  });
}

async function splitAndRetry(bounded: CompositionRequest[]): Promise<ComposeOutcome[]> {
  if (bounded.length <= 1) {
    console.error("[verification-atom-composer] 완료조건 1건도 응답을 받지 못해 조합을 포기했습니다.");
    return bounded.map(() => ({ spec: null, reason: "llm_failed" as const }));
  }
  const middle = Math.ceil(bounded.length / 2);
  return [
    ...(await composeChunk(bounded.slice(0, middle))),
    ...(await composeChunk(bounded.slice(middle))),
  ];
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
    "다만 '시작 URL', '사전 상태', '테스트 데이터 준비', '사용자 행동', '행동 대상', '입력값', '기대 결과'가 라벨로 함께 주어졌다면 그것은 발주자가 질문에 직접 답해 확정한 값입니다.",
    "그 경우에는 추측이 아니므로 none 으로 회피하지 말고 주어진 값을 그대로 써서 조합을 작성하세요.",
    "'행동 대상'은 화면에 보이는 이름이므로 targetKind=role 과 targetName, 또는 targetKind=label|text|placeholder 로 옮기세요.",
    "",
    "automatable=none 을 선택해야 하는 경우:",
    "- 주관적 판단(디자인이 깔끔하다, 색상이 브랜드와 어울린다)",
    "- 성능·속도(응답이 1초 이내다) — 이 도구는 시간을 측정하지 않습니다",
    "- 서버 로그·내부 저장 상태(비밀번호가 로그에 남지 않는다)",
    "- 외부 발송(이메일·SMS가 실제로 도착한다) — 격리 환경은 외부 통신이 차단됩니다",
    "- 테스트가 화면에서 직접 만들 수 없는 데이터가 이미 있어야 하는 조건(예: 어제 다른 사람이 남긴 내역, 관리자가 미리 등록해 둔 정산 자료)",
    "- 특정 시각·날짜에 의존하는 조건",
    "",
    "[테스트 시작 상태는 직접 만드세요]",
    "각 완료조건은 로그인도 데이터도 없는 새 브라우저에서 시작합니다. 필요한 상태는 steps 앞부분에서 직접 만들 수 있으므로, 상태가 필요하다는 이유만으로 none 을 고르지 마세요.",
    "- 로그인한 상태가 필요하면 steps 앞에 로그인을 직접 수행하세요: goto(/login) → fill(field=email, valueKind=ref, value=email) → fill(field=password, valueKind=ref, value=password) → click(field=submit) → goto(확인할 경로).",
    "- '새로고침 후에도 유지되는지'를 확인하려면 같은 경로로 goto 를 한 번 더 호출하세요. 그것이 재접속이며 별도의 새로고침 동작은 필요하지 않습니다.",
    "- 목록·필터·빈 상태처럼 데이터가 있어야 하는 조건은, 그 데이터를 화면에서 만들 수 있다면 만드는 동작(입력 후 추가·저장 버튼 클릭)을 먼저 넣고 확인하세요.",
    "- 준비 단계에서 누를 버튼·입력란의 이름은 완료조건이나 '사전 상태'·'테스트 데이터 준비' 답변에 적혀 있는 이름만 쓰세요. 거기 없는 이름을 지어내면 조합 전체가 버려집니다.",
    "- 로그인 화면의 이메일·비밀번호·제출 버튼은 예외입니다. 이름 대신 targetKind=field 와 targetValue=email|password|submit 을 쓰면 어느 앱에서나 동작합니다.",
    "- 반대로 '비로그인 상태에서 접근 시 차단' 같은 조건에는 로그인 단계를 절대 넣지 마세요. 곧바로 goto 한 뒤 expect_path 로 리다이렉트를 확인합니다.",
    "- 상태를 만드는 단계에는 단언을 넣지 말고, 확인하려는 조건 자체에만 단언을 넣으세요. 준비 단계에 단언을 넣으면 로그인 화면 구조 차이만으로 실패합니다.",
    "- 로그인이 필요한데 완료조건에 로그인 화면 경로가 없으면 /login 을 쓰세요. 그마저 확신이 없으면 none 입니다. 로그인 단계를 통째로 생략하고 대상 화면만 확인하면 아무것도 검증하지 못합니다.",
    "",
    "[전제를 만들 수 없으면 none 입니다]",
    "앞의 안내는 '만들 수 있는 상태'에만 해당합니다. 완료조건이 말하는 상황 자체를 테스트가 일으킬 수 없다면, 단언을 쓸 수 있더라도 automatable=none 입니다.",
    "정상 동작하는 앱에서는 그 상황이 오지 않으므로, 조합을 만들면 멀쩡한 결과물이 매번 '실패'로 찍힙니다.",
    "- 서버 오류·장애·네트워크 실패를 일부러 일으켜야 하는 조건 ('조회 중 오류 발생 시 재시도 버튼 표시') — 오류를 일으킬 수단이 없습니다",
    "- 이미 비정상 상태여야 하는 조건 ('계정이 잠긴 상태에서 로그인 시도', '정원이 찬 슬롯') — 화면에서 그 상태를 만들 수 없다면 none 입니다",
    "- 연타·동시 요청으로 생기는 중복 ('버튼을 빠르게 여러 번 클릭해도 1건만 생성') — 이 도구는 동시 클릭을 만들지 못합니다",
    "- 빈 상태 확인이라도 '데이터가 하나도 없어야' 하는데 기존 데이터를 지울 수 없다면 none 입니다",
    "",
    "[없는 동작을 비슷한 것으로 대체하지 마세요]",
    "expect_visible 와 expect_enabled 는 '그 요소가 화면에 있다'만 증명합니다. 상태가 바뀌었는지, 개수가 맞는지는 증명하지 못합니다.",
    "상태·개수·목록 내용에는 전용 동작이 있습니다. expect_visible 로 대신하지 말고 아래를 쓰세요:",
    "- 체크박스·라디오가 선택된 상태인지: expect_checked / expect_unchecked",
    "- 항목이 정확히 몇 개 보이는지: expect_count 와 count 값 (예: '할 일이 1건만 생성' → expect_count(role=listitem, count=1))",
    "- 목록에 특정 종류만 보이는지: expect_every_text / expect_none_text (예: '완료된 것만 표시' → 모든 항목에 '완료' 문구, '완료되지 않은 것만 표시' → 어떤 항목에도 '완료' 문구 없음)",
    "expect_count 는 정확히 일치해야 통과합니다. 기대 개수를 확신할 수 없으면 쓰지 마세요.",
    "expect_every_text·expect_none_text 의 contains 에도 완료조건에 적힌 표현만 쓰세요. 지어내면 조합 전체가 버려집니다.",
    "그래도 표현할 수 없는 것(정렬 순서 등)은 여전히 automatable=none 입니다. expect_visible(role=listitem) 같은 존재 확인으로 대체하면 고장난 앱도 통과하므로 채택되지 않습니다.",
    `- steps 는 최대 ${MAX_ATOM_STEPS}개입니다. 준비 단계를 포함해 이 안에 담기지 않으면 none 을 고르세요.`,
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
    "expect_text 의 contains 와 targetName 에는 완료조건·계약에 이미 적혀 있는 표현을 그대로 옮겨 쓰세요.",
    "완료조건이 문구를 언급했다면 그대로 쓰면 됩니다. 예를 들어 '권한 오류 안내 표시'라면 contains 에 '권한 오류'를, \"버튼이 '마감'으로 표시\"라면 contains 에 '마감'을 쓰세요. 이때는 automatable=none 이 아닙니다.",
    "완료조건에 화면 문구가 전혀 없다면 문구를 지어내지 말고, 대신 관찰 가능한 다른 단언(expect_path·expect_visible·expect_hidden·expect_disabled·expect_error_feedback)을 쓰세요. 그것도 불가능할 때만 automatable=none 입니다.",
    "지어낸 문구는 정상 결과물을 '실패'로 잘못 판정하므로 채택되지 않고 버려집니다.",
    "expect_text 의 대상에는 화면 요소 설명('빈 상태 화면', '완료 문구')을 넣지 마세요. 확인할 문구는 contains 에만 넣습니다.",
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
      count: { type: "integer", description: "expect_count에서 기대하는 개수. 그 외에는 0" },
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
      "count",
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
              description: "확신이 없으면 반드시 none. 단, 시작 URL·행동·기대 결과가 라벨로 확정되어 있으면 none 으로 회피하지 말 것",
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
