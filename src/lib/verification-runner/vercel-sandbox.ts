import "server-only";

import { randomBytes, randomUUID } from "node:crypto";

import { Sandbox, type SandboxUser } from "@vercel/sandbox";

import type { VerificationJobManifest } from "@/lib/verification-runner/contracts";
import { runManagedBrowserCriteria } from "@/lib/verification-runner/managed-browser";
import { runManagedApiCheckCriteria } from "@/lib/verification-runner/managed-api-check";
import {
  claimVerificationJob,
  completeVerificationJob,
  downloadVerificationSourceBundle,
  heartbeatVerificationJob,
  transitionVerificationJob,
  uploadVerificationArtifact,
  uploadVerificationLog,
} from "@/lib/verification-runner/service";
import { VERIFICATION_PREVIEW_DURATION_MS } from "@/lib/verification-preview";

const SANDBOX_ACTIVE_WINDOW_MS = 5 * 60 * 1_000;
const PREVIEW_SHUTDOWN_GRACE_MS = 10_000;
const PREVIEW_PORT = 3000;
const PREVIEW_SERVER_TIMEOUT_MS = 11 * 60 * 1_000;
const INSTALL_TIMEOUT_MS = 3 * 60 * 1_000;
const REBUILD_TIMEOUT_MS = 2 * 60 * 1_000;
const BUILD_TIMEOUT_MS = 3 * 60 * 1_000;
const MAX_COMMAND_LOG_CHARS = 200_000;
const MAX_PACKAGE_JSON_BYTES = 1_000_000;
const WORKSPACE = "/home/linkross-app/workspace";
const ARCHIVE_PATH = "/home/linkross-app/source.tgz";
const PREVIEW_HEALTH_CHECK_SCRIPT = String.raw`
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
const PREVIEW_QUICK_HEALTH_CHECK_SCRIPT = String.raw`
fetch("http://127.0.0.1:3000/", {
  redirect: "manual",
  signal: AbortSignal.timeout(2000),
}).then((response) => {
  process.exit(response.status >= 200 && response.status < 400 ? 0 : 1);
}).catch(() => process.exit(1));
`;

const INSTALL_NETWORK_POLICY = {
  allow: [
    "registry.npmjs.org",
    "*.npmjs.org",
    "github.com",
    "*.githubusercontent.com",
    "playwright.azureedge.net",
    "cdn.playwright.dev",
    "*.playwright.dev",
  ],
};

const RUNTIME_NETWORK_POLICY = {
  subnets: {
    allow: ["127.0.0.0/8"],
  },
};

type SandboxInstance = Awaited<ReturnType<typeof Sandbox.create>>;
type ActiveStatus = "provisioning" | "installing" | "building" | "running";

interface CommandSummary {
  label: string;
  exitCode: number;
  durationMs: number | null;
  output: string;
}

export async function executeNextVerificationInVercelSandbox(
  workerId: string,
): Promise<{
  claimed: boolean;
  runId?: string;
  status?: "passed" | "failed" | "needs_review";
  sandboxName?: string;
}> {
  const job = await claimVerificationJob(workerId);
  if (!job) return { claimed: false };

  const { manifest, lease } = job;
  let sandbox: SandboxInstance | null = null;
  let appUser: SandboxUser | null = null;
  let verifierUser: SandboxUser | null = null;
  let keepSandboxForPreview = false;
  let currentStatus: ActiveStatus = "provisioning";
  const commandLog: CommandSummary[] = [];

  try {
    const source = await downloadVerificationSourceBundle(manifest, lease);
    sandbox = await createSandbox(manifest);
    appUser = await sandbox.createUser("linkross-app");
    verifierUser = await sandbox.createUser("linkross-verifier");
    await appUser.runCommand("chmod", ["700", "/home/linkross-app"]);
    await appUser.mkDir(WORKSPACE);
    await appUser.writeFiles([
      { path: ARCHIVE_PATH, content: source.archive, mode: 0o600 },
    ]);

    const digestResult = await appUser.runCommand("sha256sum", [ARCHIVE_PATH], { timeoutMs: 10_000 });
    const uploadedDigest = (await digestResult.stdout()).split(/\s+/)[0];
    if (digestResult.exitCode !== 0 || uploadedDigest !== source.sha256) {
      throw new StageFailure("provisioning", "Source archive integrity verification failed.");
    }

    const extractResult = await appUser.runCommand({
      cmd: "tar",
      args: ["-xzf", ARCHIVE_PATH, "--strip-components=1", "--no-same-owner", "--no-same-permissions", "-C", WORKSPACE],
      timeoutMs: 60_000,
    });
    if (extractResult.exitCode !== 0) {
      throw new StageFailure("provisioning", "Source archive extraction failed.");
    }

    const packageJson = await readPackageJson(appUser);
    const packageLock = await appUser.readFileToBuffer({ path: "package-lock.json", cwd: WORKSPACE });
    if (!packageLock) {
      throw new StageFailure("provisioning", "MVP verification requires a committed package-lock.json file.");
    }
    if (!packageJson.scripts?.build) {
      throw new StageFailure("provisioning", "MVP verification requires a package.json build script.");
    }

    await transitionVerificationJob(manifest.run.id, lease, {
      expectedStatus: "provisioning",
      nextStatus: "installing",
      environmentProvider: "vercel-sandbox",
      environmentReference: sandbox.name,
    });
    currentStatus = "installing";
    await refreshSandboxDeadline(sandbox);

    const install = await runLoggedCommand(
      appUser,
      "npm dependency download",
      "npm ci --ignore-scripts --no-audit --no-fund",
      INSTALL_TIMEOUT_MS,
    );
    commandLog.push(install);
    if (install.exitCode !== 0) {
      throw new StageFailure("installing", "Dependency installation failed in the isolated environment.");
    }

    await heartbeatVerificationJob(manifest.run.id, lease);
    await refreshSandboxDeadline(sandbox);
    await sandbox.update({ networkPolicy: RUNTIME_NETWORK_POLICY });
    const rebuild = await runLoggedCommand(
      appUser,
      "npm lifecycle rebuild (network denied)",
      "npm rebuild",
      REBUILD_TIMEOUT_MS,
    );
    commandLog.push(rebuild);
    if (rebuild.exitCode !== 0) {
      throw new StageFailure("installing", "Dependency lifecycle scripts failed with network access denied.");
    }

    await transitionVerificationJob(manifest.run.id, lease, {
      expectedStatus: "installing",
      nextStatus: "building",
    });
    currentStatus = "building";
    await refreshSandboxDeadline(sandbox);

    const build = await runLoggedCommand(appUser, "npm build", "npm run build", BUILD_TIMEOUT_MS);
    commandLog.push(build);
    if (build.exitCode !== 0) {
      throw new StageFailure("building", "Application build failed in the isolated environment.");
    }

    await transitionVerificationJob(manifest.run.id, lease, {
      expectedStatus: "building",
      nextStatus: "running",
    });
    currentStatus = "running";

    const heartbeatAndRefreshSandbox = async () => {
      await Promise.all([
        heartbeatVerificationJob(manifest.run.id, lease),
        refreshSandboxDeadline(sandbox!),
      ]);
    };

    const browserOutcomes = await runManagedBrowserCriteria({
      appUser,
      verifierUser,
      manifest,
      workspace: WORKSPACE,
      hasStartScript: Boolean(packageJson.scripts?.start),
      onProgress: heartbeatAndRefreshSandbox,
    });
    const apiCheckOutcomes = await runManagedApiCheckCriteria({
      appUser,
      verifierUser,
      manifest,
      workspace: WORKSPACE,
      hasStartScript: Boolean(packageJson.scripts?.start),
      onProgress: heartbeatAndRefreshSandbox,
    });
    const automatedOutcomes = [...browserOutcomes, ...apiCheckOutcomes];
    const browserOutcomesByCriterion = new Map(
      automatedOutcomes.map((outcome) => [outcome.criterionId, outcome]),
    );
    const screenshotEvidence = new Map<string, {
      storagePath: string;
      sha256: string;
      sizeBytes: number;
    }>();
    for (const outcome of browserOutcomes) {
      if (!outcome.screenshot) continue;
      const artifact = await uploadVerificationArtifact({
        projectId: manifest.project.id,
        runId: manifest.run.id,
        content: outcome.screenshot,
        fileName: `criterion-${outcome.criterionId}-${randomUUID()}.png`,
        contentType: "image/png",
      });
      screenshotEvidence.set(outcome.criterionId, artifact);
    }

    await heartbeatVerificationJob(manifest.run.id, lease);
    const safeLog = redactLog(
      formatRunnerLog(manifest, source.sha256, commandLog, automatedOutcomes),
    );
    const evidence = await uploadVerificationLog({
      projectId: manifest.project.id,
      runId: manifest.run.id,
      content: safeLog,
    });
    const results = manifest.criteria.map((criterion, index) => {
      const isBuildCriterion = criterion.verificationMethod === "build";
      const browserOutcome = browserOutcomesByCriterion.get(criterion.id);
      const screenshot = screenshotEvidence.get(criterion.id);
      const criterionEvidence = [];
      if (screenshot) {
        criterionEvidence.push({
          type: "screenshot" as const,
          storagePath: screenshot.storagePath,
          mimeType: "image/png",
          sizeBytes: screenshot.sizeBytes,
          sha256: screenshot.sha256,
          isRedacted: true,
        });
      }
      if (index === 0) {
        criterionEvidence.push({
          type: "log" as const,
          storagePath: evidence.storagePath,
          mimeType: "text/plain; charset=utf-8",
          sizeBytes: evidence.sizeBytes,
          sha256: evidence.sha256,
          isRedacted: true,
        });
      }
      return {
        criterionId: criterion.id,
        status: isBuildCriterion
          ? "passed" as const
          : browserOutcome?.status ?? "needs_review" as const,
        observedResult: isBuildCriterion
          ? "의존성 설치와 production build가 격리 환경에서 완료되었습니다."
          : browserOutcome?.observedResult
            ?? "자동화되지 않은 완료조건이므로 Preview에서 사람 확인이 필요합니다.",
        errorMessage: browserOutcome?.errorMessage,
        durationMs: isBuildCriterion ? build.durationMs ?? undefined : browserOutcome?.durationMs,
        evidence: criterionEvidence,
      };
    });
    const finalStatus = results.some((result) => result.status === "failed")
      ? "failed" as const
      : results.every((result) => result.status === "passed")
        ? "passed" as const
        : "needs_review" as const;
    let previewUrl = await preparePreview({
      sandbox,
      appUser,
      verifierUser,
      manifest,
      workspace: WORKSPACE,
      hasStartScript: Boolean(packageJson.scripts?.start),
    }).catch((previewError) => {
      console.error("[verification-runner] Preview preparation failed", {
        runId: manifest.run.id,
        error: describeSandboxFailure(previewError),
      });
      return undefined;
    });
    if (previewUrl) {
      try {
        await refreshSandboxDeadline(
          sandbox,
          VERIFICATION_PREVIEW_DURATION_MS + PREVIEW_SHUTDOWN_GRACE_MS,
        );
      } catch (previewLifetimeError) {
        console.error("[verification-runner] Preview lifetime extension failed", {
          runId: manifest.run.id,
          error: describeSandboxFailure(previewLifetimeError),
        });
        previewUrl = undefined;
      }
    }
    const completed = await completeVerificationJob(manifest.run.id, lease, {
      status: finalStatus,
      results,
      previewUrl,
      durationMs:
        commandLog.reduce((total, command) => total + (command.durationMs ?? 0), 0)
        + automatedOutcomes.reduce((total, outcome) => total + outcome.durationMs, 0),
    });
    keepSandboxForPreview = Boolean(previewUrl);

    return {
      claimed: true,
      runId: manifest.run.id,
      status: completed.status as "passed" | "failed" | "needs_review",
      sandboxName: sandbox.name,
    };
  } catch (error) {
    const summary = error instanceof StageFailure
      ? error.safeMessage
      : describeSandboxFailure(error);
    const failedStatus = error instanceof StageFailure ? error.stage : currentStatus;
    console.error("[verification-runner] Sandbox execution failed", {
      runId: manifest.run.id,
      stage: failedStatus,
      error: summary,
    });
    try {
      await transitionVerificationJob(manifest.run.id, lease, {
        expectedStatus: failedStatus,
        nextStatus: "failed",
        errorSummary: summary,
      });
    } catch {
      // Lease 만료 또는 동시 재선점 시 이전 worker가 상태를 덮어쓰지 않는다.
    }
    return {
      claimed: true,
      runId: manifest.run.id,
      status: "failed",
      sandboxName: sandbox?.name,
    };
  } finally {
    if (sandbox && !keepSandboxForPreview) {
      try {
        await sandbox.stop();
      } catch {
        // Sandbox 자체 timeout이 최종 폐기를 보장하며 결과 상태는 이미 기록했다.
      }
    }
  }
}

async function refreshSandboxDeadline(
  sandbox: SandboxInstance,
  remainingMs = SANDBOX_ACTIVE_WINDOW_MS,
): Promise<void> {
  const elapsedMs = Math.max(0, Date.now() - sandbox.createdAt.getTime());
  const targetTimeoutMs = elapsedMs + remainingMs;
  if ((sandbox.timeout ?? 0) < targetTimeoutMs) {
    await sandbox.update({ timeout: targetTimeoutMs });
  }
}

async function preparePreview(input: {
  sandbox: SandboxInstance;
  appUser: SandboxUser;
  verifierUser: SandboxUser;
  manifest: VerificationJobManifest;
  workspace: string;
  hasStartScript: boolean;
}): Promise<string | undefined> {
  if (!input.hasStartScript) return undefined;

  const existingServer = await input.verifierUser.runCommand({
    cmd: "node",
    args: ["-e", PREVIEW_QUICK_HEALTH_CHECK_SCRIPT],
    timeoutMs: 5_000,
  });

  if (existingServer.exitCode !== 0) {
    const browserSpec = input.manifest.criteria
      .map((criterion) => criterion.testSpec)
      .find((testSpec) => testSpec?.kind === "managed_browser");
    const env: Record<string, string> = browserSpec
      ? {
          NODE_ENV: "production",
          LINKROSS_TEST_EMAIL: browserSpec.syntheticCredentials.email,
          LINKROSS_TEST_PASSWORD: browserSpec.syntheticCredentials.password,
        }
      : { NODE_ENV: "production" };
    const server = await input.appUser.runCommand({
      cmd: "npm",
      args: ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(PREVIEW_PORT)],
      cwd: input.workspace,
      env,
      detached: true,
      timeoutMs: PREVIEW_SERVER_TIMEOUT_MS,
    });
    const ready = await input.verifierUser.runCommand({
      cmd: "node",
      args: ["-e", PREVIEW_HEALTH_CHECK_SCRIPT],
      timeoutMs: 40_000,
    });
    if (ready.exitCode !== 0) {
      await server.kill().catch(() => undefined);
      return undefined;
    }
  }

  await input.sandbox.update({ ports: [PREVIEW_PORT] });
  return input.sandbox.domain(PREVIEW_PORT);
}

async function createSandbox(manifest: VerificationJobManifest): Promise<SandboxInstance> {
  const snapshotId = process.env.VERIFICATION_SANDBOX_SNAPSHOT_ID?.trim();
  const credentials = readSandboxCredentials();
  const common = {
    ...credentials,
    name: `linkross-${manifest.run.id.slice(0, 8)}-${randomBytes(3).toString("hex")}`,
    timeout: SANDBOX_ACTIVE_WINDOW_MS,
    resources: { vcpus: 1 },
    persistent: false,
    networkPolicy: INSTALL_NETWORK_POLICY,
    env: {
      CI: "true",
      NEXT_TELEMETRY_DISABLED: "1",
      LINKROSS_VERIFICATION: "1",
    },
    tags: { product: "linkross", purpose: "verification" },
  };
  return snapshotId
    ? Sandbox.create({ ...common, source: { type: "snapshot", snapshotId } })
    : Sandbox.create({ ...common, image: "vercel/sandbox/node:24" });
}

async function readPackageJson(sandbox: SandboxUser): Promise<{
  scripts?: Record<string, string>;
}> {
  const content = await sandbox.readFileToBuffer({ path: "package.json", cwd: WORKSPACE });
  if (!content || content.byteLength > MAX_PACKAGE_JSON_BYTES) {
    throw new StageFailure("provisioning", "A valid package.json file is required.");
  }
  try {
    const parsed = JSON.parse(content.toString("utf8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid package");
    const scripts = "scripts" in parsed && parsed.scripts && typeof parsed.scripts === "object" && !Array.isArray(parsed.scripts)
      ? Object.fromEntries(
          Object.entries(parsed.scripts).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
        )
      : undefined;
    return { scripts };
  } catch {
    throw new StageFailure("provisioning", "package.json could not be parsed.");
  }
}

async function runLoggedCommand(
  sandbox: SandboxUser,
  label: string,
  command:
    | "npm ci --ignore-scripts --no-audit --no-fund"
    | "npm rebuild"
    | "npm run build",
  timeoutMs: number,
): Promise<CommandSummary> {
  const startedAt = Date.now();
  const result = await sandbox.runCommand({
    cmd: "bash",
    args: ["-lc", `set -o pipefail; ${command} 2>&1 | tail -c ${MAX_COMMAND_LOG_CHARS}`],
    cwd: WORKSPACE,
    timeoutMs,
  });
  return {
    label,
    exitCode: result.exitCode,
    durationMs: result.durationMs ?? Date.now() - startedAt,
    output: (await result.stdout()).slice(-MAX_COMMAND_LOG_CHARS),
  };
}

function formatRunnerLog(
  manifest: VerificationJobManifest,
  sourceSha256: string,
  commands: CommandSummary[],
  browserOutcomes: Array<{
    criterionId: string;
    status: string;
    observedResult: string;
    durationMs: number;
  }>,
): string {
  const header = [
    `run=${manifest.run.id}`,
    `repository=${manifest.repository.owner}/${manifest.repository.name}`,
    `commit=${manifest.submission.commitSha}`,
    `source_sha256=${sourceSha256}`,
  ].join("\n");
  const stages = commands.map((command) => [
    `\n## ${command.label}`,
    `exit_code=${command.exitCode}`,
    `duration_ms=${command.durationMs ?? "unknown"}`,
    command.output,
  ].join("\n")).join("\n");
  const browser = browserOutcomes.map((outcome) => [
    `\n## managed browser criterion ${outcome.criterionId}`,
    `status=${outcome.status}`,
    `duration_ms=${outcome.durationMs}`,
    outcome.observedResult,
  ].join("\n")).join("\n");
  const body = `${stages}\n${browser}`;
  return `${header}\n${body.slice(-(MAX_COMMAND_LOG_CHARS - header.length - 1))}`;
}

