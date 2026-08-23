import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { isSettledStatus } from "@/lib/dod-verification-state";
import {
  SOW_PRESET_MATCH_THRESHOLD,
  findPresetDod,
  listSowPresets,
  matchPresetEnglishSow,
  matchPresetSowSummary,
  matchSowPreset,
  normalizeForPresetMatch,
  toPresetMilestoneInputs,
  trigramSimilarity,
} from "@/lib/sow-presets";
import {
  parseManagedApiCheckTestSpec,
  parseManagedBrowserAtomTestSpec,
  parseManagedBrowserTestSpec,
  parseManualGuidanceSpec,
} from "@/lib/verification-test-spec";

const assetRental = listSowPresets().find((preset) => preset.id === "asset-rental")!;

/** 원문에 오타를 흩뿌린다. 붙여넣다 몇 글자 어긋난 상황을 흉내 낸다. */
function scatterTypos(text: string, count: number): string {
  const characters = [...text];
  const stride = Math.floor(characters.length / (count + 1));
  for (let index = 1; index <= count; index += 1) {
    characters[stride * index] = "X";
  }
  return characters.join("");
}

test("프리셋은 원문을 그대로 붙여넣으면 찾는다", () => {
  const match = matchSowPreset(assetRental.sourceText);
  assert.equal(match?.preset.id, "asset-rental");
  assert.equal(match?.similarity, 1);
});

test("오타가 몇 개 섞여도 프리셋을 찾는다", () => {
  const match = matchSowPreset(scatterTypos(assetRental.sourceText, 20));
  assert.equal(match?.preset.id, "asset-rental");
  assert.ok(match!.similarity >= SOW_PRESET_MATCH_THRESHOLD);
});

test("화면이 앞에 붙이는 예산 머리말이 있어도 프리셋을 찾는다", () => {
  const match = matchSowPreset(`예산: 9000 USDC\n\n${assetRental.sourceText}`);
  assert.equal(match?.preset.id, "asset-rental");
});

test("줄바꿈과 공백이 달라져도 프리셋을 찾는다", () => {
  const match = matchSowPreset(assetRental.sourceText.replace(/\n/g, " ").replace(/ {2,}/g, " "));
  assert.equal(match?.preset.id, "asset-rental");
});

test("다른 프로젝트 원문은 프리셋으로 오인하지 않는다", () => {
  const other = fs.readFileSync("eval/presets/todo-crud.txt", "utf8");
  assert.equal(matchSowPreset(other), null);
  assert.ok(
    trigramSimilarity(normalizeForPresetMatch(other), normalizeForPresetMatch(assetRental.sourceText)) < 0.5,
  );
});

test("원문의 앞부분만 붙여넣으면 프리셋을 쓰지 않는다", () => {
  assert.equal(matchSowPreset(assetRental.sourceText.slice(0, 2000)), null);
});

test("빈 입력은 프리셋을 찾지 않는다", () => {
  assert.equal(matchSowPreset("   \n  "), null);
});

test("자동 검수로 표시된 완료조건은 모두 실행 가능한 스펙을 가진다", () => {
  const automated = assetRental.milestones.flatMap((milestone) =>
    milestone.dods.filter((dod) => dod.verificationMethod === "automated_e2e"),
  );
  assert.ok(automated.length > 0);
  for (const dod of automated) {
    const executable =
      parseManagedApiCheckTestSpec(dod.testSpec)
      ?? parseManagedBrowserAtomTestSpec(dod.testSpec)
      ?? parseManagedBrowserTestSpec(dod.testSpec);
    assert.ok(executable, `실행 스펙을 해석하지 못했습니다: ${dod.description}`);
    assert.equal(dod.design.status, "automation_ready");
  }
});

test("사람 확인 항목은 확인 방법 안내를 가진다", () => {
  const manual = assetRental.milestones.flatMap((milestone) =>
    milestone.dods.filter((dod) => dod.verificationMethod === "manual"),
  );
  for (const dod of manual) {
    assert.ok(parseManualGuidanceSpec(dod.testSpec), `안내가 없습니다: ${dod.description}`);
    assert.equal(dod.design.status, "human_review_required");
  }
});

test("프리셋의 모든 완료조건은 사용자가 더 할 일이 없는 상태다", () => {
  for (const milestone of assetRental.milestones) {
    for (const dod of milestone.dods) {
      assert.ok(isSettledStatus(dod.design), `아직 확정되지 않았습니다: ${dod.description}`);
      assert.equal(dod.design.question, undefined);
    }
  }
});

test("완료조건 문장으로 확정된 스펙을 되찾는다", () => {
  const first = assetRental.milestones[0].dods[0];
  assert.equal(findPresetDod(first.description)?.description, first.description);
  // 문장 끝의 마침표와 공백 차이는 같은 조건으로 본다.
  assert.equal(findPresetDod(` ${first.description}. `)?.description, first.description);
});

