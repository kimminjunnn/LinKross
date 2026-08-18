import "server-only";

import type { SandboxUser } from "@vercel/sandbox";

import type { VerificationJobManifest } from "@/lib/verification-runner/contracts";
import { MANAGED_PLAYWRIGHT_HARNESS } from "@/lib/verification-runner/playwright-harness";

const PLAYWRIGHT_ROOT = "/vercel/sandbox/linkross-runner";
const PLAYWRIGHT_MODULE = `${PLAYWRIGHT_ROOT}/node_modules/playwright/index.mjs`;
const PLAYWRIGHT_BROWSERS_PATH = `${PLAYWRIGHT_ROOT}/browsers`;
const VERIFIER_HOME = "/home/linkross-verifier";
const HARNESS_PATH = `${VERIFIER_HOME}/linkross-playwright-runner.mjs`;
const INPUT_PATH = `${VERIFIER_HOME}/linkross-playwright-input.json`;
const OUTPUT_PATH = `${VERIFIER_HOME}/linkross-playwright-output.json`;
const EVIDENCE_DIRECTORY = `${VERIFIER_HOME}/evidence`;
const SCREENSHOT_MAX_BYTES = 10 * 1024 * 1024;

export interface ManagedBrowserOutcome {
  criterionId: string;
  status: "passed" | "failed" | "needs_review";
  observedResult: string;
  errorMessage?: string;
  durationMs: number;
  screenshot?: Uint8Array;
}

export async function runManagedBrowserCriteria(input: {
  appUser: SandboxUser;
  verifierUser: SandboxUser;
  manifest: VerificationJobManifest;
  workspace: string;
  hasStartScript: boolean;
  onProgress?: () => Promise<void>;
}): Promise<ManagedBrowserOutcome[]> {
  const criteria = input.manifest.criteria.filter(
    (criterion) => criterion.verificationMethod === "automated_e2e",
  );
  if (criteria.length === 0) return [];

  const runnable = criteria.filter((criterion) => criterion.testSpec);
  const missingSpecs = criteria
    .filter((criterion) => !criterion.testSpec)
    .map((criterion) => needsReview(criterion.id, "승인된 완료조건에 LinKross 관리형 Playwright 시나리오가 없습니다."));
  if (runnable.length === 0) return missingSpecs;

  const playwrightReady = await input.verifierUser.runCommand({
    cmd: "test",
    args: ["-f", PLAYWRIGHT_MODULE],
    timeoutMs: 10_000,
  });
  if (playwrightReady.exitCode !== 0) {
    return [
      ...missingSpecs,
      ...runnable.map((criterion) =>
        needsReview(
          criterion.id,
          "검수 Sandbox snapshot에 LinKross Playwright 도구가 준비되지 않아 자동 테스트를 실행하지 못했습니다.",
        ),
      ),
    ];
  }

  if (!input.hasStartScript) {
    return [
      ...missingSpecs,
      ...runnable.map((criterion) => ({
        criterionId: criterion.id,
        status: "failed" as const,
        observedResult: "production build는 완료됐지만 실행 가능한 start 스크립트를 찾지 못했습니다.",
        errorMessage: "package.json에 start 스크립트가 필요합니다.",
        durationMs: 0,
      })),
    ];
  }

  const credentials = runnable[0].testSpec!.syntheticCredentials;
  await input.verifierUser.runCommand("chmod", ["700", VERIFIER_HOME]);
  await input.verifierUser.writeFiles([
    { path: HARNESS_PATH, content: MANAGED_PLAYWRIGHT_HARNESS, mode: 0o700 },
    {
      path: INPUT_PATH,
      content: JSON.stringify(
        runnable.map((criterion) => ({
          criterionId: criterion.id,
          testSpec: criterion.testSpec,
        })),
      ),
      mode: 0o600,
    },
  ]);

  await input.appUser.runCommand({
    cmd: "npm",
    args: ["run", "start"],
    cwd: input.workspace,
    env: {
      PORT: "3000",
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
      LINKROSS_TEST_EMAIL: credentials.email,
      LINKROSS_TEST_PASSWORD: credentials.password,
    },
    detached: true,
    timeoutMs: 4 * 60 * 1_000,
  });

  const ready = await input.verifierUser.runCommand({
    cmd: "bash",
    args: [
      "-lc",
      "for attempt in $(seq 1 30); do curl -fsS --max-time 2 http://127.0.0.1:3000/ >/dev/null && exit 0; sleep 1; done; exit 1",
    ],
    timeoutMs: 40_000,
  });
  if (ready.exitCode !== 0) {
    return [
      ...missingSpecs,
      ...runnable.map((criterion) => ({
        criterionId: criterion.id,
        status: "failed" as const,
        observedResult: "빌드된 앱이 격리 환경의 내부 포트에서 제한 시간 안에 시작되지 않았습니다.",
        errorMessage: "앱 시작 또는 health check에 실패했습니다.",
        durationMs: 40_000,
      })),
    ];
  }

  await input.onProgress?.();
  const run = await input.verifierUser.runCommand({
    cmd: "node",
    args: [HARNESS_PATH, INPUT_PATH, OUTPUT_PATH, EVIDENCE_DIRECTORY],
    env: { PLAYWRIGHT_BROWSERS_PATH },
    timeoutMs: 2 * 60 * 1_000,
  });
  if (run.exitCode !== 0) {
    return [
      ...missingSpecs,
      ...runnable.map((criterion) => ({
        criterionId: criterion.id,
        status: "failed" as const,
        observedResult: "LinKross Playwright 시나리오 실행이 완료되지 않았습니다.",
        errorMessage: "격리 브라우저 실행에 실패했습니다.",
        durationMs: run.durationMs ?? 0,
      })),
    ];
  }

  const output = await input.verifierUser.readFileToBuffer({ path: OUTPUT_PATH });
  const parsed = parseOutcomes(output, runnable.map((criterion) => criterion.id));
  const outcomes: ManagedBrowserOutcome[] = [...missingSpecs];
  for (const outcome of parsed) {
    let screenshot: Uint8Array | undefined;
    if (outcome.screenshotPath) {
      const buffer = await input.verifierUser.readFileToBuffer({ path: outcome.screenshotPath });
      if (buffer && buffer.byteLength <= SCREENSHOT_MAX_BYTES) screenshot = buffer;
    }
    const status = outcome.status === "passed" && !screenshot ? "needs_review" : outcome.status;
    outcomes.push({
      criterionId: outcome.criterionId,
      status,
      observedResult: status === "needs_review"
        ? `${outcome.observedResult} 다만 증거 스크린샷을 저장하지 못해 사람 확인이 필요합니다.`
        : outcome.observedResult,
      ...(outcome.errorMessage ? { errorMessage: outcome.errorMessage } : {}),
      durationMs: outcome.durationMs,
      ...(screenshot ? { screenshot } : {}),
    });
  }
  return outcomes;
}

