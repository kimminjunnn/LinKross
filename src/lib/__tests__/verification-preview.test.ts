import assert from "node:assert/strict";
import test from "node:test";

import {
  VERIFICATION_PREVIEW_DURATION_MS,
  getVerificationPreviewRemainingMs,
} from "@/lib/verification-preview";

test("Preview 서버를 검수 완료 후 10분 동안 유지한다", () => {
  assert.equal(VERIFICATION_PREVIEW_DURATION_MS, 10 * 60 * 1_000);
});

test("Preview 만료 시각까지 남은 시간을 계산한다", () => {
  assert.equal(
    getVerificationPreviewRemainingMs("2026-08-25T00:05:00.000Z", Date.parse("2026-08-25T00:00:30.000Z")),
    270_000,
  );
});

test("만료되었거나 잘못된 시각은 0으로 처리한다", () => {
  assert.equal(
    getVerificationPreviewRemainingMs("2026-08-25T00:00:00.000Z", Date.parse("2026-08-25T00:00:01.000Z")),
    0,
  );
  assert.equal(getVerificationPreviewRemainingMs("invalid", Date.now()), 0);
  assert.equal(getVerificationPreviewRemainingMs(null, Date.now()), 0);
});
