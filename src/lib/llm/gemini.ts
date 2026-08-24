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
 * 하루 한도가 소진되면 순서대로 갈아탈 모델 목록.
 *
 * 하루 한도(RPD)가 큰 모델을 앞에 둔다. 전환할 때마다 그 모델이 처음 받아보는
 * 설정 조합에서 실패할 여지가 생기므로, 전환 횟수 자체를 줄이는 편이 안전하다.
 * lite 둘로 1,000회를 먼저 쓰고 나면 20회짜리는 사실상 예비 전력이다.
 *
 * 괄호 안은 AI Studio 비율 제한 화면 기준(무료 등급, 2026-08-24).
 * 지연시간 메모는 2026-08-23 실측이다.
 *
 * `gemini-2.5-*`는 목록에는 보이지만 신규 키에 404를 돌려주므로 넣지 않는다.
 * `gemma-4-*`는 RPD가 14.4K로 크지만 TPM이 16K뿐이라 긴 한국어 원문 하나에
 * 막힌다. 이것도 넣지 않는다.
 */
export const MODEL_FALLBACK_CHAIN: readonly string[] = [
  "gemini-3.5-flash-lite", // 15 RPM / 500 RPD - 0.8초
  "gemini-3.1-flash-lite", // 15 RPM / 500 RPD - 미검증
  "gemini-3.5-flash", //      5 RPM /  20 RPD - 1초 안팎
  "gemini-3-flash", //        5 RPM /  20 RPD - 미검증
  "gemini-3.6-flash", //      5 RPM /  20 RPD - 12~14초로 느리다
  "gemini-3.7-flash", //      5 RPM /  20 RPD - 503(수요 초과)이 잦다
];

/**
 * 기본 진입 모델. 체인 맨 앞을 그대로 쓴다.
 *
 * 품질만 보면 `gemini-3.5-flash`가 앞이지만 하루 20회로는 시연 리허설 몇 번에
 * 끝난다. 예산이 25배인 lite로 시작하고, 품질을 다시 재고 싶으면 `GEMINI_MODEL`로
 * 고정한다. 그때도 소진되면 체인 아래로 계속 내려간다.
 */
export const GEMINI_DEFAULT_MODEL = MODEL_FALLBACK_CHAIN[0];
/** 번역·요약처럼 짧고 값싼 호출. 지금은 기본과 같은 모델에서 출발한다. */
export const GEMINI_LIGHT_MODEL = MODEL_FALLBACK_CHAIN[0];

const DAILY_QUOTA_MESSAGE =
  "Gemini 하루 요청 한도를 모두 썼습니다. 대체 모델도 남아 있지 않아 기다려도 오늘은 " +
  "풀리지 않습니다. 태평양 시간 자정(한국시간 오후 4시)에 리셋됩니다.";

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
 * 무료 등급은 분당 한도와 일 단위 한도를 함께 건다. 분당 한도는 기다리면 풀리지만
 * 일 단위 한도는 그렇지 않다. 구분하지 않으면 하루치가 끝난 뒤에도 호출마다
 * 수십 초를 헛되이 기다린다.
 *
 * 한도는 프로젝트 x 모델 단위로 따로 센다. 그래서 한 모델이 소진돼도 다른 모델은
 * 그대로 남아 있고, `withModelFallback`이 MODEL_FALLBACK_CHAIN을 따라 갈아탄다.
 * 모델별 수치는 그 목록에 적어 뒀다.
 *
 * 구글은 모델별 표를 문서에 싣지 않으므로 이 숫자는 프로젝트마다 다르다.
 * 현재 값은 aistudio.google.com/rate-limit에서 확인한다. 이 판별식 자체는
 * 숫자를 몰라도 동작한다 - 쿼터 ID의 `PerDay`만 본다.
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
 * 분당 요청 수 한도가 낮은 등급에서는 실제로 이 경로를 자주 밟는다.
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
 * 개발 키가 분당 요청 한도 429를 돌려줬다. 없으면 시연 도중 호출 하나가
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
      // 하루 한도는 기다려도 안 풀린다. 재시도하지 않고 원본을 그대로 올려보내
      // withModelFallback이 다음 모델로 갈아타게 한다.
      if (rateLimited && isDailyQuotaExhausted(error)) throw error;
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

/**
 * 모델별로 "지금은 쓸 수 없다"고 판정된 상태. 값은 다시 시도해도 되는 시각(ms).
 *
 * 프로세스 메모리에만 둔다. 서버리스에서 프로세스가 새로 뜨면 비지만, 그때는
 * 체인 맨 앞부터 다시 시도할 뿐이라 손해가 429 한 번(할당량을 쓰지 않는다)이다.
 * 반대로 살아 있는 동안에는 이미 소진된 모델을 매번 다시 찌르지 않는다.
 */
const unavailableUntil = new Map<string, number>();