function parseOutcomes(value: Buffer | null, expectedCriterionIds: string[]): Array<{
  criterionId: string;
  status: "passed" | "failed";
  observedResult: string;
  errorMessage?: string;
  durationMs: number;
  screenshotPath?: string;
}> {
  if (!value) throw new Error("Playwright result file is missing.");
  const parsed = JSON.parse(value.toString("utf8")) as unknown;
  if (!Array.isArray(parsed)) throw new Error("Playwright result format is invalid.");
  const outcomes = parsed.map((item) => {
    if (!isRecord(item)) throw new Error("Playwright criterion result is invalid.");
    if (
      typeof item.criterionId !== "string" ||
      !["passed", "failed"].includes(String(item.status)) ||
      typeof item.observedResult !== "string" ||
      !Number.isSafeInteger(item.durationMs) ||
      Number(item.durationMs) < 0
    ) {
      throw new Error("Playwright criterion result is invalid.");
    }
    return {
      criterionId: item.criterionId,
      status: item.status as "passed" | "failed",
      observedResult: item.observedResult.slice(0, 4_000),
      ...(typeof item.errorMessage === "string"
        ? { errorMessage: item.errorMessage.slice(0, 4_000) }
        : {}),
      durationMs: Number(item.durationMs),
      ...(typeof item.screenshotPath === "string" &&
      item.screenshotPath === `${EVIDENCE_DIRECTORY}/${item.criterionId}.png`
        ? { screenshotPath: item.screenshotPath }
        : {}),
    };
  });
  const receivedIds = outcomes.map((outcome) => outcome.criterionId);
  if (
    outcomes.length !== expectedCriterionIds.length ||
    new Set(receivedIds).size !== receivedIds.length ||
    expectedCriterionIds.some((criterionId) => !receivedIds.includes(criterionId))
  ) {
    throw new Error("Playwright result set is incomplete.");
  }
  return outcomes;
}

function needsReview(criterionId: string, observedResult: string): ManagedBrowserOutcome {
  return { criterionId, status: "needs_review", observedResult, durationMs: 0 };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