test("완료조건 문장을 고치면 프리셋 스펙을 쓰지 않는다", () => {
  const first = assetRental.milestones[0].dods[0];
  assert.equal(findPresetDod(`${first.description} 그리고 로그아웃 확인`), null);
});

test("마일스톤 금액은 프로젝트 예산에 맞춰 비율대로 나뉜다", () => {
  const milestones = toPresetMilestoneInputs(assetRental, {
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    budget: "12000",
  });
  const total = milestones.reduce((sum, milestone) => sum + Number(milestone.amount), 0);
  assert.equal(total, 12000);
  assert.ok(new Set(milestones.map((milestone) => milestone.amount)).size > 1);
});

test("마일스톤 기간은 프로젝트 기간 안에서 이어진다", () => {
  const milestones = toPresetMilestoneInputs(assetRental, {
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    budget: "12000",
  });
  assert.equal(milestones[0].period.startsWith("26.09.01"), true);
  assert.equal(milestones[milestones.length - 1].period.endsWith("26.09.30"), true);
  for (const milestone of milestones) {
    assert.match(milestone.period, /^\d{2}\.\d{2}\.\d{2} - \d{2}\.\d{2}\.\d{2}$/);
  }
});

test("프로젝트 기간과 예산을 모르면 프리셋 값을 그대로 쓴다", () => {
  const milestones = toPresetMilestoneInputs(assetRental);
  assert.equal(milestones[0].period, assetRental.milestones[0].period);
  assert.equal(milestones[0].amount, assetRental.milestones[0].amount);
});

test("화면에 넘기는 마일스톤에는 확정된 검수 설계가 함께 실린다", () => {
  const milestones = toPresetMilestoneInputs(assetRental);
  for (const [index, milestone] of milestones.entries()) {
    assert.equal(milestone.dods.length, assetRental.milestones[index].dods.length);
    assert.equal(milestone.verificationDesigns?.length, milestone.dods.length);
    assert.ok(milestone.verificationDesigns?.every((design) => isSettledStatus(design)));
  }
});

/** 화면이 영문 SOW를 만들 때 넘기는 모양. 프리셋 그대로일 때를 흉내 낸다. */
function presetMilestoneShape() {
  return assetRental.milestones.map((milestone) => ({
    dods: milestone.dods.map((dod) => dod.description),
  }));
}

test("프리셋 원문과 완료조건이 그대로면 얼려 둔 영문 초안을 쓴다", () => {
  const frozen = matchPresetEnglishSow(assetRental.sourceText, presetMilestoneShape());
  assert.ok(frozen, "프리셋에 영문 초안이 실려 있어야 한다");
  assert.equal(frozen.translatedMilestones.length, assetRental.milestones.length);
  frozen.translatedMilestones.forEach((translated, index) => {
    assert.equal(translated.dodsEn.length, assetRental.milestones[index].dods.length);
  });
  assert.ok(frozen.background.trim().length > 0);
  assert.ok(frozen.acceptanceCriteria.length > 0);
});

test("완료조건 문장을 하나라도 고치면 얼려 둔 영문 초안을 쓰지 않는다", () => {
  const edited = presetMilestoneShape();
  edited[0].dods[0] = `${edited[0].dods[0]} 그리고 로그아웃 확인`;
  assert.equal(matchPresetEnglishSow(assetRental.sourceText, edited), null);
});

test("마일스톤을 지우면 얼려 둔 영문 초안을 쓰지 않는다", () => {
  assert.equal(matchPresetEnglishSow(assetRental.sourceText, presetMilestoneShape().slice(0, 2)), null);
});

test("다른 프로젝트 원문에는 얼려 둔 영문 초안을 쓰지 않는다", () => {
  assert.equal(matchPresetEnglishSow("전혀 다른 프로젝트입니다. 쇼핑몰을 만들어 주세요.", presetMilestoneShape()), null);
});

test("승인 화면 요약은 원문이 프리셋이면 얼려 둔 값을 쓴다", () => {
  const summary = matchPresetSowSummary(assetRental.sourceText);
  assert.ok(summary, "프리셋에 승인 요약이 실려 있어야 한다");
  for (const value of [summary.coreScope, summary.keyAcceptance, summary.needsReview]) {
    assert.ok(value.trim().length > 0);
  }
  assert.ok(summary.english?.coreScope.trim());
});

test("다른 프로젝트 원문에는 얼려 둔 승인 요약을 쓰지 않는다", () => {
  assert.equal(matchPresetSowSummary("전혀 다른 프로젝트입니다. 쇼핑몰을 만들어 주세요."), null);
});
