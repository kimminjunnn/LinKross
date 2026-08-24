import type { MilestoneInput } from "@/lib/rag-translator";
import {
  parseManagedApiCheckTestSpec,
  parseManagedBrowserAtomTestSpec,
  parseManagedBrowserTestSpec,
  parseManualGuidanceSpec,
} from "@/lib/verification-test-spec";

import { ASSET_RENTAL_PRESET } from "@/lib/sow-presets/data/asset-rental";
import {
  SOW_PRESET_MATCH_THRESHOLD,
  normalizeDodDescription,
  normalizeForPresetMatch,
  trigramSimilarity,
} from "@/lib/sow-presets/match";
import type { SowPreset, SowPresetDod, SowPresetMatch } from "@/lib/sow-presets/types";
import type { EnglishSowDraft as SowPresetEnglishSow } from "@/lib/sow-english-prompt";
import type { SowSummaryResult as SowPresetSummary } from "@/lib/sow-summary-prompt";

export { SOW_PRESET_MATCH_THRESHOLD, normalizeDodDescription, normalizeForPresetMatch, trigramSimilarity };
export type { SowPreset, SowPresetDod, SowPresetMatch, SowPresetEnglishSow, SowPresetSummary };

/**
 * 시연용 SOW 프리셋 목록.
 *
 * 프리셋은 `eval/presets/build-sow-preset.mjs`가 만든다. 손으로 고치지 말고
 * 생성기를 다시 돌린다. 새 유형을 추가할 때는 데이터 파일을 만들고 여기에 넣는다.
 */
const REGISTERED_PRESETS: SowPreset[] = [ASSET_RENTAL_PRESET];

/** 저장된 스펙이 실제로 실행 가능한지 확인한다. `src/lib/backend/sow.ts`와 같은 파서를 쓴다. */
function isExecutableSpec(value: unknown): boolean {
  return (
    parseManagedApiCheckTestSpec(value) !== null
    || parseManagedBrowserAtomTestSpec(value) !== null
    || parseManagedBrowserTestSpec(value) !== null
  );
}

/**
 * 자동 검수로 표시됐지만 실행할 수 없는 스펙은 자동에서 내린다.
 *
 * 프리셋 파일이 손으로 편집돼 스펙이 깨지면, 실행되지 않을 항목이 "자동 테스트
 * 준비 완료"로 보인다. 시연 중에 그것이 드러나는 편보다 처음부터 사람 확인으로
 * 내려두는 편이 정직하다. 정상 프리셋에서는 이 경로가 타지 않아야 하며,
 * `sow-presets.test.ts`가 그것을 검사한다.
 */
function sanitizeDod(presetId: string, dod: SowPresetDod): SowPresetDod {
  if (dod.verificationMethod !== "automated_e2e") return dod;
  if (isExecutableSpec(dod.testSpec)) return dod;
  console.error(
    `[sow-presets] ${presetId} 프리셋의 실행 스펙을 해석하지 못했습니다. 사람 확인 항목으로 내립니다: ${dod.description}`,
  );
  return {
    ...dod,
    verificationMethod: "manual",
    testSpec: parseManualGuidanceSpec(dod.testSpec) ?? {},
    design: {
      ...dod.design,
      status: "human_review_required",
      humanReviewAccepted: true,
      message: "자동 테스트 스펙을 확인하지 못해 사람이 직접 확인하는 항목으로 두었습니다.",
    },
  };
}

const SOW_PRESETS: SowPreset[] = REGISTERED_PRESETS.map((preset) => ({
  ...preset,
  milestones: preset.milestones.map((milestone) => ({
    ...milestone,
    dods: milestone.dods.map((dod) => sanitizeDod(preset.id, dod)),
  })),
}));

const NORMALIZED_SOURCE_BY_PRESET = new Map(
  SOW_PRESETS.map((preset) => [preset.id, normalizeForPresetMatch(preset.sourceText)]),
);

