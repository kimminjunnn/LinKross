import assert from "node:assert/strict";
import test from "node:test";

import {
  applyAnswersToContract,
  contractToCompositionBrief,
  contractToDodSentence,
  contractToGroundingText,
  isCompleteTestContract,
  missingContractFields,
  normalizeContractRequirements,
  targetSuggestionsFrom,
} from "@/lib/dod-test-contract";
import {
  conversationFromRequirements,
  isSettledStatus,
  resolveDesign,
  shouldReuseExistingSpec,
  summarizeDesigns,
  unansweredRequirements,
} from "@/lib/dod-verification-state";
import {
  normalizeComposedItem,
  requiresExistingData,
  requiresLoginState,
  type FlatItem,
  type FlatStep,
} from "@/lib/dod-atom-composition";
import {
  MANAGED_BROWSER_SPEC_VERSION_V2,
  MANAGED_BROWSER_SPEC_VERSION_V3,
  createMvpVerificationDefinition,
  parseManagedBrowserAtomTestSpec,
} from "@/lib/verification-test-spec";

const TERMINAL = new Set(["clarification_required", "automation_ready", "human_review_required"]);

const contract = (over: Record<string, unknown> = {}) =>
  ({ version: 1, scenario: "form_submission", ...over }) as never;

const req = (key: string, answer?: string) => ({
  key,
  question: `${key}?`,
  suggestions: ["a", "b"],
  recommendedSuggestion: "a",
  ...(answer ? { answer } : {}),
});

const step = (over: Partial<FlatStep>): FlatStep => ({
  atom: "click", targetKind: "none", targetField: "", targetRole: "", targetName: "", targetText: "",
  valueKind: "none", value: "", path: "", contains: "", key: "", viewport: "", count: 0,
  ...over,
});

const uiItem = (steps: FlatStep[], startPath = "/login"): FlatItem =>
  ({ automatable: "ui", startPath, steps, apiSteps: [] });

// ── 완료 상태를 오판하지 않는다 ──────────────────────────────────────────────
test("실행 가능한 스펙이 없으면 계약이 완성돼도 준비 완료가 되지 않는다", () => {
  const full = contract({
    startPath: "/login", precondition: "로그아웃 상태에서 시작", action: "클릭", target: "로그인 버튼",
    input: "test@example.com", expected: "/dashboard로 이동",
  });
  assert.equal(isCompleteTestContract(full), true);
  const resolved = resolveDesign({ requirements: [], contract: full, hasExecutableSpec: false });
  assert.equal(resolved.status, "human_review_required");
  assert.notEqual(resolved.status, "automation_ready");
});

test("실행 가능한 스펙이 있을 때만 automation_ready", () => {
  const resolved = resolveDesign({ requirements: [], contract: contract(), hasExecutableSpec: true });
  assert.equal(resolved.status, "automation_ready");
  assert.equal(resolved.design.humanReviewAccepted, false);
});

test("확정 상태는 셋뿐이며 과도기 상태는 절대 나오지 않는다", () => {
  for (const requirements of [[], [req("action")], [req("action", "클릭")]]) {
    for (const hasExecutableSpec of [true, false]) {
      const { status } = resolveDesign({ requirements, contract: contract(), hasExecutableSpec });
      assert.ok(TERMINAL.has(status), `예상 밖 상태: ${status}`);
    }
  }
});

// ── 질문이 반복되지 않는다 ──────────────────────────────────────────────────
test("모든 답변이 끝나면 질문이 남지 않는다", () => {
  const requirements = [req("startPath", "/login"), req("action", "클릭")];
  assert.equal(unansweredRequirements(requirements).length, 0);
  const resolved = resolveDesign({ requirements, contract: contract(), hasExecutableSpec: true });
  assert.equal(resolved.design.question, undefined);
  assert.equal(resolved.design.suggestions, undefined);
});

test("답변하지 않은 항목이 있으면 그 질문만 다시 보여준다", () => {
  const requirements = [req("startPath", "/login"), req("action")];
  const resolved = resolveDesign({ requirements, contract: contract(), hasExecutableSpec: false });
  assert.equal(resolved.status, "clarification_required");
  assert.equal(resolved.design.question, "action?");
  assert.equal(resolved.design.requirements?.length, 2);
});

test("이미 답한 질문과 답변이 대화에 그대로 보존된다", () => {
  const conversation = conversationFromRequirements([req("startPath", "/login"), req("action")]);
  assert.deepEqual(conversation, [
    { role: "assistant", content: "startPath?" },
    { role: "user", content: "/login" },
    { role: "assistant", content: "action?" },
  ]);
});

test("질문 세트는 계약의 빈 필수 필드에만 생성된다", () => {
  const partial = contract({ startPath: "/login", action: "클릭" });
  const keys = normalizeContractRequirements(partial, []).map((item) => item.key);
  assert.deepEqual(keys, missingContractFields(partial));
  assert.ok(!keys.includes("startPath"));
  assert.ok(!keys.includes("action"));
});

// ── 완료 상태가 되돌아가지 않는다 ────────────────────────────────────────────
test("문장이 그대로면 저장할 때마다 기존 스펙을 재사용한다", () => {
  const base = { hasStoredSpec: true, storedMethod: "automated_e2e", currentDod: "/login에서 로그인 확인" };
  assert.equal(shouldReuseExistingSpec({ ...base, storedDescription: "/login에서 로그인 확인" }), true);
  assert.equal(shouldReuseExistingSpec({ ...base, storedDescription: " /login에서 로그인 확인 " }), true);
});

