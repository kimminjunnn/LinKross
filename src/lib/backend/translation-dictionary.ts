import { listSowPresets, normalizeDodDescription } from "@/lib/sow-presets";

/**
 * 한국어 원문에 대응하는 확정 영문 대응표.
 *
 * `translateToEnglish`는 필드 하나마다 LLM을 부른다. 프리랜서가 SOW 승인 화면을
 * 한 번 열면 마일스톤 제목과 완료조건만으로 50회가 나간다. 무료 등급은 모델당
 * 분당 5회라 화면이 열리는 순간 한도가 끝나고, 그 뒤로는 원문이 그대로 노출된다.
 *
 * 프리셋에는 사람이 읽고 확정한 영문이 이미 들어 있다
 * (`englishSow.translatedMilestones`). 같은 문장을 열 때마다 다시 번역할 이유가
 * 없으므로 여기서 꺼내 쓴다. 대응표에 없는 문장은 평소대로 LLM 경로로 간다.
 */

/**
 * `findPresetDod`와 같은 기준으로 문장을 맞춘다.
 *
 * 문장이 조금이라도 다르면 프리셋이 보증한 문장이 아니므로 대응표에서 빠지는
 * 편이 맞다. 다만 붙여넣기나 저장 경로에서 생기는 공백·줄바꿈 차이까지 다른
 * 문장으로 볼 이유는 없어, 완료조건 비교와 같은 정규화를 그대로 쓴다.
 */
function normalizeKey(value: string): string {
  return normalizeDodDescription(value);
}

function register(entries: Map<string, string>, korean: string, english: string): void {
  const key = normalizeKey(korean);
  const value = english.trim();
  if (!key || !value) return;
  entries.set(key, value);
}

/**
 * 프리셋의 얼려 둔 영문에서 대응표를 만든다.
 *
 * `titleEn`과 `dodsEn`은 프리셋 마일스톤과 순서로만 짝지어져 있다. 개수가
 * 어긋나면 엉뚱한 문장에 남의 번역이 붙으므로, 그 마일스톤은 통째로 빼고
 * LLM 경로로 보낸다. 생성기를 거친 정상 프리셋에서는 이 경로가 타지 않는다.
 */
function buildPresetTranslations(): Map<string, string> {
  const entries = new Map<string, string>();

  for (const preset of listSowPresets()) {
    // 업무 상세 원문. SOW 승인 화면이 이 한 건을 통째로 번역하던 자리다.
    if (preset.sourceTextEn) register(entries, preset.sourceText, preset.sourceTextEn);

    const translatedMilestones = preset.englishSow?.translatedMilestones;
    if (!translatedMilestones) continue;

    if (translatedMilestones.length !== preset.milestones.length) {
      console.error(
        `[translation-dictionary] ${preset.id} 프리셋의 영문 마일스톤 개수가 맞지 않습니다: `
          + `한국어 ${preset.milestones.length}개 · 영문 ${translatedMilestones.length}개`,
      );
      continue;
    }

    preset.milestones.forEach((milestone, index) => {
      const translated = translatedMilestones[index];
      if (translated.dodsEn.length !== milestone.dods.length) {
        console.error(
          `[translation-dictionary] ${preset.id} 프리셋 '${milestone.title}'의 영문 완료조건 개수가 `
            + `맞지 않습니다: 한국어 ${milestone.dods.length}개 · 영문 ${translated.dodsEn.length}개`,
        );
        return;
      }

      register(entries, milestone.title, translated.titleEn);
      milestone.dods.forEach((dod, dodIndex) => {
        register(entries, dod.description, translated.dodsEn[dodIndex]);
      });
    });
  }

  return entries;
}

const FIXED_TRANSLATIONS = buildPresetTranslations();

/** 확정 영문이 있으면 돌려준다. 없으면 null이고, 호출부는 LLM 경로로 간다. */
export function lookupFixedTranslation(text: string): string | null {
  return FIXED_TRANSLATIONS.get(normalizeKey(text)) ?? null;
}

/** 대응표에 담긴 문장 수. 테스트와 점검 스크립트가 쓴다. */
export function fixedTranslationCount(): number {
  return FIXED_TRANSLATIONS.size;
}
