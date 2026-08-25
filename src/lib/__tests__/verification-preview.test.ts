import assert from "node:assert/strict";
import test from "node:test";

import {
  formatVerificationPreviewRemaining,
  getVerificationPreviewRemainingMs,
} from "@/lib/verification-preview";

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

test("남은 시간을 분:초로 올림 표시한다", () => {
  assert.equal(formatVerificationPreviewRemaining(270_001), "04:31");
  assert.equal(formatVerificationPreviewRemaining(1), "00:01");
  assert.equal(formatVerificationPreviewRemaining(0), "00:00");
});