test("문장이 바뀌거나 스펙이 없으면 재사용하지 않는다", () => {
  const base = { hasStoredSpec: true, storedMethod: "automated_e2e", currentDod: "새 문장" };
  assert.equal(shouldReuseExistingSpec({ ...base, storedDescription: "옛 문장" }), false);
  assert.equal(shouldReuseExistingSpec({ ...base, storedDescription: "새 문장", hasStoredSpec: false }), false);
  assert.equal(shouldReuseExistingSpec({ ...base, storedDescription: "새 문장", storedMethod: "manual" }), false);
});

// ── 답변이 사라지지 않는다 (결정적 병합) ─────────────────────────────────────
test("답변이 같은 이름의 계약 필드에 그대로 들어간다", () => {
  const merged = applyAnswersToContract(contract(), [
    req("startPath", "/orders 화면에서"),
    req("precondition", "테스트 계정으로 로그인한 상태에서 시작"),
    req("action", "픽업 요청 버튼 클릭"),
    req("target", "픽업 요청"),
    req("expected", "목록에 1건 표시"),
    req("input", "회의 준비"),
  ]);
  assert.equal(merged.startPath, "/orders");           // 한국어 조사 제거
  assert.equal(merged.precondition, "테스트 계정으로 로그인한 상태에서 시작");
  assert.equal(merged.action, "픽업 요청 버튼 클릭");
  assert.equal(merged.target, "픽업 요청");
  assert.equal(merged.expected, "목록에 1건 표시");
  assert.equal(isCompleteTestContract(merged), true);
});

test("빈 답변은 기존 계약 값을 덮어쓰지 않는다", () => {
  const merged = applyAnswersToContract(contract({ action: "원래 값" }), [req("action", "   ")]);
  assert.equal(merged.action, "원래 값");
});

test("계약 필드가 아닌 key는 계약을 오염시키지 않는다", () => {
  const merged = applyAnswersToContract(contract(), [req("login_route", "/login")]);
  assert.deepEqual(Object.keys(merged).sort(), ["scenario", "version"]);
});

test("LLM 문장 다듬기가 실패해도 계약에서 문장을 만들 수 있다", () => {
  const sentence = contractToDodSentence(
    contract({ startPath: "/login", action: "클릭", target: "로그인 버튼", expected: "/dashboard로 이동" }),
    "원본",
  );
  assert.ok(sentence.includes("/login"));
  assert.ok(sentence.includes("로그인 버튼"));
  assert.ok(/(확인|이동|표시)$/.test(sentence));
});

test("구조화된 브리프가 라벨을 유지한다", () => {
  const brief = contractToCompositionBrief("로그인 확인", contract({ startPath: "/login", expected: "이동" }));
  assert.ok(brief.includes("시작 URL: /login"));
  assert.ok(brief.includes("기대 결과: 이동"));
});

// ── 실행 불가능한 조합을 채택하지 않는다 ────────────────────────────────────
test("단언이 하나도 없는 조합은 거부한다", () => {
  const outcome = normalizeComposedItem(uiItem([step({ atom: "click", targetKind: "field", targetField: "submit" })]));
  assert.equal(outcome.spec, null);
  assert.equal(outcome.reason, "schema_rejected");
});

test("변환 실패한 step이 하나라도 있으면 조합 전체를 버린다", () => {
  const outcome = normalizeComposedItem(uiItem([
    step({ atom: "expect_visible", targetKind: "field", targetField: "email" }),
    step({ atom: "click", targetKind: "none" }),   // 대상 없음 → 변환 실패
  ]));
  assert.equal(outcome.spec, null, "단언만 남기고 조용히 통과시키면 안 된다");
});

test("알 수 없는 atom은 거부한다", () => {
  const outcome = normalizeComposedItem(uiItem([step({ atom: "run_shell", targetKind: "text", targetText: "x" })]));
  assert.equal(outcome.spec, null);
});

test("automatable=none은 자동화 포기로 기록된다", () => {
  const outcome = normalizeComposedItem({ automatable: "none", startPath: "", steps: [], apiSteps: [] });
  assert.equal(outcome.spec, null);
  assert.equal(outcome.reason, "llm_declined");
});

test("유효한 UI 조합은 실행 가능한 스펙이 된다", () => {
  const outcome = normalizeComposedItem(uiItem([
    step({ atom: "fill", targetKind: "field", targetField: "email", valueKind: "ref", value: "email" }),
    step({ atom: "fill", targetKind: "field", targetField: "password", valueKind: "ref", value: "password" }),
    step({ atom: "click", targetKind: "field", targetField: "submit" }),
    step({ atom: "expect_path", path: "/dashboard" }),
  ]));
  assert.ok(outcome.spec, "유효한 조합은 채택되어야 한다");
  assert.equal(outcome.spec!.kind, "managed_browser");
  assert.equal((outcome.spec as { startPath: string }).startPath, "/login");
});

test("확정된 계약의 시작 URL이 LLM이 비워둔 경로를 대신한다", () => {
  const outcome = normalizeComposedItem(
    uiItem([step({ atom: "expect_visible", targetKind: "field", targetField: "email" })], ""),
    "/signin",
  );
  assert.equal((outcome.spec as { startPath: string } | null)?.startPath, "/signin");
});