function redactLog(value: string): string {
  return value
    .replace(/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g, "[REDACTED_GITHUB_TOKEN]")
    .replace(/\bsk-[A-Za-z0-9_-]{20,}\b/g, "[REDACTED_API_KEY]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[REDACTED_JWT]")
    .replace(/((?:token|secret|password|api[_-]?key)\s*[=:]\s*)[^\s]+/gi, "$1[REDACTED]");
}

function describeSandboxFailure(error: unknown): string {
  const name = error instanceof Error ? error.name : "UnknownError";
  const rawMessage = error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : "The isolated verification environment could not complete the requested run.";
  const message = redactLog(rawMessage).replace(/\s+/g, " ").trim();
  return `Sandbox execution failed (${name}): ${message || "Unknown error"}`.slice(0, 4_000);
}

function readSandboxCredentials(): { token: string; teamId: string; projectId: string } | object {
  const token = process.env.VERCEL_TOKEN?.trim();
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim();

  // Vercel deployments authenticate the Sandbox SDK automatically through OIDC.
  // System environment variables can still expose team/project IDs without a PAT.
  if (!token) return {};

  if (!teamId || !projectId) {
    throw new StageFailure("provisioning", "Vercel Sandbox credentials are incomplete.");
  }
  return { token, teamId, projectId };
}

class StageFailure extends Error {
  constructor(
    readonly stage: ActiveStatus,
    readonly safeMessage: string,
  ) {
    super(safeMessage);
    this.name = "StageFailure";
  }
}
