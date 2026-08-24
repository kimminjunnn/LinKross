import assert from "node:assert/strict";
import test from "node:test";

import {
  MODEL_FALLBACK_CHAIN,
  resetModelAvailability,
  withModelFallback,
} from "@/lib/llm/gemini";

/** 서버가 하루 한도 소진으로 돌려주는 429를 흉내낸다. */
function dailyQuotaError() {
  const error = new Error(
    '{"error":{"code":429,"status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.QuotaFailure",' +
      '"violations":[{"quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaValue":"20"}]}]}}',
  );
  (error as { status?: number }).status = 429;
  return error;
}

function statusError(status: number) {
  const error = new Error(`status ${status}`);
  (error as { status?: number }).status = status;
  return error;
}

test("체인 맨 앞은 하루 한도가 가장 큰 lite 모델이다", () => {
  assert.equal(MODEL_FALLBACK_CHAIN[0], "gemini-3.5-flash-lite");
  assert.equal(MODEL_FALLBACK_CHAIN[1], "gemini-3.1-flash-lite");
  // 20 RPD짜리는 lite 뒤에 온다.
  assert.ok(MODEL_FALLBACK_CHAIN.indexOf("gemini-3.5-flash") > 1);
});

test("하루 한도가 소진되면 다음 모델로 갈아탄다", async () => {
  resetModelAvailability();
  const tried: string[] = [];
  const { result, model } = await withModelFallback(MODEL_FALLBACK_CHAIN[0], async (candidate) => {
    tried.push(candidate);
    if (candidate === MODEL_FALLBACK_CHAIN[0]) throw dailyQuotaError();
    return "ok";
  });

  assert.equal(result, "ok");
  assert.equal(model, MODEL_FALLBACK_CHAIN[1]);
  assert.deepEqual(tried, [MODEL_FALLBACK_CHAIN[0], MODEL_FALLBACK_CHAIN[1]]);
});

test("소진된 모델은 다음 호출에서 다시 시도하지 않는다", async () => {
  resetModelAvailability();
  await withModelFallback(MODEL_FALLBACK_CHAIN[0], async (candidate) => {
    if (candidate === MODEL_FALLBACK_CHAIN[0]) throw dailyQuotaError();
    return "ok";
  });

  const tried: string[] = [];
  await withModelFallback(MODEL_FALLBACK_CHAIN[0], async (candidate) => {
    tried.push(candidate);
    return "ok";
  });
  assert.deepEqual(tried, [MODEL_FALLBACK_CHAIN[1]], "이미 소진된 모델을 다시 찌르면 안 된다");
});

test("전환한 모델이 400으로 거부해도 그 다음 모델로 계속 내려간다", async () => {
  resetModelAvailability();
  const tried: string[] = [];
  const { model } = await withModelFallback(MODEL_FALLBACK_CHAIN[0], async (candidate) => {
    tried.push(candidate);
    if (candidate === MODEL_FALLBACK_CHAIN[0]) throw dailyQuotaError();
    if (candidate === MODEL_FALLBACK_CHAIN[1]) throw statusError(400);
    return "ok";
  });

  assert.equal(model, MODEL_FALLBACK_CHAIN[2]);
  assert.equal(tried.length, 3);
});

test("체인이 전부 소진되면 하루 한도 안내를 던진다", async () => {
  resetModelAvailability();
  await assert.rejects(
    withModelFallback(MODEL_FALLBACK_CHAIN[0], async () => {
      throw dailyQuotaError();
    }),
    (error: Error) => {
      assert.match(error.message, /하루 요청 한도/);
      assert.match(error.message, /오후 4시/);
      return true;
    },
  );
});

test("갈아타도 같을 실패는 모델을 바꾸지 않고 그대로 올려보낸다", async () => {
  resetModelAvailability();
  const tried: string[] = [];
  await assert.rejects(
    withModelFallback(MODEL_FALLBACK_CHAIN[0], async (candidate) => {
      tried.push(candidate);
      throw new Error("Gemini가 응답을 거부했습니다 (SAFETY).");
    }),
    /SAFETY/,
  );
  assert.deepEqual(tried, [MODEL_FALLBACK_CHAIN[0]], "안전 차단으로 다른 모델을 태우면 안 된다");
});

test("고정한 모델이 체인 밖이어도 그 모델부터 시도한다", async () => {
  resetModelAvailability();
  const tried: string[] = [];
  const { model } = await withModelFallback("gemini-experimental", async (candidate) => {
    tried.push(candidate);
    return "ok";
  });
  assert.equal(model, "gemini-experimental");
  assert.deepEqual(tried, ["gemini-experimental"]);
});