test("api 조합도 엄격 파서를 통과해야 채택된다", () => {
  const ok = normalizeComposedItem({
    automatable: "api", startPath: "", steps: [],
    apiSteps: [{ method: "POST", path: "/api/login", bodyJson: '{"email":"a@b.c"}', expectStatus: 401 }],
  });
  assert.ok(ok.spec);
  const bad = normalizeComposedItem({
    automatable: "api", startPath: "", steps: [],
    apiSteps: [{ method: "DELETE", path: "/api/login", bodyJson: "", expectStatus: 401 }],
  });
  assert.equal(bad.spec, null);
});

// ── 중간 상태가 방치되지 않는다 ──────────────────────────────────────────────
test("직접 확인 항목은 확정 전까지 제출을 막고, 확정하면 통과한다", () => {
  const unaccepted = resolveDesign({ requirements: [], hasExecutableSpec: false }).design;
  assert.equal(isSettledStatus(unaccepted), false);
  const accepted = resolveDesign({ requirements: [], hasExecutableSpec: false, humanReviewAccepted: true }).design;
  assert.equal(isSettledStatus(accepted), true);
});

test("과도기 상태는 제출 집계에서 미완료로 잡힌다", () => {
  const summary = summarizeDesigns([
    { status: "automation_ready" },
    { status: "contract_ready" },
    { status: "human_review_required", humanReviewAccepted: true },
    { status: "human_review_required", humanReviewAccepted: false },
    { status: "clarification_required" },
  ]);
  assert.equal(summary.automationReady, 1);
  assert.equal(summary.transient, 1);
  assert.equal(summary.humanReviewRequired, 2);
  assert.equal(summary.humanReviewUnaccepted, 1);
  assert.equal(summary.clarificationRequired, 1);
});

test("사람 확인 안내가 상태 메시지에 그대로 담긴다", () => {
  const design = resolveDesign({
    requirements: [], hasExecutableSpec: false,
    manualGuidance: { location: "/orders 화면", method: "픽업 요청 클릭", expected: "1건만 표시" },
  }).design;
  assert.ok(design.message?.includes("/orders 화면"));
  assert.ok(design.message?.includes("픽업 요청 클릭"));
  assert.ok(design.message?.includes("1건만 표시"));
});

// ── 없는 사실을 지어내지 않는다 ─────────────────────────────────────────────
test("완료조건에 없는 문구를 기대 결과로 지어내면 조합을 거부한다", () => {
  const outcome = normalizeComposedItem(
    uiItem([step({ atom: "expect_text", contains: "예약이 없습니다" })]),
    undefined,
    "완료조건: /reservations 접속 시 빈 상태 화면 표시",
  );
  assert.equal(outcome.spec, null);
  assert.equal(outcome.reason, "ungrounded_text");
});

test("완료조건에 있는 문구는 띄어쓰기가 달라도 통과한다", () => {
  const outcome = normalizeComposedItem(
    uiItem([step({ atom: "expect_text", contains: "권한오류" })]),
    undefined,
    "완료조건: /admin 직접 접근 시 접근 차단 및 권한 오류 안내 표시",
  );
  assert.ok(outcome.spec);
});

test("지어낸 버튼 이름도 거부한다", () => {
  const outcome = normalizeComposedItem(
    uiItem([
      step({ atom: "click", targetKind: "role", targetRole: "button", targetName: "지금 결제하기" }),
      step({ atom: "expect_path", path: "/done" }),
    ]),
    undefined,
    "완료조건: /classes에서 예약 버튼 클릭 시 /done으로 이동",
  );
  assert.equal(outcome.spec, null);
  assert.equal(outcome.reason, "ungrounded_text");
});

test("expect_text의 요소 설명 대상은 떼어내고 화면 전체에서 확인한다", () => {
  // `{text: "빈 상태 화면"}`을 그대로 두면 그 문구를 가진 요소를 먼저 찾다가
  // 항상 실패한다. contains 단언만 남겨야 한다.
  const outcome = normalizeComposedItem(
    uiItem([step({ atom: "expect_text", contains: "마감", targetKind: "text", targetText: "예약 버튼" })]),
    undefined,
    "완료조건: 마감된 수업의 예약 버튼이 마감으로 표시됨",
  );
  const steps = (outcome.spec as { steps: Array<Record<string, unknown>> } | null)?.steps;
  assert.deepEqual(steps, [{ atom: "expect_text", contains: "마감" }]);
});

test("contains가 비면 expect_text를 채택하지 않는다", () => {
  const outcome = normalizeComposedItem(uiItem([step({ atom: "expect_text", contains: "" })]));
  assert.equal(outcome.spec, null);
});

test("근거 문구가 없으면 검사를 건너뛴다(기존 초안 호환)", () => {
  const outcome = normalizeComposedItem(uiItem([step({ atom: "expect_text", contains: "아무 문구" })]));
  assert.ok(outcome.spec);
});

