import OpenAI from "openai";

const translationCache = new Map<string, string>();

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

  const cached = translationCache.get(trimmed);
  if (cached) return cached;

  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY is not defined. Returning original text.");
    return trimmed;
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional IT translator. Translate the given Korean text into clear, natural English for a freelance software developer marketplace. Keep technical terms appropriate, such as Next.js and PostgreSQL. Do not add conversational filler, explanations, or quotes. Only output the translated text.",
        },
        {
          role: "user",
          content: trimmed,
        },
      ],
      temperature: 0.1,
    });

    const translated = response.choices[0].message.content?.trim() || trimmed;
    translationCache.set(trimmed, translated);
    return translated;
  } catch (error) {
    console.error("Failed to translate text:", error);
    return trimmed;
  }
}
