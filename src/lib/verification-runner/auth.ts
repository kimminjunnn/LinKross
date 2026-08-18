import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const RUNNER_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/;
const LEASE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,100}$/;

export function isAuthorizedRunner(request: Request): boolean {
  const configuredSecret = process.env.VERIFICATION_RUNNER_SECRET?.trim() ?? "";
  const authorization = request.headers.get("authorization") ?? "";
  const suppliedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (configuredSecret.length < 32 || suppliedSecret.length === 0) return false;
  return safeDigestEqual(configuredSecret, suppliedSecret);
}

export function readRunnerLease(request: Request): { workerId: string; token: string } | null {
  const workerId = request.headers.get("x-runner-id")?.trim() ?? "";
  const token = request.headers.get("x-verification-lease")?.trim() ?? "";
  return RUNNER_ID_PATTERN.test(workerId) && LEASE_TOKEN_PATTERN.test(token)
    ? { workerId, token }
    : null;
}

export function isValidRunnerId(value: unknown): value is string {
  return typeof value === "string" && RUNNER_ID_PATTERN.test(value);
}

export function createLeaseToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashLeaseToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function safeDigestEqual(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left, "utf8").digest();
  const rightDigest = createHash("sha256").update(right, "utf8").digest();
  return timingSafeEqual(leftDigest, rightDigest);
}
