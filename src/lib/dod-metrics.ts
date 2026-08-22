/**
 * DoD 문장 품질의 관찰 가능한 측정.
 *
 * 이 모듈이 존재하는 이유는 이전 벤치마크(`sow_evaluations/benchmark_105_dataset.mjs`)의
 * 지표가 실제 품질과 연결되어 있지 않았기 때문이다. 그 정규식은
 * `/\/([a-zA-Z0-9_\-:]+)/` 였는데, 이것은 "CSV/Excel", "ERP/CRM", "A/B" 같은
 * 한국어 문서의 일반적인 병기 표기까지 URL로 집계했다. 그래서 URL을 한 개도
 * 쓰지 않은 결과물이 89.9% 준수로 보고될 수 있었다.
 *
 * 따라서 이 모듈의 모든 판정 함수는 다음을 지킨다.
 * - 오탐이 나면 지표 전체가 무의미해지므로, 애매하면 통과가 아니라 불통으로 센다.
 * - 판정 근거를 문자열로 함께 돌려주어 사람이 표본을 직접 검증할 수 있게 한다.
 * - 순수 함수이므로 네트워크 없이 단위 테스트로 눈금을 고정할 수 있다.
 */

/** 관찰 가능한 결과를 뜻하는 체언 종결 어휘(CLAUDE.md §5 규칙 4). */
const RESULT_NOUNS = [
  "확인",
  "표시",
  "이동",
  "차단",
  "노출",
  "유지",
  "완료",
  "거부",
  "제한",
  "생성",
  "삭제",
  "저장",
  "반영",
  "복원",
] as const;

/** 사용자의 조작·계기를 뜻하는 표현. 행동 없는 역량 서술을 가려내는 데 쓴다. */
const TRIGGER_MARKERS = [
  "클릭",
  "입력",
  "선택",
  "제출",
  "눌러",
  "누르",
  "시도",
  "접근",
  "새로고침",
  "업로드",
  "이동 시",
  "요청",
  "전환",
  "스크롤",
] as const;

/**
 * 진짜 URL 경로를 찾는다.
 *
 * 슬래시 앞에 영숫자나 한글이 오면 그것은 경로가 아니라 병기 표기다
 * (`CSV/Excel`, `ERP/CRM`, `제출/평가`, `A/B`). 그 경우를 제외해야 지표가
 * 의미를 갖는다. 경로 세그먼트는 영문으로 시작하는 것만 인정한다.
 */
const URL_PATH_PATTERN =
  /(?<![A-Za-z0-9가-힣])\/[A-Za-z][A-Za-z0-9\-_]*(?:\/(?:\[[A-Za-z0-9\-_]+\]|[A-Za-z0-9\-_]+))*/g;

export function extractUrlPaths(dod: string): string[] {
  return [...dod.matchAll(URL_PATH_PATTERN)].map((match) => match[0]);
}

export function hasUrlPath(dod: string): boolean {
  return extractUrlPaths(dod).length > 0;
}

/** 예전 벤치마크가 쓰던 느슨한 규칙. 두 지표의 차이를 보여주기 위해서만 유지한다. */
export function hasUrlPathLegacy(dod: string): boolean {
  return /\/([a-zA-Z0-9_\-:]+)/.test(dod);
}

/**
 * 행동도 위치도 없이 능력만 주장하는 문장인지 판정한다.
 *
 * "고객이 전체 주문 목록을 확인 가능함"은 체언 종결 규칙은 지켰지만 어느 화면에서
 * 무엇을 해야 무엇이 보이는지가 없어 Playwright 시나리오로 옮길 수 없다.
 * `가능`은 CLAUDE.md가 허용한 종결 어휘이므로 종결형만으로 판정하지 않고,
 * 위치(URL)와 계기(조작)가 모두 없을 때만 역량 서술로 센다.
 */
export function isCapabilityStatement(dod: string): boolean {
  const text = dod.trim();
  const endsWithCapability = /(가능함|가능|할 수 있음|할 수 있음\.|가능해짐)\s*$/.test(text);
  if (!endsWithCapability) return false;
  if (hasUrlPath(text)) return false;
  return !TRIGGER_MARKERS.some((marker) => text.includes(marker));
}

/** 체언(명사) 종결인지. 서술형 종결(~한다/~된다/~있다)은 규칙 위반이다. */
export function isNounTerminated(dod: string): boolean {
  const text = dod.trim().replace(/[.\s]+$/, "");
  if (/(한다|된다|있다|없다|한다\.|합니다|됩니다|입니다)$/.test(text)) return false;
  return /(가능|[가-힣]+함|[가-힣]+됨|음)$/.test(text) || RESULT_NOUNS.some((noun) => text.endsWith(noun));
}

/**
 * 한 문장에 검증 단위가 여러 개 묶였는지 판정한다.
 *
 * 원자적이지 않은 DoD는 하나가 실패했을 때 무엇이 실패했는지 알 수 없고, atom
 * 조합 단계에서도 단일 시나리오로 옮길 수 없다. 결과 어휘가 접속 표현을 사이에
 * 두고 두 번 이상 나오면 복합 조건으로 센다.
 */
