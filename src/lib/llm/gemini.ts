/**
 * Gemini 호출을 한 곳으로 모은다.
 *
 * 호출부가 여섯 곳이고 전부 "시스템 지시 + 사용자 입력 + JSON 스키마"라는 같은
 * 모양이었다. 각자 SDK를 직접 부르면 모델 이름, 온도, 잘림 처리, 안전 차단 처리가
 * 파일마다 조금씩 달라진다. 여기서만 정하고 호출부는 무엇을 물을지에 집중한다.
 *
 * `server-only`를 붙이지 않는다. `eval/run-sow-eval.mjs`와 `eval/compare-models.mjs`는
 * `--conditions=react-server` 없이 도는 평가 스크립트라 붙이면 로드 자체가 실패한다.
 * 키는 `NEXT_PUBLIC_` 접두사가 없어 Next.js가 클라이언트 번들에 넣지 않는다.
 */

import { GoogleGenAI, ThinkingLevel, type GenerateContentResponseUsageMetadata } from "@google/genai";

/**
 * 구조화 출력과 긴 한국어 입력을 다루는 기본 모델.
 *
 * 2026-08-23 실측으로 고른 값이다. `gemini-2.5-*`는 목록에는 보이지만 신규 키에
 * 404를 돌려준다. `gemini-3.7-flash`는 503(수요 초과)이 났고, `gemini-3.6-flash`는
 * 같은 호출에 12~14초가 걸렸다. `gemini-3.5-flash`가 1초 안팎으로 안정적이었다.
 */
export const GEMINI_DEFAULT_MODEL = "gemini-3.5-flash";
/** 번역·요약처럼 짧고 값싼 호출에 쓰는 모델. 같은 실측에서 0.8초. */
export const GEMINI_LIGHT_MODEL = "gemini-3.5-flash-lite";

export const GEMINI_KEY_MISSING_MESSAGE =
  "GEMINI_API_KEY가 설정되지 않았습니다. .env.local 파일에 키를 추가해주세요.";

export type GeminiModelTier = "default" | "light";

export function geminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || undefined;
}

export function hasGeminiKey(): boolean {
  return Boolean(geminiApiKey());
}

/**
 * 모델 이름은 환경변수로 덮어쓸 수 있게 둔다. 평가 스크립트가 같은 코드 경로로
 * 여러 모델을 비교해야 하고, 시연 중 한도에 걸리면 파일을 고치지 않고 낮은
 * 모델로 내려갈 수 있어야 한다.
 */
export function geminiModel(tier: GeminiModelTier = "default"): string {
  if (tier === "light") {
    return process.env.GEMINI_MODEL_LIGHT || GEMINI_LIGHT_MODEL;
  }
  return process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL;
}

/**
 * 사고(thinking) 수준.
 *
 * 예전 `thinkingBudget` 숫자는 쓰지 않는다. 실측에서 `thinkingBudget: 0`이
 * `gemini-3.6-flash`와 `gemini-3.5-flash-lite`에 400을 냈다. Gemini 3 계열은
 * `thinkingLevel`을 받는다.
 *
 * 기본은 `low`다. 사고 토큰은 `maxOutputTokens`를 같이 갉아먹어서 켜 두면 JSON이
 * 완성되기 전에 한도에 닿아 잘린 응답이 늘고, 시연 대기 시간도 길어진다.
 * `minimal`은 `gemini-3.7-flash`가 거부하므로 기본값으로 쓰지 않는다.
 * 빈 값으로 두면 설정을 아예 보내지 않고 모델 기본에 맡긴다.
 */
const THINKING_LEVELS: Record<string, ThinkingLevel> = {
  minimal: ThinkingLevel.MINIMAL,
  low: ThinkingLevel.LOW,
  medium: ThinkingLevel.MEDIUM,
  high: ThinkingLevel.HIGH,
};