// ── 사전 상태를 조합 안에서 직접 만든다 ──────────────────────────────────────
test("로그인 준비 단계는 field 대상이라 근거 문구 검사에 걸리지 않는다", () => {
  const outcome = normalizeComposedItem(
    uiItem([
      step({ atom: "goto", path: "/login" }),
      step({ atom: "fill", targetKind: "field", targetField: "email", valueKind: "ref", value: "email" }),
      step({ atom: "fill", targetKind: "field", targetField: "password", valueKind: "ref", value: "password" }),
      step({ atom: "click", targetKind: "field", targetField: "submit" }),
      step({ atom: "goto", path: "/todos" }),
      // 같은 경로로 다시 이동하는 것이 재접속이다. 별도 새로고침 atom은 없다.
      step({ atom: "goto", path: "/todos" }),
      // 로그인 화면으로 튕기지 않았다면 세션이 유지된 것이다.
      step({ atom: "expect_path", path: "/todos" }),
    ], "/todos"),
    "/todos",
    "완료조건: /login에서 로그인 후 /todos에서 새로고침 시 화면이 그대로 표시 확인",
  );
  assert.ok(outcome.spec, `거부됨: ${outcome.reason}`);
});

test("계약의 준비 답변에 적힌 이름은 준비 단계에서 쓸 수 있다", () => {
  const brief = contractToCompositionBrief(
    "/todos에서 '진행중' 필터 선택 시 완료되지 않은 할 일만 표시 확인",
    contract({ scenario: "list_filter", startPath: "/todos", fixture: "할 일 추가 버튼으로 항목 2개 생성" }),
  );
  const outcome = normalizeComposedItem(
    uiItem([
      step({ atom: "click", targetKind: "role", targetRole: "button", targetName: "할 일 추가" }),
      step({ atom: "click", targetKind: "role", targetRole: "button", targetName: "진행중" }),
      step({ atom: "expect_text", contains: "진행중" }),
    ], "/todos"),
    "/todos",
    brief,
  );
  assert.ok(outcome.spec, `거부됨: ${outcome.reason}`);
});

test("준비 단계라도 계약에 없는 이름을 지어내면 거부한다", () => {
  const brief = contractToCompositionBrief(
    "/todos에서 '진행중' 필터 선택 시 완료되지 않은 할 일만 표시 확인",
    contract({ scenario: "list_filter", startPath: "/todos", fixture: "할 일 추가 버튼으로 항목 2개 생성" }),
  );
  const outcome = normalizeComposedItem(
    uiItem([
      step({ atom: "click", targetKind: "role", targetRole: "button", targetName: "샘플 데이터 생성" }),
      step({ atom: "expect_text", contains: "진행중" }),
    ], "/todos"),
    "/todos",
    brief,
  );
  assert.equal(outcome.spec, null);
  assert.equal(outcome.reason, "ungrounded_text");
});

// ── 어휘 세대 v3: 선택 상태·개수·목록 내용 ───────────────────────────────────
const specOf = (o: ReturnType<typeof normalizeComposedItem>) =>
  o.spec as { version: number; steps: Array<Record<string, unknown>> } | null;

test("새 조합은 v3으로 기록하고 기존 v2 조합도 그대로 실행한다", () => {
  const composed = specOf(normalizeComposedItem(uiItem([step({ atom: "expect_path", path: "/todos" })], "/todos")));
  assert.equal(composed?.version, MANAGED_BROWSER_SPEC_VERSION_V3);

  const storedV2 = parseManagedBrowserAtomTestSpec({
    version: MANAGED_BROWSER_SPEC_VERSION_V2,
    kind: "managed_browser",
    startPath: "/login",
    steps: [{ atom: "expect_path", path: "/dashboard" }],
    syntheticCredentials: { email: "a@b.com", password: "pw", invalidPassword: "no" },
  });
  assert.equal(storedV2?.version, MANAGED_BROWSER_SPEC_VERSION_V2);
});

test("체크 상태 확인을 조합에 담을 수 있다", () => {
  // 목록에는 체크박스가 여럿이므로 누를 대상은 이름으로 특정해야 한다.
  // 이름 없이 누르면 첫 번째 항목을 누르게 되어 무엇을 확인했는지 정해지지 않는다.
  const spec = specOf(normalizeComposedItem(
    uiItem([
      step({ atom: "click", targetKind: "role", targetRole: "checkbox", targetName: "우유 사기" }),
      step({ atom: "expect_checked", targetKind: "role", targetRole: "checkbox", targetName: "우유 사기" }),
    ], "/todos"),
    undefined,
    "우유 사기",
  ));
  assert.deepEqual(spec?.steps[1], { atom: "expect_checked", target: { role: "checkbox", name: "우유 사기" } });
});

test("개수 확인은 정수만 받고 음수는 거부한다", () => {
  const ok = specOf(normalizeComposedItem(
    uiItem([step({ atom: "expect_count", targetKind: "role", targetRole: "listitem", count: 1 })], "/todos"),
  ));
  assert.deepEqual(ok?.steps[0], { atom: "expect_count", target: { role: "listitem" }, count: 1 });

  const bad = normalizeComposedItem(
    uiItem([step({ atom: "expect_count", targetKind: "role", targetRole: "listitem", count: -1 })], "/todos"),
  );
  assert.equal(bad.spec, null);
  assert.equal(bad.reason, "schema_rejected");
});

