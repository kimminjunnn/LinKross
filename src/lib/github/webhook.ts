import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyGitHubWebhookSignature(payload: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature || !/^sha256=[0-9a-f]{64}$/i.test(signature)) {
    return false;
  }

  const expected = `sha256=${createHmac("sha256", secret).update(payload, "utf8").digest("hex")}`;
  const actualBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
