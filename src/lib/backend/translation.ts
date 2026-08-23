import { lookupFixedTranslation } from "@/lib/backend/translation-dictionary";
import { GEMINI_KEY_MISSING_MESSAGE, generateText, hasGeminiKey } from "@/lib/llm/gemini";

const translationCache = new Map<string, string>();

/**
 * 번역 프롬프트. 프리셋에 얼려 둘 영문을 만드는 생성기와 공유한다
 * (`eval/presets/build-preset-english.mjs`). 생성기가 제 프롬프트를 따로 두면
 * 얼려 둔 문장과 LLM 경로의 문장이 서로 다른 물건이 된다.
 */
export const TRANSLATION_SYSTEM_MESSAGE =
  "You are a professional IT translator. Translate the given Korean text into clear, natural English "
  + "for a freelance software developer marketplace. Keep technical terms appropriate, such as Next.js "
  + "and PostgreSQL. Do not add conversational filler, explanations, or quotes. Only output the translated text.";

function hasKorean(text: string): boolean {
  return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text);
}

export async function translateToEnglish(text: string | null | undefined): Promise<string> {
  if (!text) return "";

  const trimmed = text.trim();
  if (!trimmed) return "";

  if (!hasKorean(trimmed)) {
    return trimmed;
  }

  // 확정 영문이 있으면 LLM보다 먼저 쓴다. 키가 없어도 나와야 하므로 키 검사보다
  // 앞이어야 하고, 사람이 검토해 얼려 둔 문장이므로 캐시보다도 앞이다.
  const fixed = lookupFixedTranslation(trimmed);
  if (fixed) return fixed;

  const cached = translationCache.get(trimmed);
  if (cached) return cached;

  if (!hasGeminiKey()) {
    console.warn(`${GEMINI_KEY_MISSING_MESSAGE} 원문을 그대로 반환합니다.`);
    return trimmed;
  }

  try {
    const translated =
      (await generateText({
        system: TRANSLATION_SYSTEM_MESSAGE,
        user: trimmed,
        temperature: 0.1,
      })) || trimmed;
    translationCache.set(trimmed, translated);
    return translated;
  } catch (error) {
    console.error("Failed to translate text:", error);
    return trimmed;
  }
}