test("목록 내용 단언도 완료조건에 있는 문구만 허용한다", () => {
  const grounded = normalizeComposedItem(
    uiItem([step({ atom: "expect_none_text", targetKind: "role", targetRole: "listitem", contains: "완료" })], "/todos"),
    undefined,
    "완료조건: /todos에서 '진행중' 필터 선택 시 완료되지 않은 할 일만 표시 확인",
  );
  assert.ok(grounded.spec, `거부됨: ${grounded.reason}`);

  const invented = normalizeComposedItem(
    uiItem([step({ atom: "expect_every_text", targetKind: "role", targetRole: "listitem", contains: "보관됨" })], "/todos"),
    undefined,
    "완료조건: /todos에서 '진행중' 필터 선택 시 완료되지 않은 할 일만 표시 확인",
  );
  assert.equal(invented.spec, null);
  assert.equal(invented.reason, "ungrounded_text");
});

test("목록 내용 단언은 대상 없이는 채택하지 않는다", () => {
  // 대상이 없으면 화면 전체 텍스트를 훑게 되어 '모두/아무것도'의 의미가 사라진다.
  const outcome = normalizeComposedItem(
    uiItem([step({ atom: "expect_every_text", targetKind: "none", contains: "완료" })], "/todos"),
    undefined,
    "완료조건: /todos에서 완료된 할 일만 표시 확인",
  );
  assert.equal(outcome.spec, null);
});

test("계약이 있으면 실행될 테스트 내용(testHint)이 설계에 담긴다", () => {
  // 화면의 "실행될 테스트 내용 보기"가 이 값에 의존한다. 저장 경로에서
  // 누락되면 자동 테스트가 준비돼도 사용자가 내용을 볼 수 없다.
  const design = resolveDesign({
    requirements: [],
    contract: contract({ startPath: "/login", action: "클릭", target: "로그인 버튼", expected: "/dashboard로 이동" }),
    hasExecutableSpec: true,
  }).design;
  assert.equal(design.status, "automation_ready");
  assert.ok(design.testHint?.includes("/login"));
  assert.ok(design.testHint?.includes("로그인 버튼"));
});

// ── 합의되지 않은 기준으로 판정하지 않는다 ───────────────────────────────────
test("계정 잠금 조건은 프리셋으로 자동 판정하지 않는다", () => {
  // 임계값과 "몇 번째 시도부터 차단인지"는 합의된 적이 없다. 고정 시퀀스로
  // 판정하면 정상 구현을 실패로 찍는다. 사람 확인으로 남기는 것이 옳다.
  for (const dod of [
    "로그인에 5회 연속 실패하면 계정이 잠긴다.",
    "/login에서 로그인 실패가 반복되면 계정이 잠겨 접속이 차단됨",
  ]) {
    const result = createMvpVerificationDefinition(dod);
    assert.equal(result.verificationMethod, "manual", dod);
    assert.deepEqual(result.testSpec, {});
  }
});

test("로그인 프리셋 4종은 그대로 유지된다", () => {
  const cases: Array<[string, string]> = [
    ["로그인 화면에 이메일과 비밀번호 입력란이 표시된다.", "login_fields"],
    ["이메일과 비밀번호로 정상 로그인하면 /dashboard로 이동한다.", "login_success"],
    ["잘못된 비밀번호로 로그인하면 오류 메시지가 표시된다.", "login_invalid_password"],
    ["이메일 미입력 시 로그인이 차단된다.", "login_email_required"],
  ];
  for (const [dod, preset] of cases) {
    const result = createMvpVerificationDefinition(dod);
    assert.equal(result.verificationMethod, "automated_e2e", dod);
    assert.equal((result.testSpec as { preset?: string }).preset, preset, dod);
  }
});

test("프리셋에 매칭되지 않는 표현은 조합 단계로 넘긴다", () => {
  // "입력하지 않으면"은 login_email_required 정규식(미입력·비어·누락)에 걸리지
  // 않는다. 정규식을 넓혀 억지로 프리셋에 태우지 않는다 — 그 프리셋의 판정은
  // HTML5 checkValidity에 의존해 자체 검증을 쓰는 앱을 실패로 찍는다.
  const result = createMvpVerificationDefinition("이메일을 입력하지 않으면 로그인이 되지 않는다.");
  assert.equal(result.verificationMethod, "manual");
});

// ── 대상 어휘를 벗어난 조합은 바꿔치기하지 않고 거부한다 ──────────────────────
// 실측에서 자동화 실패의 가장 큰 원인이었다. 모델이 targetKind=field 에 역할
// 이름(textbox)이나 임의의 입력란 이름(companyName)을 넣으면 로그인 요소 세
// 가지가 아니므로 실행할 수 없다. 비슷한 대상으로 고쳐 쓰면 한국어 라벨과
// 맞지 않아 정상 앱을 실패로 판정하므로, 조합 전체를 버리고 사람 확인으로 넘긴다.

test("field 자리에 역할 이름이 오면 조합을 거부한다", () => {
  const outcome = normalizeComposedItem(
    uiItem([step({ atom: "fill", targetKind: "field", targetField: "textbox", valueKind: "literal", value: "x" })]),
  );
  assert.equal(outcome.spec, null);
  assert.equal(outcome.reason, "schema_rejected");
  assert.match(outcome.detail ?? "", /field=textbox/);
});

test("로그인 요소가 아닌 입력란 이름은 field로 받지 않는다", () => {
  for (const name of ["companyName", "inviteEmail", "file"]) {
    const outcome = normalizeComposedItem(
      uiItem([step({ atom: "fill", targetKind: "field", targetField: name, valueKind: "literal", value: "x" })]),
    );
    assert.equal(outcome.spec, null, name);
    assert.equal(outcome.reason, "schema_rejected", name);
  }
});

