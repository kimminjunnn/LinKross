/**
 * 발주자가 붙여넣은 업무 상세가 어느 프리셋의 원문인지 판별한다.
 *
 * 글자 하나까지 같아야 한다면 프리셋은 쓸모가 없다. 붙여넣기 과정에서 줄바꿈이
 * 접히고, 오타가 섞이고, 화면이 예산 머리말을 앞에 붙인다. 그래서 완전 일치가
 * 아니라 유사도로 고른다.
 *
 * 유사도는 3글자 조각(trigram)의 Dice 계수다. 편집거리는 8천 자 원문에서
 * 백만 단위 비교가 되고, 단어 단위 비교는 한국어 조사 변화에 약하다. trigram은
 * 한 번 훑어 만들 수 있고, 오타 몇 개는 주변 조각 세 개만 어긋나므로 긴 원문에서
 * 값이 거의 떨어지지 않는다. 반대로 원문의 절반만 붙여넣으면 0.7 아래로 내려가
 * 임계값을 넘지 못한다.
 */

/** 이 값 이상이어야 프리셋으로 인정한다. */
export const SOW_PRESET_MATCH_THRESHOLD = 0.9;

const TRIGRAM_SIZE = 3;

/**
 * 비교 전에 원문에서 의미 없는 차이를 걷어낸다.
 *
 * - 화면이 붙이는 `예산: 8000 USDC` 머리말은 발주자가 쓴 문장이 아니다.
 * - 첨부 파일 삽입 표시도 원문 자체가 아니다.
 * - 공백과 줄바꿈은 붙여넣기 경로에 따라 달라지므로 전부 없앤다.
 */
export function normalizeForPresetMatch(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/^\s*예산\s*[:：].*$/gm, "")
    .replace(/^\s*\[첨부 파일 내용:[^\]]*\]\s*$/gm, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function toTrigramCounts(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (let index = 0; index + TRIGRAM_SIZE <= text.length; index += 1) {
    const gram = text.slice(index, index + TRIGRAM_SIZE);
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }
  return counts;
}

/** 0(전혀 다름) ~ 1(같음). 정규화된 문자열을 받는다. */
export function trigramSimilarity(left: string, right: string): number {
  if (left === right) return 1;
  if (left.length < TRIGRAM_SIZE || right.length < TRIGRAM_SIZE) return 0;

  const leftCounts = toTrigramCounts(left);
  const rightCounts = toTrigramCounts(right);
  let leftTotal = 0;
  let rightTotal = 0;
  let shared = 0;

  for (const count of leftCounts.values()) leftTotal += count;
  for (const [gram, count] of rightCounts) {
    rightTotal += count;
    shared += Math.min(count, leftCounts.get(gram) ?? 0);
  }
  if (leftTotal + rightTotal === 0) return 0;
  return (2 * shared) / (leftTotal + rightTotal);
}

/** 완료조건 문장 비교용 정규화. 문장 부호까지 지우면 서로 다른 조건이 같아 보인다. */
export function normalizeDodDescription(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim().replace(/[.。]+$/, "");
}
