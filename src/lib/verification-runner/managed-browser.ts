import "server-only";

import type { SandboxUser } from "@vercel/sandbox";

import type { VerificationJobManifest } from "@/lib/verification-runner/contracts";
import { MANAGED_PLAYWRIGHT_HARNESS } from "@/lib/verification-runner/playwright-harness";
import {
  compileManagedBrowserSpecToAtoms,
  type ManagedBrowserAtomTestSpec,
  type ManagedBrowserTestSpec,
} from "@/lib/verification-test-spec";

const PLAYWRIGHT_ROOT = "/vercel/sandbox/linkross-runner";
const PLAYWRIGHT_MODULE = `${PLAYWRIGHT_ROOT}/node_modules/playwright/index.mjs`;
/**
 * 하니스 한 번에 주는 시간.
 *
 * 완료조건 20개짜리 마일스톤이 139초에서 잘렸다(run 06ade301, 2026-08-24).
 * 하니스는 완료조건을 한 프로세스에서 순차 실행하므로 잘리면 남은 항목은
 * 판정을 받지 못한다. 이제는 항목마다 결과 파일을 다시 쓰기 때문에 잘려도
 * 거기까지의 판정은 살아남지만, 그건 사고를 덜 아프게 할 뿐 예산 자체는
 * 넉넉해야 한다.
 *
 * 천장은 Sandbox가 아니라 검수를 동기로 기다리는 페이지의 maxDuration(300초)다.
 * 그 실행의 하니스 외 오버헤드가 41초였으므로 200초 남짓이 한계고, 여유를 두고
 * 180초로 잡는다. 더 필요하면 시간을 늘릴 게 아니라 조정기를 비동기로 옮겨야 한다.
 */
const HARNESS_TIMEOUT_MS = 3 * 60 * 1_000;
const APP_SERVER_TIMEOUT_MS = 10 * 60 * 1_000;

const PLAYWRIGHT_BROWSERS_PATH = `${PLAYWRIGHT_ROOT}/browsers`;
const VERIFIER_HOME = "/home/linkross-verifier";
const HARNESS_PATH = `${VERIFIER_HOME}/linkross-playwright-runner.mjs`;
const INPUT_PATH = `${VERIFIER_HOME}/linkross-playwright-input.json`;
const OUTPUT_PATH = `${VERIFIER_HOME}/linkross-playwright-output.json`;
const EVIDENCE_DIRECTORY = `${VERIFIER_HOME}/evidence`;
const SCREENSHOT_MAX_BYTES = 10 * 1024 * 1024;
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
    (criterion) =>
      criterion.verificationMethod === "automated_e2e" &&
      (!criterion.testSpec || criterion.testSpec.kind === "managed_browser"),
  );
  if (criteria.length === 0) return [];

  const runnable = criteria.filter(
    (
      criterion,
    ): criterion is typeof criterion & {
      testSpec: ManagedBrowserTestSpec | ManagedBrowserAtomTestSpec;
    } => Boolean(criterion.testSpec),
  );
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
          testSpec: compileManagedBrowserSpecToAtoms(criterion.testSpec),
        })),
      ),
      mode: 0o600,
    },
  ]);

  const server = await input.appUser.runCommand({
    cmd: "npm",
    args: ["run", "start", "--", "--hostname", "127.0.0.1", "--port", "3000"],
    cwd: input.workspace,
    env: {
      NODE_ENV: "production",
      LINKROSS_TEST_EMAIL: credentials.email,
      LINKROSS_TEST_PASSWORD: credentials.password,
    },
    detached: true,
    timeoutMs: APP_SERVER_TIMEOUT_MS,
  });

  const ready = await input.verifierUser.runCommand({
    cmd: "node",
    args: ["-e", HEALTH_CHECK_SCRIPT],
    timeoutMs: 40_000,
  });
  if (ready.exitCode !== 0) {
    await server.kill().catch(() => undefined);
    const stoppedServer = await server.wait().catch(() => null);
    const healthOutput = await ready.output().catch(() => "Health check output unavailable.");
    const serverOutput = stoppedServer
      ? await stoppedServer.output().catch(() => "Server output unavailable.")
      : "Server exit status unavailable.";
    const diagnostic = redactRuntimeDiagnostic(
      `health=${healthOutput} server_exit=${stoppedServer?.exitCode ?? "unknown"} server=${serverOutput}`,
      [credentials.email, credentials.password, credentials.invalidPassword],
    );
    return [
      ...missingSpecs,
      ...runnable.map((criterion) => ({
        criterionId: criterion.id,
        status: "failed" as const,
        observedResult: "빌드된 앱이 격리 환경의 내부 포트에서 제한 시간 안에 시작되지 않았습니다.",
        errorMessage: `앱 시작 또는 health check에 실패했습니다. ${diagnostic}`,
        durationMs: 40_000,
      })),
    ];
  }

  await input.onProgress?.();
  const run = await input.verifierUser.runCommand({
    cmd: "node",
    args: [HARNESS_PATH, INPUT_PATH, OUTPUT_PATH, EVIDENCE_DIRECTORY],
    env: { PLAYWRIGHT_BROWSERS_PATH },
    timeoutMs: HARNESS_TIMEOUT_MS,
  });
  const runnableIds = runnable.map((criterion) => criterion.id);
  if (run.exitCode !== 0) {
    // 무엇이 죽였는지 남긴다. 제한 시간 초과와 하니스 크래시는 화면에서 같은
    // 문장으로 보이지만 고치는 방법이 다르다. health check 분기와 같은 방식으로
    // 합성 계정 값과 토큰을 지운 뒤 담는다.
    const harnessOutput = await run.output().catch(() => "Harness output unavailable.");
    const diagnostic = redactRuntimeDiagnostic(
      `harness_exit=${run.exitCode ?? "unknown"} harness_duration_ms=${run.durationMs ?? "unknown"} harness=${harnessOutput}`,
      [credentials.email, credentials.password, credentials.invalidPassword],
    );
    // 하니스는 완료조건마다 결과 파일을 다시 쓴다. 중간에 잘렸어도 거기까지 끝난
    // 판정은 남아 있으므로 살리고, 판정을 받지 못한 항목만 실패로 채운다.
    const salvaged = await readSalvagedOutcomes(input.verifierUser, runnableIds);
    const salvagedById = new Map(
      (await attachEvidence(input.verifierUser, salvaged)).map((outcome) => [outcome.criterionId, outcome]),
    );
    return [
      ...missingSpecs,
      ...runnable.map(
        (criterion): ManagedBrowserOutcome =>
          salvagedById.get(criterion.id) ?? {
            criterionId: criterion.id,
            status: "failed",
            observedResult: salvagedById.size > 0
              ? `LinKross Playwright 시나리오 실행이 앞선 ${salvagedById.size}건까지만 끝나고 중단되어 이 완료조건은 판정하지 못했습니다.`
              : "LinKross Playwright 시나리오 실행이 완료되지 않았습니다.",
            errorMessage: `격리 브라우저 실행에 실패했습니다. ${diagnostic}`,
            durationMs: 0,
          },
      ),
    ];
  }

  const output = await input.verifierUser.readFileToBuffer({ path: OUTPUT_PATH });
  const parsed = parseOutcomes(output);
  assertOutcomesCoverCriteria(parsed, runnableIds);
  return [...missingSpecs, ...(await attachEvidence(input.verifierUser, parsed))];
}