test("허용된 역할과 라벨은 그대로 조합에 담긴다", () => {
  const outcome = normalizeComposedItem(
    uiItem([
      step({ atom: "fill", targetKind: "label", targetText: "회사명", valueKind: "literal", value: "테스트회사" }),
      step({ atom: "click", targetKind: "role", targetRole: "button", targetName: "저장" }),
      step({ atom: "expect_visible", targetKind: "role", targetRole: "alert" }),
    ]),
  );
  assert.notEqual(outcome.spec, null);
});

test("목록에 없는 역할은 거부한다", () => {
  const outcome = normalizeComposedItem(
    uiItem([step({ atom: "click", targetKind: "role", targetRole: "menuitem", targetName: "저장" })]),
  );
  assert.equal(outcome.spec, null);
  assert.match(outcome.detail ?? "", /role=menuitem/);
});

test("fill의 입력값이 비었거나 허용되지 않은 참조면 거부한다", () => {
  const emptyLiteral = normalizeComposedItem(
    uiItem([step({ atom: "fill", targetKind: "field", targetField: "email", valueKind: "literal", value: "" })]),
  );
  assert.equal(emptyLiteral.spec, null);

  const badRef = normalizeComposedItem(
    uiItem([step({ atom: "fill", targetKind: "field", targetField: "email", valueKind: "ref", value: "username" })]),
  );
  assert.equal(badRef.spec, null);
});

test("시작 경로가 없으면 거부 사유에 그 사실이 남는다", () => {
  const outcome = normalizeComposedItem(
    uiItem([step({ atom: "expect_visible", targetKind: "field", targetField: "email" })], ""),
  );
  assert.equal(outcome.spec, null);
  assert.match(outcome.detail ?? "", /시작 경로/);
});

// ── 계약이 요구한 전제를 만들지 않은 조합은 채택하지 않는다 ────────────────────
// 실측에서 이 누락 하나가 두 가지 오판을 동시에 만들었다. 로그인이 필요한 화면에
// 로그인 없이 접근하면 정상 앱은 로그인 화면으로 리다이렉트되어 실패하고(False FAIL),
// 권한 검사가 빠진 고장 앱은 오히려 열려서 통과한다(False PASS).

test("로그인 전제를 요구하는데 로그인 단계가 없으면 거부한다", () => {
  const outcome = normalizeComposedItem(
    uiItem([step({ atom: "expect_path", path: "/todos" })], "/todos"),
    "/todos",
    undefined,
    "로그인한 상태",
  );
  assert.equal(outcome.spec, null);
  assert.match(outcome.detail ?? "", /전제 미이행/);
});

test("로그인 단계를 포함하면 같은 조합이 채택된다", () => {
  const outcome = normalizeComposedItem(
    uiItem(
      [
        step({ atom: "goto", path: "/login" }),
        step({ atom: "fill", targetKind: "field", targetField: "email", valueKind: "ref", value: "email" }),
        step({ atom: "fill", targetKind: "field", targetField: "password", valueKind: "ref", value: "password" }),
        step({ atom: "click", targetKind: "field", targetField: "submit" }),
        step({ atom: "goto", path: "/todos" }),
        step({ atom: "expect_path", path: "/todos" }),
      ],
      "/login",
    ),
    "/login",
    undefined,
    "로그인한 상태",
  );
  assert.notEqual(outcome.spec, null);
});

test("비로그인 전제에는 로그인 단계를 요구하지 않는다", () => {
  const outcome = normalizeComposedItem(
    uiItem([step({ atom: "expect_path", path: "/login" })], "/todos"),
    "/todos",
    undefined,
    "로그인하지 않은 상태",
  );
  assert.notEqual(outcome.spec, null, "비로그인 조건은 로그인 없이 확인하는 것이 맞다");
});

test("전제가 없으면 로그인 여부를 따지지 않는다", () => {
  const outcome = normalizeComposedItem(uiItem([step({ atom: "expect_path", path: "/todos" })], "/todos"), "/todos");
  assert.notEqual(outcome.spec, null);
});

test("전제 판정은 부정형 표현을 로그인 요구로 읽지 않는다", () => {
  assert.equal(requiresLoginState("로그인한 상태에서 시작"), true);
  assert.equal(requiresLoginState("테스트 계정으로 로그인한 상태"), true);
  assert.equal(requiresLoginState("로그인하지 않은 상태에서 시작"), false);
  assert.equal(requiresLoginState("비로그인 상태"), false);
  assert.equal(requiresLoginState("로그아웃 상태에서 시작"), false);
  assert.equal(requiresLoginState(""), false);
  assert.equal(requiresLoginState(undefined), false);
});

test("문구 확인에서 빠진 필드를 대상이 아니라 문구로 짚는다", () => {
  const outcome = normalizeComposedItem(uiItem([step({ atom: "expect_text", contains: "" })]));
  assert.equal(outcome.spec, null);
  assert.match(outcome.detail ?? "", /문구/);
});

// ── 사전 상태는 시나리오와 무관하게 항상 확인한다 ────────────────────────────
// 로그인이 필요한 화면인지 아무도 확인하지 않으면, 조합이 로그인 없이 화면을 열어
// 정상 앱이 로그인 화면으로 리다이렉트되며 실패로 판정된다(False FAIL).

