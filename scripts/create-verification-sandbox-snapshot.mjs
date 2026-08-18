import { Sandbox } from "@vercel/sandbox";

const credentials = readCredentials();
const sandbox = await Sandbox.create({
  ...credentials,
  name: `linkross-browser-snapshot-${Date.now()}`,
  image: "vercel/sandbox/node:24",
  resources: { vcpus: 1 },
  timeout: 10 * 60 * 1_000,
  persistent: false,
  networkPolicy: "allow-all",
  tags: { product: "linkross", purpose: "verification-snapshot" },
});

try {
  await runChecked(
    sandbox,
    "npm",
    [
      "install",
      "--prefix",
      "/vercel/sandbox/linkross-runner",
      "--ignore-scripts",
      "playwright@1.62.1",
    ],
    "Playwright installation failed.",
  );
  await runChecked(
    sandbox,
    "/vercel/sandbox/linkross-runner/node_modules/.bin/playwright",
    ["install-deps", "chromium"],
    "Chromium system dependency installation failed.",
  );
  await runChecked(
    sandbox,
    "/vercel/sandbox/linkross-runner/node_modules/.bin/playwright",
    ["install", "chromium"],
    "Chromium installation failed.",
    { PLAYWRIGHT_BROWSERS_PATH: "/vercel/sandbox/linkross-runner/browsers" },
  );
  await runChecked(
    sandbox,
    "test",
    ["-f", "/vercel/sandbox/linkross-runner/node_modules/playwright/index.mjs"],
    "Playwright validation failed.",
  );
  await runChecked(
    sandbox,
    "test",
    ["-d", "/vercel/sandbox/linkross-runner/browsers"],
    "Chromium validation failed.",
  );

  const snapshot = await sandbox.snapshot();
  process.stdout.write(`${snapshot.snapshotId}\n`);
} finally {
  await sandbox.stop().catch(() => undefined);
}

async function runChecked(sandboxInstance, cmd, args, message, env) {
  const result = await sandboxInstance.runCommand({
    cmd,
    args,
    ...(env ? { env } : {}),
    timeoutMs: 5 * 60 * 1_000,
  });
  if (result.exitCode !== 0) {
    const output = (await result.output()).slice(-4_000);
    throw new Error(`${message}\n${output}`);
  }
}

function readCredentials() {
  const token = process.env.VERCEL_TOKEN?.trim();
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim();
  if (!token && !teamId && !projectId) return {};
  if (!token || !teamId || !projectId) {
    throw new Error("VERCEL_TOKEN, VERCEL_TEAM_ID, and VERCEL_PROJECT_ID must be set together.");
  }
  return { token, teamId, projectId };
}