export function isAtomic(dod: string): boolean {
  return countVerificationUnits(dod) <= 1;
}

export function countVerificationUnits(dod: string): number {
  const text = dod.trim();
  // 결과 어휘가 몇 번 등장하는지 센다. "이동 확인"처럼 인접해 붙은 것은 한 단위다.
  const hits: number[] = [];
  for (const noun of RESULT_NOUNS) {
    let index = text.indexOf(noun);
    while (index >= 0) {
      hits.push(index);
      index = text.indexOf(noun, index + noun.length);
    }
  }
  if (hits.length <= 1) return hits.length;
  hits.sort((a, b) => a - b);

  // 6자 이내로 붙어 있는 결과 어휘는 "변경 거부 및 오류 메시지 표시"처럼 하나의
  // 결과를 여러 낱말로 서술한 것이므로 한 단위로 묶는다.
  let units = 1;
  for (let index = 1; index < hits.length; index += 1) {
    const gap = text.slice(hits[index - 1], hits[index]);
    const joinedByConjunction = /(그리고|하고|하며|또한|,|;|→)/.test(gap);
    if (gap.length > 6 && joinedByConjunction) units += 1;
  }
  return units;
}

/**
 * DoD가 원문에 없는 기능을 만들어냈는지 가려낼 후보를 찾는다.
 *
 * 형태소 분석 없이 판정하므로 이 값은 확정이 아니라 사람이 볼 후보 목록이다.
 * 지표를 자동 판정처럼 쓰면 CLAUDE.md §7(불확실성을 함께 보여준다)에 어긋나므로
 * 비율이 아니라 근거가 되는 낱말과 함께 돌려준다.
 */
const SCOPE_SENTINELS = [
  "비밀번호 재설정",
  "소셜 로그인",
  "회원 탈퇴",
  "카카오",
  "구글 로그인",
  "2단계 인증",
  "결제",
  "환불",
  "쿠폰",
  "다크 모드",
  "다국어",
  "푸시 알림",
] as const;

export interface ScopeFinding {
  dod: string;
  term: string;
}

export function findOutOfScopeCandidates(dods: string[], sourceText: string): ScopeFinding[] {
  const source = sourceText.replace(/\s/g, "");
  const findings: ScopeFinding[] = [];
  for (const dod of dods) {
    for (const term of SCOPE_SENTINELS) {
      if (dod.includes(term) && !source.includes(term.replace(/\s/g, ""))) {
        findings.push({ dod, term });
      }
    }
  }
  return findings;
}

export interface DodMetrics {
  total: number;
  withUrlPath: number;
  withUrlPathLegacy: number;
  capabilityStatements: number;
  nounTerminated: number;
  atomic: number;
  urlPathRate: number;
  urlPathRateLegacy: number;
  capabilityRate: number;
  nounTerminationRate: number;
  atomicRate: number;
}

export function measureDods(dods: string[]): DodMetrics {
  const total = dods.length;
  const withUrlPath = dods.filter(hasUrlPath).length;
  const withUrlPathLegacy = dods.filter(hasUrlPathLegacy).length;
  const capabilityStatements = dods.filter(isCapabilityStatement).length;
  const nounTerminated = dods.filter(isNounTerminated).length;
  const atomic = dods.filter(isAtomic).length;
  const rate = (value: number) => (total === 0 ? 0 : Math.round((value / total) * 1000) / 10);
  return {
    total,
    withUrlPath,
    withUrlPathLegacy,
    capabilityStatements,
    nounTerminated,
    atomic,
    urlPathRate: rate(withUrlPath),
    urlPathRateLegacy: rate(withUrlPathLegacy),
    capabilityRate: rate(capabilityStatements),
    nounTerminationRate: rate(nounTerminated),
    atomicRate: rate(atomic),
  };
}

export interface MetricTarget {
  key: keyof DodMetrics;
  label: string;
  target: number;
  direction: "min" | "max";
}

/**
 * 성공 기준. 리포트가 달성 여부를 실제로 비교하도록 값과 방향을 함께 둔다.
 * 예전 리포트는 이 칸이 문자열 리터럴 "✅ 완벽 달성"이라 89.9%가 90% 목표를
 * 통과한 것으로 찍혔다.
 */
export const DOD_METRIC_TARGETS: MetricTarget[] = [
  { key: "urlPathRate", label: "실제 URL 경로 명시율", target: 90, direction: "min" },
  { key: "capabilityRate", label: "역량 서술('~가능함') 비율", target: 5, direction: "max" },
  { key: "nounTerminationRate", label: "체언 종결 준수율", target: 95, direction: "min" },
  { key: "atomicRate", label: "단일 검증 원자성", target: 95, direction: "min" },
];

export function evaluateTargets(metrics: DodMetrics): Array<MetricTarget & { value: number; passed: boolean }> {
  return DOD_METRIC_TARGETS.map((target) => {
    const value = metrics[target.key] as number;
    const passed = target.direction === "min" ? value >= target.target : value <= target.target;
    return { ...target, value, passed };
  });
}