test("폼 제출 시나리오도 사전 상태를 필수로 묻는다", () => {
  const incomplete = contract({
    scenario: "form_submission",
    startPath: "/todos", action: "추가 버튼 클릭", target: "할 일 추가",
    input: "우유 사기", expected: "목록에 표시",
  });
  assert.deepEqual(missingContractFields(incomplete), ["precondition"]);
  assert.equal(isCompleteTestContract(incomplete), false);
});

test("사전 상태 질문에는 로그인 여부를 고를 선택지가 붙는다", () => {
  const requirements = normalizeContractRequirements(
    contract({ scenario: "form_submission", startPath: "/todos", action: "클릭", target: "버튼", input: "값", expected: "표시" }),
    [],
  );
  const precondition = requirements.find((requirement) => requirement.key === "precondition");
  assert.notEqual(precondition, undefined);
  const suggestions = precondition?.suggestions ?? [];
  assert.equal(suggestions.length >= 2, true);
  assert.equal(
    suggestions.some((suggestion) => suggestion.includes("로그인")),
    true,
  );
});

test("제출 버튼에는 값을 넣지 않는다", () => {
  const outcome = normalizeComposedItem(
    uiItem([step({ atom: "fill", targetKind: "field", targetField: "submit", valueKind: "literal", value: "x" })]),
  );
  assert.equal(outcome.spec, null);
});

// ── 데이터 전제도 로그인 전제와 같은 원리로 확인한다 ──────────────────────────
// 확인할 데이터가 없으면 정상 앱에서도 대상을 찾지 못해 실패한다.

test("데이터 존재 전제인데 만드는 단계가 없으면 거부한다", () => {
  const outcome = normalizeComposedItem(
    uiItem([step({ atom: "expect_visible", targetKind: "role", targetRole: "listitem" })], "/todos"),
    "/todos",
    undefined,
    "할 일 목록에 할 일 존재",
  );
  assert.equal(outcome.spec, null);
  assert.match(outcome.detail ?? "", /데이터를 만드는 단계가 없음/);
});

test("화면에서 데이터를 만들면 같은 조합이 채택된다", () => {
  const outcome = normalizeComposedItem(
    uiItem(
      [
        step({ atom: "fill", targetKind: "label", targetText: "할 일", valueKind: "literal", value: "우유 사기" }),
        step({ atom: "click", targetKind: "role", targetRole: "button", targetName: "할 일 추가" }),
        step({ atom: "expect_visible", targetKind: "role", targetRole: "listitem" }),
      ],
      "/todos",
    ),
    "/todos",
    undefined,
    "할 일 목록에 할 일 존재",
  );
  assert.notEqual(outcome.spec, null);
});

test("빈 상태 확인에는 데이터 생성을 요구하지 않는다", () => {
  const outcome = normalizeComposedItem(
    uiItem([step({ atom: "expect_text", contains: "등록된 할 일이 없습니다" })], "/todos"),
    "/todos",
    "등록된 할 일이 없습니다",
    "할 일이 하나도 없는 상태",
  );
  assert.notEqual(outcome.spec, null, "빈 상태는 데이터를 만들면 안 된다");
});

test("데이터 전제 판정은 부정형을 요구로 읽지 않는다", () => {
  assert.equal(requiresExistingData("할 일 목록에 할 일 존재"), true);
  assert.equal(requiresExistingData("등록된 주문이 있는 상태"), true);
  assert.equal(requiresExistingData("할 일이 하나도 없는 상태"), false);
  assert.equal(requiresExistingData("목록이 비어 있는 상태"), false);
  assert.equal(requiresExistingData("로그인한 상태"), false);
  assert.equal(requiresExistingData(undefined), false);
});

// ── 근거는 사람이 승인한 것만 인정한다 ────────────────────────────────────────
// 분석기가 스스로 채운 계약 필드는 질문이 만들어지지 않아 아무도 확인하지 않는다.
// 그 값을 근거로 인정하면 상류의 창작이 하류에서 "근거 있음"으로 세탁된다.
// 실측에서 분석기가 target에 "할 일 내용"을 채웠고(실제 라벨은 "할 일"), 그 이름으로
// 요소를 찾으려던 조합이 정상 앱을 실패로 판정했다.

test("근거 텍스트에는 답변한 계약 필드만 들어간다", () => {
  const full = contract({ target: "할 일 내용", expected: "목록에 표시", precondition: "로그인한 상태" });
  const dod = "/todos에서 할 일 입력 후 추가 시 목록에 표시 확인";

  const narrow = contractToGroundingText(dod, full, ["precondition"]);
  assert.equal(narrow.includes("로그인한 상태"), true);
  assert.equal(narrow.includes("할 일 내용"), false, "답변하지 않은 필드는 근거가 아니다");

  const wide = contractToGroundingText(dod, full, ["precondition", "target"]);
  assert.equal(wide.includes("할 일 내용"), true, "답변한 필드는 근거로 인정한다");
});

test("답변한 필드가 없으면 완료조건 문장만 근거가 된다", () => {
  const dod = "/todos에서 할 일 표시 확인";
  assert.equal(contractToGroundingText(dod, contract({ target: "지어낸 이름" }), []), dod);
  assert.equal(contractToGroundingText(dod, undefined, ["target"]), dod);
});

