import "server-only";

import type { SandboxUser } from "@vercel/sandbox";

import type { VerificationJobManifest } from "@/lib/verification-runner/contracts";
import { MANAGED_API_CHECK_HARNESS } from "@/lib/verification-runner/api-check-harness";

const VERIFIER_HOME = "/home/linkross-verifier";
const HARNESS_PATH = `${VERIFIER_HOME}/linkross-api-check-runner.mjs`;
const INPUT_PATH = `${VERIFIER_HOME}/linkross-api-check-input.json`;
const OUTPUT_PATH = `${VERIFIER_HOME}/linkross-api-check-output.json`;

const HEALTH_CHECK_SCRIPT = String.raw`
(async () => {
  let lastError = "No response from the application.";
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:3000/", {
        redirect: "manual",
        signal: AbortSignal.timeout(2000),
      });
      if (response.status >= 200 && response.status < 400) process.exit(0);
      lastError = "Unexpected HTTP status " + response.status + ".";
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Health check request failed.";
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  console.error(lastError);
  process.exit(1);
})().catch((error) => {
  console.error(error instanceof Error ? error.message : "Health check failed.");
  process.exit(1);
});
`;

export interface ManagedApiCheckOutcome {
  criterionId: string;
  status: "passed" | "failed" | "needs_review";
  observedResult: string;
  errorMessage?: string;
  durationMs: number;
}

export async function runManagedApiCheckCriteria(input: {
  appUser: SandboxUser;
  verifierUser: SandboxUser;
  manifest: VerificationJobManifest;
  workspace: string;
  hasStartScript: boolean;
  onProgress?: () => Promise<void>;
}): Promise<ManagedApiCheckOutcome[]> {
  const criteria = input.manifest.criteria.filter(
    (criterion) =>
      criterion.verificationMethod === "automated_e2e" && criterion.testSpec?.kind === "api_check",
  );
  if (criteria.length === 0) return [];

  if (!input.hasStartScript) {
    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      status: "failed" as const,
      observedResult: "production build는 완료됐지만 실행 가능한 start 스크립트를 찾지 못했습니다.",
      errorMessage: "package.json에 start 스크립트가 필요합니다.",
      durationMs: 0,
    }));
  }

  await input.verifierUser.runCommand("chmod", ["700", VERIFIER_HOME]);
  await input.verifierUser.writeFiles([
    { path: HARNESS_PATH, content: MANAGED_API_CHECK_HARNESS, mode: 0o700 },
    {
      path: INPUT_PATH,
      content: JSON.stringify(
        criteria.map((criterion) => ({ criterionId: criterion.id, testSpec: criterion.testSpec })),
      ),
      mode: 0o600,
    },
  ]);

  const server = await input.appUser.runCommand({
    cmd: "npm",
    args: ["run", "start", "--", "--hostname", "127.0.0.1", "--port", "3000"],
    cwd: input.workspace,
    env: { NODE_ENV: "production" },
    detached: true,
    timeoutMs: 4 * 60 * 1_000,
  });

  const ready = await input.verifierUser.runCommand({
    cmd: "node",
    args: ["-e", HEALTH_CHECK_SCRIPT],
    timeoutMs: 40_000,
  });
  if (ready.exitCode !== 0) {
    await server.kill().catch(() => undefined);
    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      status: "failed" as const,
      observedResult: "빌드된 앱이 격리 환경의 내부 포트에서 제한 시간 안에 시작되지 않았습니다.",
      errorMessage: "앱 시작 또는 health check에 실패했습니다.",
      durationMs: 40_000,
    }));
  }

  await input.onProgress?.();
  const run = await input.verifierUser.runCommand({
    cmd: "node",
    args: [HARNESS_PATH, INPUT_PATH, OUTPUT_PATH],
    timeoutMs: 60_000,
  });
  await server.kill().catch(() => undefined);

  if (run.exitCode !== 0) {
    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      status: "failed" as const,
      observedResult: "LinKross API 검증 시나리오 실행이 완료되지 않았습니다.",
      errorMessage: "격리 환경에서 API 검증 실행에 실패했습니다.",
      durationMs: run.durationMs ?? 0,
    }));
  }

  const output = await input.verifierUser.readFileToBuffer({ path: OUTPUT_PATH });
  return parseOutcomes(output, criteria.map((criterion) => criterion.id));
}

function parseOutcomes(value: Buffer | null, expectedCriterionIds: string[]): ManagedApiCheckOutcome[] {
  if (!value) throw new Error("API check result file is missing.");
  const parsed = JSON.parse(value.toString("utf8")) as unknown;
  if (!Array.isArray(parsed)) throw new Error("API check result format is invalid.");
  const outcomes = parsed.map((item) => {
    if (!isRecord(item)) throw new Error("API check criterion result is invalid.");
    if (
      typeof item.criterionId !== "string" ||
      !["passed", "failed"].includes(String(item.status)) ||
      typeof item.observedResult !== "string" ||
      !Number.isSafeInteger(item.durationMs) ||
      Number(item.durationMs) < 0
    ) {
      throw new Error("API check criterion result is invalid.");
    }
    return {
      criterionId: item.criterionId,
      status: item.status as "passed" | "failed",
      observedResult: item.observedResult.slice(0, 4_000),
      ...(typeof item.errorMessage === "string" ? { errorMessage: item.errorMessage.slice(0, 4_000) } : {}),
      durationMs: Number(item.durationMs),
    };
  });
  const receivedIds = outcomes.map((outcome) => outcome.criterionId);
  if (
    outcomes.length !== expectedCriterionIds.length ||
    new Set(receivedIds).size !== receivedIds.length ||
    expectedCriterionIds.some((criterionId) => !receivedIds.includes(criterionId))
  ) {
    throw new Error("API check result set is incomplete.");
  }
  return outcomes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