const DOD_BY_DESCRIPTION = new Map<string, SowPresetDod>();
for (const preset of SOW_PRESETS) {
  for (const milestone of preset.milestones) {
    for (const dod of milestone.dods) {
      DOD_BY_DESCRIPTION.set(normalizeDodDescription(dod.description), dod);
    }
  }
}

export function listSowPresets(): SowPreset[] {
  return SOW_PRESETS;
}

/**
 * 업무 상세 원문에 대응하는 프리셋을 찾는다. 임계값 미만이면 프리셋을 쓰지 않고
 * 평소대로 LLM 분석 경로로 간다.
 */
export function matchSowPreset(workDetail: string): SowPresetMatch | null {
  const normalized = normalizeForPresetMatch(workDetail);
  if (!normalized) return null;

  let best: SowPresetMatch | null = null;
  for (const preset of SOW_PRESETS) {
    const source = NORMALIZED_SOURCE_BY_PRESET.get(preset.id) ?? "";
    const similarity = trigramSimilarity(normalized, source);
    if (!best || similarity > best.similarity) best = { preset, similarity };
  }
  if (!best || best.similarity < SOW_PRESET_MATCH_THRESHOLD) return null;
  return best;
}

/**
 * 완료조건 문장으로 프리셋 항목을 찾는다.
 *
 * 저장 단계가 이 함수로 실행 스펙을 되찾는다. 문장이 조금이라도 달라지면
 * 찾지 못하고 평소의 분석·조합 경로로 넘어간다. 발주자가 문장을 고쳤다면
 * 그것은 더 이상 프리셋이 보증한 조건이 아니기 때문이다.
 */
export function findPresetDod(description: string): SowPresetDod | null {
  return DOD_BY_DESCRIPTION.get(normalizeDodDescription(description)) ?? null;
}

