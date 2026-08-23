import assert from "node:assert/strict";
import test from "node:test";

import { translateToEnglish } from "@/lib/backend/translation";
import { fixedTranslationCount, lookupFixedTranslation } from "@/lib/backend/translation-dictionary";
import { listSowPresets } from "@/lib/sow-presets";

const assetRental = listSowPresets().find((preset) => preset.id === "asset-rental")!;

function hasKorean(text: string): boolean {
  return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text);
}

/**
 * 키가 있으면 LLM 경로가 열려 있어 이 테스트가 통과해도 아무것도 증명하지 못한다.
 * 확정 영문만으로 화면이 채워지는지 보려면 키를 지운 채로 불러야 한다.
 */
async function translateWithoutKey(text: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;
  try {
    return await translateToEnglish(text);
  } finally {
    if (key !== undefined) process.env.GEMINI_API_KEY = key;
    if (googleKey !== undefined) process.env.GOOGLE_API_KEY = googleKey;
  }
}

test("프리셋의 마일스톤 제목과 완료조건이 전부 대응표에 있다", () => {
  const englishSow = assetRental.englishSow;
  assert.ok(englishSow, "프리셋에 얼려 둔 영문 SOW가 있어야 한다");

  assetRental.milestones.forEach((milestone, index) => {
    const translated = englishSow.translatedMilestones[index];
    assert.equal(lookupFixedTranslation(milestone.title), translated.titleEn);
    milestone.dods.forEach((dod, dodIndex) => {
      assert.equal(lookupFixedTranslation(dod.description), translated.dodsEn[dodIndex]);
    });
  });

  const expected = assetRental.milestones.reduce((sum, milestone) => sum + milestone.dods.length + 1, 0);
  assert.equal(fixedTranslationCount(), expected + 1, "마일스톤·완료조건에 업무 상세 원문 1건을 더한 수");
});

test("업무 상세 원문도 API 키 없이 영문으로 나온다", async () => {
  assert.ok(assetRental.sourceTextEn, "프리셋에 얼려 둔 원문 영문이 있어야 한다");

  const result = await translateWithoutKey(assetRental.sourceText);
  assert.equal(result, assetRental.sourceTextEn.trim());
  assert.equal(hasKorean(result), false);

  // 원문이 통째로 실려야 한다. 잘린 영문을 얼려 두면 문서 끝이 사라진다.
  assert.ok(result.includes("/admin"), "화면 주소 목록까지 번역돼 있어야 한다");
});

test("앞뒤 공백과 줄바꿈이 달라도 같은 문장으로 본다", () => {
  const description = assetRental.milestones[0].dods[0].description;
  const expected = lookupFixedTranslation(description);
  assert.ok(expected);
  assert.equal(lookupFixedTranslation(`  ${description}\n`), expected);
});

test("문장을 고치면 대응표에서 빠진다", () => {
  const edited = `${assetRental.milestones[0].dods[0].description} 그리고 로그아웃 확인`;
  assert.equal(lookupFixedTranslation(edited), null);
});

test("API 키 없이도 프리셋 완료조건이 영문으로 나온다", async () => {
  const englishSow = assetRental.englishSow!;

  for (const [index, milestone] of assetRental.milestones.entries()) {
    const translated = englishSow.translatedMilestones[index];
    assert.equal(await translateWithoutKey(milestone.title), translated.titleEn);

    for (const [dodIndex, dod] of milestone.dods.entries()) {
      const result = await translateWithoutKey(dod.description);
      assert.equal(result, translated.dodsEn[dodIndex]);
      assert.notEqual(result, dod.description);
    }
  }
});

test("대응표에 없는 한국어는 키가 없으면 원문 그대로 나온다", async () => {
  const unknown = "대응표에 없는 문장입니다";
  const result = await translateWithoutKey(unknown);
  assert.equal(result, unknown);
  assert.ok(hasKorean(result));
});
