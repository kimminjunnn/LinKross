"use server";

export async function translateTextWithMyMemory(text: string): Promise<string> {
  if (!text || !text.trim()) return "";
  
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|en`);
    if (!res.ok) {
      console.warn("MyMemory API returned status:", res.status);
      return text;
    }
    
    const data = await res.json();
    if (data && data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
    
    return text; // API 실패 시 원본 반환
  } catch (error) {
    console.error("Translation API error:", error);
    return text; // 통신 에러 시 원본 반환
  }
}