/** 테스트에서 모델 가용성 기록을 비운다. */
export function resetModelAvailability(): void {
  unavailableUntil.clear();
}

/**
 * 다음 하루 한도 리셋 시각(ms).
 *
 * RPD는 태평양 시간 자정에 리셋된다. 서버가 어느 시간대에 있든 같은 시점을
 * 가리켜야 하므로 로컬 자정이 아니라 America/Los_Angeles 기준으로 계산한다.
 */
function nextDailyResetMs(now: number = Date.now()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(now));
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  const elapsedMs = ((value("hour") % 24) * 3_600 + value("minute") * 60 + value("second")) * 1_000;
  return now + (86_400_000 - elapsedMs);
}

/** 갈아타서 해결될 실패인지, 갈아타도 같을 실패인지 가른다. */
function classifyModelFailure(error: unknown): "daily" | "unusable" | "overloaded" | null {
  if (isDailyQuotaExhausted(error)) return "daily";
  const status = (error as { status?: number } | null)?.status;
  // 404는 이 키가 못 쓰는 모델, 400은 이 모델이 거부하는 설정 조합이다.
  // 둘 다 같은 프로세스에서 다시 시도할 이유가 없다.
  if (status === 404 || status === 400) return "unusable";
  // 재시도까지 하고도 남은 503은 그 모델이 지금 붐비는 것이다. 잠시 뒤에는 돌아온다.
  if (status === 503) return "overloaded";
  return null;
}

const OVERLOADED_COOLDOWN_MS = 10 * 60 * 1_000;

/** 선호 모델을 앞에 두고, 지금 쓸 수 있는 후보만 순서대로 남긴다. */
function candidateModels(preferred: string, now: number = Date.now()): string[] {
  const ordered = [preferred, ...MODEL_FALLBACK_CHAIN.filter((model) => model !== preferred)];
  return ordered.filter((model) => {
    const until = unavailableUntil.get(model);
    if (until === undefined) return true;
    if (until > now) return false;
    unavailableUntil.delete(model);
    return true;
  });
}

/**
 * 하루 한도가 소진되면 다음 모델로 갈아타며 호출한다.
 *
 * 전환 자체가 새로운 실패 지점이다. 어떤 모델은 이 키에서 404고, 어떤 모델은
 * 우리가 보내는 설정 조합을 400으로 거부한다. 그래서 전환 뒤 실패도 같은 기준으로
 * 분류해서, 갈아타서 해결될 실패면 계속 내려가고 아니면 그대로 올려보낸다.
 * 실제로 쓴 모델을 함께 돌려줘 호출부가 무엇으로 만든 결과인지 기록할 수 있게 한다.
 */
export async function withModelFallback<T>(
  preferred: string,
  call: (model: string) => Promise<T>,
): Promise<{ result: T; model: string }> {
  const candidates = candidateModels(preferred);
  if (candidates.length === 0) throw new Error(DAILY_QUOTA_MESSAGE);

  let lastError: unknown;
  for (let index = 0; index < candidates.length; index += 1) {
    const model = candidates[index];
    try {
      return { result: await withRetry(() => call(model)), model };
    } catch (error) {
      const reason = classifyModelFailure(error);
      if (reason === null) throw error; // 갈아타도 같은 결과다.
      lastError = error;
      unavailableUntil.set(
        model,
        reason === "daily"
          ? nextDailyResetMs()
          : reason === "overloaded"
            ? Date.now() + OVERLOADED_COOLDOWN_MS
            : Number.MAX_SAFE_INTEGER,
      );
      const next = candidates[index + 1];
      const label =
        reason === "daily" ? "하루 한도 소진" : reason === "overloaded" ? "수요 초과" : "사용 불가";
      console.warn(
        `[gemini] ${model} ${label} - ${next ? `${next}(으)로 전환` : "남은 대체 모델 없음"}`,
      );
    }
  }

  if (classifyModelFailure(lastError) === "daily") {
    throw new Error(DAILY_QUOTA_MESSAGE, { cause: lastError });
  }
  throw lastError;
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
  const { result: response, model } = await withModelFallback(
    request.model ?? geminiModel(),
    (candidate) => getClient().models.generateContent({
      model: candidate,
      contents: request.user,
      config: {
        systemInstruction: request.system,
        temperature: request.temperature,
        maxOutputTokens: request.maxOutputTokens ?? 32_768,
        responseMimeType: "application/json",
        responseJsonSchema: request.schema,
        ...thinkingConfig(),
      },
    }),
  );

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
  const { result: response } = await withModelFallback(
    request.model ?? geminiModel("light"),
    (candidate) => getClient().models.generateContent({
      model: candidate,
      contents: request.user,
      config: {
        systemInstruction: request.system,
        temperature: request.temperature,
        maxOutputTokens: request.maxOutputTokens ?? 4_096,
        ...thinkingConfig(),
      },
    }),
  );
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