function thinkingConfig(): { thinkingConfig?: { thinkingLevel: ThinkingLevel } } {
  const raw = process.env.GEMINI_THINKING_LEVEL;
  if (raw !== undefined && raw.trim() === "") return {};
  const level = THINKING_LEVELS[(raw ?? "low").trim().toLowerCase()] ?? ThinkingLevel.LOW;
  return { thinkingConfig: { thinkingLevel: level } };
}

/** 잠깐 기다리면 풀리는 실패인지. 수요 초과(503)와 한도 초과(429)가 여기 해당한다. */
function isTransient(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  return status === 429 || status === 408 || (typeof status === "number" && status >= 500);
}

/**
 * 오늘 치 할당량을 다 쓴 429인지.
 *
 * 무료 등급은 분당 한도와 일 단위 한도를 함께 건다(실측: `gemini-3.5-flash`가
 * 분당 5회, 하루 20회). 분당 한도는 기다리면 풀리지만 일 단위 한도는 그렇지 않다.
 * 구분하지 않으면 하루치가 끝난 뒤에도 호출마다 수십 초를 헛되이 기다린다.
 */
function isDailyQuotaExhausted(error: unknown): boolean {
  const message = (error as { message?: string } | null)?.message;
  return typeof message === "string" && /PerDay/i.test(message);
}

/**
 * 서버가 알려준 대기 시간(초)을 읽는다.
 *
 * 429 응답에는 `RetryInfo.retryDelay`와 "Please retry in 3.83s" 문구가 함께 온다.
 * 이 값을 무시하고 짧게 재시도하면 한도가 풀리기 전에 시도 횟수만 태운다.
 * 무료 등급은 분당 요청 수가 낮아서 실제로 이 경로를 자주 밟는다.
 */
function serverRetryDelayMs(error: unknown): number | null {
  const message = (error as { message?: string } | null)?.message;
  if (typeof message !== "string") return null;
  const match =
    message.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/) ?? message.match(/retry in (\d+(?:\.\d+)?)s/i);
  if (!match) return null;
  const seconds = Number(match[1]);
  return Number.isFinite(seconds) ? Math.ceil(seconds * 1000) : null;
}

/**
 * 일시적 실패를 다시 시도한다.
 *
 * 직전까지 쓰던 openai SDK는 429·5xx를 스스로 두 번 재시도했다. `@google/genai`는
 * 하지 않으므로 여기서 채운다. 실측에서 `gemini-3.7-flash`가 "수요 초과" 503을,
 * 무료 등급 키가 분당 요청 한도 429를 돌려줬다. 없으면 시연 도중 호출 하나가
 * 그대로 실패하고, 완료조건 한 묶음이 통째로 사람 확인으로 떨어진다.
 *
 * 한도 초과는 다른 실패보다 더 오래, 더 여러 번 기다린다. 서버가 대기 시간을
 * 알려주면 그 값을 따르고, 아니면 지수 백오프로 물러난다.
 */
async function withRetry<T>(call: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await call();
    } catch (error) {
      const rateLimited = (error as { status?: number } | null)?.status === 429;
      if (rateLimited && isDailyQuotaExhausted(error)) {
        throw new Error(
          "Gemini 무료 등급의 하루 요청 한도를 모두 썼습니다. 기다려도 오늘은 풀리지 않습니다. " +
            "Google AI Studio에서 결제를 연결하거나 다음 날 다시 시도하세요.",
          { cause: error },
        );
      }
      const maxAttempts = rateLimited ? 5 : 3;
      if (attempt >= maxAttempts || !isTransient(error)) throw error;
      const advisedMs = serverRetryDelayMs(error);
      const backoffMs = Math.max(
        advisedMs ?? 0,
        (rateLimited ? 2_000 : 500) * 2 ** (attempt - 1),
      ) + Math.floor(Math.random() * 250);
      console.warn(
        `[gemini] ${rateLimited ? "요청 한도" : "일시적 실패"}로 ${backoffMs}ms 후 재시도 (${attempt}/${maxAttempts - 1})`,
      );
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
}

