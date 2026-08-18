import OpenAI from "openai";

// Simple in-memory cache to prevent redundant API calls
const translationCache = new Map<string, string>();

/**
 * Checks if a string contains Korean characters.
 */
function hasKorean(text: string): boolean {
  return /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
}

/**
 * Translates a single text segment to English using OpenAI.
 */
export async function translateToEnglish(text: string | null | undefined): Promise<string> {
  if (!text) return "";

  const trimmed = text.trim();
  if (!trimmed) return "";

  // Return original text if no Korean characters detected
  if (!hasKorean(trimmed)) {
    return trimmed;
  }

  // Check cache first
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
      model: "gpt-4o-mini", // Cost-effective and fast model
      messages: [
        {
          role: "system",
          content: "You are a professional IT translator. Translate the given Korean text into clear, natural English for a freelance software developer marketplace. Keep the technical terms appropriate (e.g. Next.js, PostgreSQL). Do not add any conversational filler, explanations, or quotes. Only output the exact translated text.",
        },
        {
          role: "user",
          content: trimmed,
        },
      ],
      temperature: 0.1,
    });

    const translated = response.choices[0].message.content?.trim() || trimmed;
    // Cache the result
    translationCache.set(trimmed, translated);
    return translated;
  } catch (error) {
    console.error("Failed to translate text:", error);
    return trimmed; // Fallback to original text in case of failure
  }
}