test("분석기가 채운 이름으로 요소를 찾는 조합은 거부한다", () => {
  const dod = "/todos에서 할 일 입력 후 '할 일 추가' 버튼 클릭 시 목록에 표시 확인";
  const outcome = normalizeComposedItem(
    uiItem(
      [
        step({ atom: "fill", targetKind: "label", targetText: "할 일 내용", valueKind: "literal", value: "우유" }),
        step({ atom: "click", targetKind: "role", targetRole: "button", targetName: "할 일 추가" }),
        step({ atom: "expect_text", contains: "우유" }),
      ],
      "/todos",
    ),
    "/todos",
    contractToGroundingText(dod, contract({ target: "할 일 내용" }), []),
  );
  assert.equal(outcome.spec, null, "완료조건에 없는 라벨이므로 거부해야 한다");
  assert.equal(outcome.reason, "ungrounded_text");
});

// ── 이름 없는 역할을 조작 대상으로 삼지 않는다 ────────────────────────────────
// "화면의 첫 번째 버튼을 누른다"는 무엇을 눌렀는지 정해지지 않아 검증으로 성립하지
// 않는다. 실측에서 로그아웃 버튼이 먼저 있는 화면에 대해 조합이 이름 없는
// click(role=button)을 골랐고, 세션이 끊긴 채 확인이 진행돼 정상 앱이 실패로 찍혔다.

test("이름 없는 역할을 누르는 조합은 거부한다", () => {
  const outcome = normalizeComposedItem(uiItem([step({ atom: "click", targetKind: "role", targetRole: "button" })]));
  assert.equal(outcome.spec, null);
});

test("이름 없는 역할에 값을 넣는 조합도 거부한다", () => {
  const outcome = normalizeComposedItem(
    uiItem([step({ atom: "fill", targetKind: "role", targetRole: "textbox", valueKind: "literal", value: "x" })]),
  );
  assert.equal(outcome.spec, null);
});

test("이름이 있으면 역할 대상을 그대로 쓴다", () => {
  const outcome = normalizeComposedItem(
    uiItem([
      step({ atom: "click", targetKind: "role", targetRole: "button", targetName: "할 일 추가" }),
      step({ atom: "expect_visible", targetKind: "role", targetRole: "listitem" }),
    ]),
  );
  assert.notEqual(outcome.spec, null);
});

test("확인 동작은 이름 없는 역할을 그대로 허용한다", () => {
  // expect_count(role=listitem) 처럼 같은 역할을 한꺼번에 세는 것이 목적일 수 있다.
  const outcome = normalizeComposedItem(
    uiItem([step({ atom: "expect_count", targetKind: "role", targetRole: "listitem", count: 1 })], "/todos"),
  );
  assert.notEqual(outcome.spec, null);
});

// ── 선택지는 지시문이 아니라 실제 값이어야 한다 ──────────────────────────────
// 선택지는 그대로 계약 필드 값이 되고, 조합 단계에서 화면 요소 이름으로 쓰인다.
// 예전 target 기본값("화면에 표시된 버튼 이름 사용")이 그대로 이름이 되어
// 정상 앱에서 요소를 찾지 못하고 실패로 판정됐다.

test("완료조건의 따옴표 안 이름을 대상 선택지로 뽑는다", () => {
  assert.deepEqual(
    targetSuggestionsFrom("/todos에서 할 일 입력 후 '할 일 추가' 버튼 클릭 시 목록에 표시 확인"),
    ["할 일 추가"],
  );
  assert.deepEqual(
    targetSuggestionsFrom("“픽업 대기” 상태에서 \"배송 완료\"로 직접 변경 시도 시 변경 거부 확인"),
    ["픽업 대기", "배송 완료"],
  );
  assert.deepEqual(targetSuggestionsFrom("/todos에서 목록 표시 확인"), []);
});

test("대상 질문의 선택지가 완료조건에서 온다", () => {
  const requirements = normalizeContractRequirements(
    contract({ scenario: "state_change", startPath: "/todos", precondition: "로그인한 상태", expected: "표시" }),
    [],
    "/todos에서 '할 일 추가' 버튼 클릭 시 목록에 표시 확인",
  );
  const target = requirements.find((requirement) => requirement.key === "target");
  assert.deepEqual(target?.suggestions, ["할 일 추가"]);
  assert.equal(target?.recommendedSuggestion, "할 일 추가");
});

test("뽑을 이름이 없으면 지시문을 선택지로 주지 않는다", () => {
  const requirements = normalizeContractRequirements(
    contract({ scenario: "state_change", startPath: "/todos", precondition: "로그인한 상태", expected: "표시" }),
    [],
    "/todos에서 목록 표시 확인",
  );
  const target = requirements.find((requirement) => requirement.key === "target");
  assert.deepEqual(target?.suggestions, [], "그럴듯한 지시문이 이름으로 쓰이면 안 된다");
});

test("제출 버튼에는 입력 검증 차단을 확인하지 않는다", () => {
  const outcome = normalizeComposedItem(
    uiItem([step({ atom: "expect_form_blocked", targetKind: "field", targetField: "submit" })], "/login"),
  );
  assert.equal(outcome.spec, null);

  const onInput = normalizeComposedItem(
    uiItem([step({ atom: "expect_form_blocked", targetKind: "field", targetField: "email" })], "/login"),
  );
  assert.notEqual(onInput.spec, null);
});
