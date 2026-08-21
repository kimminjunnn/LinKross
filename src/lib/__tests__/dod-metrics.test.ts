import assert from "node:assert/strict";
import test from "node:test";

import {
  countVerificationUnits,
  evaluateTargets,
  extractUrlPaths,
  findOutOfScopeCandidates,
  hasUrlPath,
  hasUrlPathLegacy,
  isAtomic,
  isCapabilityStatement,
  isNounTerminated,
  measureDods,
} from "@/lib/dod-metrics";

/**
 * 이 테스트는 지표의 눈금을 고정한다. 이전 벤치마크가 실패한 지점이 정확히
 * 여기였다. 지표를 검증하지 않으면 지표가 틀렸다는 사실 자체를 알 수 없다.
 */

test("병기 표기를 URL로 세지 않는다 — 예전 지표가 89.9%를 만든 원인", () => {
  const notPaths = [
    "CSV/Excel 파일 다운로드 가능함",
    "관리자가 ERP/CRM 동기화 상태 확인",
    "제출/평가 결과 목록 확인",
    "A/B 테스트 결과 노출",
    "입력/출력 값 확인",
  ];
  for (const dod of notPaths) {
    assert.equal(hasUrlPath(dod), false, dod);
    // 예전 규칙은 이것들을 URL로 셌다. 두 지표가 실제로 다르다는 것을 고정한다.
  }
  assert.equal(hasUrlPathLegacy("CSV/Excel 파일 다운로드 가능함"), true);
  assert.equal(hasUrlPathLegacy("관리자가 ERP/CRM 동기화 상태 확인"), true);
});

test("진짜 경로는 조사·따옴표·문두 어디에 있어도 찾는다", () => {
  assert.deepEqual(extractUrlPaths("`/login`에서 로그인 성공 시 `/orders`로 이동 확인"), [
    "/login",
    "/orders",
  ]);
  assert.deepEqual(extractUrlPaths("/signup에서 비밀번호 입력 시 마스킹 표시 확인"), ["/signup"]);
  assert.deepEqual(extractUrlPaths("일반 고객 계정으로 /admin 직접 접근 시 접근 차단 확인"), ["/admin"]);
  assert.deepEqual(extractUrlPaths("/orders/[id] 상세에서 상태 표시 확인"), ["/orders/[id]"]);
  assert.deepEqual(extractUrlPaths("/admin/orders 목록에서 항목 3건 표시 확인"), ["/admin/orders"]);
});

test("위치도 계기도 없는 역량 서술을 가려낸다", () => {
  assert.equal(isCapabilityStatement("고객이 전체 주문 목록을 확인 가능함"), true);
  assert.equal(isCapabilityStatement("수강생은 본인 결과만 확인 가능함"), true);
  // URL이 있으면 어디서 확인하는지 특정되므로 역량 서술이 아니다.
  assert.equal(isCapabilityStatement("/orders에서 전체 주문 목록 확인 가능"), false);
  // 조작이 명시되면 시나리오로 옮길 수 있으므로 역량 서술이 아니다.
  assert.equal(isCapabilityStatement("주문 취소 버튼 클릭으로 취소 가능"), false);
  assert.equal(isCapabilityStatement("/login에서 로그인 성공 시 /orders로 이동 확인"), false);
});

test("서술형 종결은 체언 종결로 세지 않는다", () => {
  assert.equal(isNounTerminated("/login에서 로그인 성공 시 /orders로 이동 확인"), true);
  assert.equal(isNounTerminated("오류 메시지 표시"), true);
  assert.equal(isNounTerminated("주문 목록 조회 가능"), true);
  assert.equal(isNounTerminated("결제가 정상적으로 처리된다"), false);
  assert.equal(isNounTerminated("사용자는 로그인을 할 수 있다"), false);
  assert.equal(isNounTerminated("오류 메시지가 표시됩니다"), false);
});

test("한 결과를 여러 낱말로 서술한 것은 한 단위로 센다", () => {
  // CLAUDE.md 규칙 5가 요구하는 형태 자체는 복합 조건이 아니다.
  assert.equal(
    countVerificationUnits("'픽업 대기' 상태에서 '배송 완료'로 직접 변경 시도 시 변경 거부 및 오류 메시지 표시 확인"),
    1,
  );
  assert.equal(isAtomic("/login에서 비밀번호를 틀리게 입력 후 로그인 시도 시 오류 메시지 표시 확인"), true);
});

test("접속 표현으로 이어붙인 복합 조건을 잡아낸다", () => {
  assert.equal(
    isAtomic("/login에서 로그인 성공 시 /orders로 이동 확인 그리고 사용자 이름이 헤더에 노출 확인"),
    false,
  );
  assert.equal(countVerificationUnits("주문이 생성 완료되고, 목록에 항목이 표시 확인") >= 2, true);
});

test("원문에 없는 기능 후보를 근거 낱말과 함께 돌려준다", () => {
  const source = "로그인한 사용자가 자신의 할 일을 등록하고 완료 여부를 관리한다.";
  const dods = [
    "/todos에서 할 일 등록 후 목록에 표시 확인",
    "/login에서 비밀번호 재설정 링크 클릭 시 안내 메일 발송 확인",
    "/login에서 소셜 로그인 버튼 클릭 시 카카오 인증 화면 이동 확인",
  ];
  const findings = findOutOfScopeCandidates(dods, source);
  assert.equal(findings.length >= 2, true);
  assert.equal(
    findings.some((finding) => finding.term === "비밀번호 재설정"),
    true,
  );
  // 원문 범위 안의 DoD는 후보로 잡히지 않는다.
  assert.equal(
    findings.some((finding) => finding.dod.includes("할 일 등록")),
    false,
  );
});

test("달성 여부는 하드코딩이 아니라 실제 비교로 결정된다", () => {
  // 예전 리포트는 89.9%를 "90% 이상" 목표에 ✅ 완벽 달성으로 찍었다.
  const metrics = measureDods([
    ...Array.from({ length: 9 }, () => "/orders에서 항목 표시 확인"),
    "주문 목록 조회 가능함",
  ]);
  assert.equal(metrics.urlPathRate, 90);
  const url = evaluateTargets(metrics).find((target) => target.key === "urlPathRate");
  assert.equal(url?.passed, true);

  const worse = measureDods([
    ...Array.from({ length: 8 }, () => "/orders에서 항목 표시 확인"),
    "주문 목록 조회 가능함",
    "결과 목록 확인 가능함",
  ]);
  assert.equal(worse.urlPathRate, 80);
  const failing = evaluateTargets(worse).find((target) => target.key === "urlPathRate");
  assert.equal(failing?.passed, false, "목표 미달이면 반드시 실패로 표시되어야 한다");
});

test("예전 지표와 새 지표의 차이가 리포트에 함께 남는다", () => {
  const metrics = measureDods(["CSV/Excel 다운로드 가능함", "ERP/CRM 동기화 확인"]);
  assert.equal(metrics.urlPathRate, 0);
  assert.equal(metrics.urlPathRateLegacy, 100);
});