let cachedClient: { apiKey: string; client: GoogleGenAI } | null = null;

function getClient(): GoogleGenAI {
  const apiKey = geminiApiKey();
  if (!apiKey) throw new Error(GEMINI_KEY_MISSING_MESSAGE);
  if (cachedClient?.apiKey !== apiKey) {
    cachedClient = { apiKey, client: new GoogleGenAI({ apiKey }) };
  }
  return cachedClient.client;
}

export type GeminiUsage = {
  inputTokens: number;
  outputTokens: number;
  thoughtTokens: number;
};

export type GeminiJsonResult<T> = {
  /** 잘렸거나 JSON으로 읽히지 않으면 null. 호출부는 입력을 나눠 다시 시도할 수 있다. */
  parsed: T | null;
  /** 출력 한도에 걸려 끊긴 응답인지. 나눠 담으면 통과할 수 있다는 신호다. */
  truncated: boolean;
  usage: GeminiUsage;
  model: string;
};

export type GeminiJsonRequest = {
  system: string;
  user: string;
  /** 표준 JSON Schema. Gemini는 type·enum·items·properties·required·additionalProperties를 그대로 받는다. */
  schema: Record<string, unknown>;
  temperature?: number;
  model?: string;
  maxOutputTokens?: number;
};

/**
 * 응답이 없거나 끊긴 경우와, 호출 자체가 실패한 경우를 구분해서 돌려준다.
 * 앞의 것은 입력을 쪼개면 통과할 수 있으므로 `parsed: null`,
 * 뒤의 것(인증·과금·네트워크·안전 차단)은 쪼개도 같으므로 throw 한다.
 */
export async function generateJson<T>(request: GeminiJsonRequest): Promise<GeminiJsonResult<T>> {
  const model = request.model ?? geminiModel();
  const response = await withRetry(() => getClient().models.generateContent({
    model,
    contents: request.user,
    config: {
      systemInstruction: request.system,
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens ?? 32_768,
      responseMimeType: "application/json",
      responseJsonSchema: request.schema,
      ...thinkingConfig(),
    },
  }));

  const usage = readUsage(response);
  const candidate = response.candidates?.[0];
  const finishReason = candidate?.finishReason;

  if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
    // 안전 차단·금지어·기타 거부는 같은 입력으로 다시 불러도 같은 결과다.
    throw new Error(`Gemini가 응답을 거부했습니다 (${finishReason}).`);
  }

  const text = response.text?.trim();
  if (!text) {
    return { parsed: null, truncated: finishReason === "MAX_TOKENS", usage, model };
  }

  try {
    return { parsed: JSON.parse(text) as T, truncated: false, usage, model };
  } catch {
    // 한도에 걸려 JSON이 닫히지 못한 경우가 대부분이다.
    return { parsed: null, truncated: true, usage, model };
  }
}

export type GeminiTextRequest = {
  system?: string;
  user: string;
  temperature?: number;
  model?: string;
  maxOutputTokens?: number;
};

/** 스키마 없이 평문 한 덩이만 받는 호출(번역 등). */
export async function generateText(request: GeminiTextRequest): Promise<string> {
  const model = request.model ?? geminiModel("light");
  const response = await withRetry(() => getClient().models.generateContent({
    model,
    contents: request.user,
    config: {
      systemInstruction: request.system,
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens ?? 4_096,
      ...thinkingConfig(),
    },
  }));
  return response.text?.trim() ?? "";
}

function readUsage(response: { usageMetadata?: GenerateContentResponseUsageMetadata }): GeminiUsage {
  const metadata = response.usageMetadata ?? {};
  return {
    inputTokens: numberOrZero(metadata.promptTokenCount),
    outputTokens: numberOrZero(metadata.candidatesTokenCount),
    thoughtTokens: numberOrZero(metadata.thoughtsTokenCount),
  };
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