interface ParsedOutcome {
  criterionId: string;
  status: "passed" | "failed";
  observedResult: string;
  errorMessage?: string;
  durationMs: number;
  screenshotPath?: string;
}

/** 하니스가 남긴 판정에 증거 스크린샷을 붙인다. 정상 종료와 중단 양쪽에서 쓴다. */
async function attachEvidence(
  verifierUser: SandboxUser,
  parsed: ParsedOutcome[],
): Promise<ManagedBrowserOutcome[]> {
  const outcomes: ManagedBrowserOutcome[] = [];
  for (const outcome of parsed) {
    let screenshot: Uint8Array | undefined;
    if (outcome.screenshotPath) {
      // 스크린샷 한 장을 못 읽는다고 검수 전체를 버리지 않는다. 증거가 없는 통과는
      // 아래에서 사람 확인으로 내린다.
      const buffer = await verifierUser
        .readFileToBuffer({ path: outcome.screenshotPath })
        .catch(() => null);
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

/** 중단된 실행에서 읽어낸다. 결과 파일이 없거나 깨져 있으면 살릴 게 없는 것으로 본다. */
async function readSalvagedOutcomes(
  verifierUser: SandboxUser,
  expectedCriterionIds: string[],
): Promise<ParsedOutcome[]> {
  const expected = new Set(expectedCriterionIds);
  const seen = new Set<string>();
  try {
    const output = await verifierUser.readFileToBuffer({ path: OUTPUT_PATH });
    return parseOutcomes(output).filter((outcome) => {
      if (!expected.has(outcome.criterionId) || seen.has(outcome.criterionId)) return false;
      seen.add(outcome.criterionId);
      return true;
    });
  } catch {
    return [];
  }
}

function parseOutcomes(value: Buffer | null): ParsedOutcome[] {
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
  return outcomes;
}

function assertOutcomesCoverCriteria(outcomes: ParsedOutcome[], expectedCriterionIds: string[]): void {
  const receivedIds = outcomes.map((outcome) => outcome.criterionId);
  if (
    outcomes.length !== expectedCriterionIds.length ||
    new Set(receivedIds).size !== receivedIds.length ||
    expectedCriterionIds.some((criterionId) => !receivedIds.includes(criterionId))
  ) {
    throw new Error("Playwright result set is incomplete.");
  }
}

function needsReview(criterionId: string, observedResult: string): ManagedBrowserOutcome {
  return { criterionId, status: "needs_review", observedResult, durationMs: 0 };
}

function redactRuntimeDiagnostic(value: string, sensitiveValues: string[]): string {
  let redacted = value;
  for (const sensitiveValue of sensitiveValues) {
    if (sensitiveValue) redacted = redacted.replaceAll(sensitiveValue, "[REDACTED]");
  }
  return redacted
    .replace(/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g, "[REDACTED]")
    .replace(/\bsk-[A-Za-z0-9_-]{20,}\b/g, "[REDACTED]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[REDACTED]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1_500);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