function parsePresetPeriodDays(period: string): number {
  const match = period.match(/(\d{2})\.(\d{2})\.(\d{2})\s*-\s*(\d{2})\.(\d{2})\.(\d{2})/);
  if (!match) return 1;
  const start = Date.UTC(2000 + Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const end = Date.UTC(2000 + Number(match[4]), Number(match[5]) - 1, Number(match[6]));
  const days = Math.round((end - start) / 86_400_000) + 1;
  return days > 0 ? days : 1;
}

function formatShortDate(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getUTCFullYear() % 100)}.${pad(date.getUTCMonth() + 1)}.${pad(date.getUTCDate())}`;
}

function parseIsoDate(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * 프리셋의 기간 비율을 유지한 채 실제 프로젝트 기간에 다시 나눈다.
 * 프로젝트 기간을 알 수 없으면 프리셋에 적힌 기간을 그대로 쓴다.
 */
function distributePeriods(preset: SowPreset, startDate?: string, endDate?: string): string[] {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  const fallback = preset.milestones.map((milestone) => milestone.period);
  if (start === null || end === null || end < start) return fallback;

  const weights = preset.milestones.map((milestone) => parsePresetPeriodDays(milestone.period));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const totalDays = Math.round((end - start) / 86_400_000) + 1;
  if (totalWeight <= 0 || totalDays < preset.milestones.length) return fallback;

  const periods: string[] = [];
  let cursor = start;
  let assigned = 0;
  weights.forEach((weight, index) => {
    const isLast = index === weights.length - 1;
    const remainingMilestones = weights.length - index - 1;
    const rawDays = Math.round((totalDays * weight) / totalWeight);
    const maxDays = totalDays - assigned - remainingMilestones;
    const days = isLast ? totalDays - assigned : Math.min(Math.max(rawDays, 1), Math.max(maxDays, 1));
    const segmentEnd = cursor + (days - 1) * 86_400_000;
    periods.push(`${formatShortDate(cursor)} - ${formatShortDate(segmentEnd)}`);
    cursor = segmentEnd + 86_400_000;
    assigned += days;
  });
  return periods;
}

/**
 * 프리셋의 금액 비율을 유지한 채 실제 예산에 다시 나눈다.
 * 예산을 알 수 없으면 프리셋 금액을 그대로 쓴다.
 */
function distributeAmounts(preset: SowPreset, budget?: string | number): string[] {
  const presetAmounts = preset.milestones.map((milestone) => Number(String(milestone.amount).replace(/[^0-9]/g, "")) || 0);
  const presetTotal = presetAmounts.reduce((sum, amount) => sum + amount, 0);
  const target = Number(String(budget ?? "").replace(/[^0-9]/g, ""));
  if (!Number.isFinite(target) || target <= 0 || presetTotal <= 0) {
    return preset.milestones.map((milestone) => String(milestone.amount));
  }

  const amounts = presetAmounts.map((amount) => Math.floor((target * amount) / presetTotal));
  const assigned = amounts.reduce((sum, amount) => sum + amount, 0);
  amounts[amounts.length - 1] += target - assigned;
  return amounts.map((amount) => String(amount));
}

/**
 * 프리셋을 화면이 바로 쓰는 마일스톤 입력으로 바꾼다.
 * 완료조건마다 확정된 검수 설계가 함께 실려 나가므로 화면은 추가 분석 없이
 * "자동 테스트 준비 완료" 상태를 보여줄 수 있다.
 */
export function toPresetMilestoneInputs(
  preset: SowPreset,
  options: { startDate?: string; endDate?: string; budget?: string | number } = {},
): MilestoneInput[] {
  const periods = distributePeriods(preset, options.startDate, options.endDate);
  const amounts = distributeAmounts(preset, options.budget);
  return preset.milestones.map((milestone, index) => ({
    id: `m-${index + 1}`,
    code: milestone.code,
    title: milestone.title,
    period: periods[index] ?? milestone.period,
    amount: amounts[index] ?? String(milestone.amount),
    dods: milestone.dods.map((dod) => dod.description),
    verificationDesigns: milestone.dods.map((dod) => dod.design),
  }));
}

/**
 * 프리셋이 보증하는 영문 SOW 초안을 꺼낸다.
 *
 * 원문이 프리셋과 맞아도 발주자가 완료조건 문장을 고쳤다면 얼려 둔 영문 초안은
 * 더 이상 그 문서를 설명하지 못한다. 그래서 마일스톤 구성과 완료조건 문장이
 * 프리셋과 완전히 같을 때만 돌려준다. 하나라도 다르면 null이고,
 * 호출부는 평소의 LLM 경로로 간다. `findPresetDod`와 같은 판단 기준이다.
 */
export function matchPresetEnglishSow(
  workDetail: string,
  milestones: Array<{ dods: string[] }>,
): SowPresetEnglishSow | null {
  const matched = matchSowPreset(workDetail);
  const englishSow = matched?.preset.englishSow;
  if (!matched || !englishSow) return null;

  const presetMilestones = matched.preset.milestones;
  if (milestones.length !== presetMilestones.length) return null;
  if (englishSow.translatedMilestones.length !== presetMilestones.length) return null;

  const sameDods = milestones.every((milestone, index) => {
    const presetDods = presetMilestones[index].dods;
    if (milestone.dods.length !== presetDods.length) return false;
    return milestone.dods.every(
      (dod, dodIndex) => normalizeDodDescription(dod) === normalizeDodDescription(presetDods[dodIndex].description),
    );
  });
  return sameDods ? englishSow : null;
}

/**
 * 프리셋이 보증하는 승인 화면 요약을 꺼낸다.
 *
 * 요약은 완료조건 목록이 아니라 프로젝트 전체를 한 문장으로 줄인 것이라, 문장
 * 하나가 바뀌어도 요약이 통째로 틀리지는 않는다. 그래서 영문 초안과 달리 원문
 * 유사도만 본다. 프리셋을 고른 것과 같은 기준이다.
 */
export function matchPresetSowSummary(workDetailKo: string): SowPresetSummary | null {
  return matchSowPreset(workDetailKo)?.preset.sowSummary ?? null;
}
