/**
 * 프리셋의 실행 스펙을 로컬 브라우저로 직접 돌려 본다.
 *
 * Vercel Sandbox를 거치지 않고, 검수 실행기가 쓰는 것과 **같은** Playwright
 * 하니스(`src/lib/verification-runner/playwright-harness.ts`)를 그대로 실행한다.
 * 하니스 원문에서 바꾸는 것은 playwright 모듈 경로 하나뿐이다. 그래야 여기서
 * 통과한 스펙이 실제 검수에서도 같게 동작한다고 말할 수 있다.
 *
 * 검수 대상 앱은 시연용 저장소를 로컬에 받아 둔 사본이다. 마일스톤마다 커밋이
 * 다르므로 커밋을 지정한다.
 *
 * 실행:
 *   node --experimental-strip-types --conditions=react-server \
 *     --import ./scripts/register-test-hooks.mjs \
 *     eval/presets/verify-preset-locally.mjs \
 *     --app <앱 경로> --commit <sha> --preset asset-rental --milestone M1
 *
 * `--preset`은 앱에 실린 프리셋 데이터에서 스펙을 그대로 읽는다. 즉 화면이 쓰는
 * 것과 같은 스펙을 돌린다. 후보 스펙을 시험할 때는 `--specs <파일>`로 대신
 * 넘길 수 있다(`[{ "description": "...", "testSpec": { ... } }]` 형식).
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { MANAGED_PLAYWRIGHT_HARNESS } from "@/lib/verification-runner/playwright-harness";
import { listSowPresets } from "@/lib/sow-presets";
import { compileManagedBrowserSpecToAtoms } from "@/lib/verification-test-spec";

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : fallback;
};

const appPath = path.resolve(arg("app", "/tmp/demo-app"));
const commit = arg("commit", null);
const specsPath = arg("specs", null);
const presetId = arg("preset", null);
const milestoneCode = arg("milestone", null);
const only = arg("only", null)?.split(",").map((value) => Number(value.trim()));
const port = Number(arg("port", "3000"));
const keepServer = process.argv.includes("--keep");

if (!specsPath && !presetId) throw new Error("--preset <id> 또는 --specs <파일>이 필요합니다.");

const credentials = { email: "test@example.com", password: "Test1234!", invalidPassword: "wrong-password" };

function entriesFromPreset() {
  const preset = listSowPresets().find((candidate) => candidate.id === presetId);
  if (!preset) throw new Error(`${presetId} 프리셋을 찾지 못했습니다.`);
  const milestones = milestoneCode
    ? preset.milestones.filter((milestone) => milestone.code === milestoneCode.toUpperCase())
    : preset.milestones;
  if (milestones.length === 0) throw new Error(`${milestoneCode} 마일스톤을 찾지 못했습니다.`);
  return milestones.flatMap((milestone) =>
    milestone.dods.map((dod) => ({
      description: `${milestone.code} ${dod.description}`,
      ...(dod.verificationMethod === "automated_e2e" ? { testSpec: dod.testSpec } : {}),
    })),
  );
}

const entries = (presetId ? entriesFromPreset() : JSON.parse(fs.readFileSync(specsPath, "utf8")))
  .map((entry, index) => ({ ...entry, index: index + 1 }))
  .filter((entry) => !only || only.includes(entry.index));

const runnable = entries.filter((entry) => entry.testSpec && entry.testSpec.kind === "managed_browser");
const skipped = entries.filter((entry) => !runnable.includes(entry));

const workDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "linkross-preset-"));
const harnessPath = path.join(workDirectory, "harness.mjs");
const inputPath = path.join(workDirectory, "input.json");
const outputPath = path.join(workDirectory, "output.json");
const evidenceDirectory = path.join(workDirectory, "evidence");

// 하니스는 Sandbox에 설치된 playwright를 절대경로로 부른다. 로컬에서는 이
// 저장소의 devDependency를 쓴다. 그 한 줄 말고는 원문 그대로 쓴다.
const localHarness = MANAGED_PLAYWRIGHT_HARNESS.replace(
  '"/vercel/sandbox/linkross-runner/node_modules/playwright/index.mjs"',
  JSON.stringify(path.resolve("node_modules/playwright/index.mjs")),
).replace('baseURL: "http://127.0.0.1:3000"', `baseURL: "http://127.0.0.1:${port}"`);
if (localHarness === MANAGED_PLAYWRIGHT_HARNESS) throw new Error("하니스에서 playwright 경로를 찾지 못했습니다.");

fs.writeFileSync(harnessPath, localHarness, "utf8");
fs.writeFileSync(
  inputPath,
  JSON.stringify(
    runnable.map((entry) => ({
      criterionId: String(entry.index),
      testSpec: compileManagedBrowserSpecToAtoms({ ...entry.testSpec, syntheticCredentials: credentials }),
    })),
  ),
  "utf8",
);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: appPath, stdio: "inherit", ...options });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} → ${result.status}`);
}

if (commit) {
  console.log(`\n▸ ${commit} 체크아웃`);
  run("git", ["checkout", "-q", commit]);
}
console.log("▸ production build");
run("npm", ["run", "build"], { stdio: ["ignore", "ignore", "inherit"] });

console.log(`▸ 서버 기동 (127.0.0.1:${port})`);
const server = spawn("npm", ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: appPath,
  stdio: ["ignore", "ignore", "pipe"],
  env: {
    ...process.env,
    NODE_ENV: "production",
    LINKROSS_TEST_EMAIL: credentials.email,
    LINKROSS_TEST_PASSWORD: credentials.password,
  },
});
let serverLog = "";
server.stderr.on("data", (chunk) => { serverLog += String(chunk); });

async function waitForServer() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/login`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`서버가 뜨지 않았습니다.\n${serverLog}`);
}
await waitForServer();

console.log(`▸ 하니스 실행 · 자동 ${runnable.length}건 (건너뜀 ${skipped.length}건)\n`);
const harness = spawnSync(process.execPath, [harnessPath, inputPath, outputPath, evidenceDirectory], {
  cwd: process.cwd(),
  stdio: "inherit",
});
if (!keepServer) server.kill("SIGTERM");
if (harness.status !== 0) throw new Error(`하니스 종료 코드 ${harness.status}`);

const outcomes = JSON.parse(fs.readFileSync(outputPath, "utf8"));
const byId = new Map(outcomes.map((outcome) => [outcome.criterionId, outcome]));
let passed = 0;
let failed = 0;
for (const entry of entries) {
  const outcome = byId.get(String(entry.index));
  if (!outcome) {
    console.log(`${String(entry.index).padStart(2)} [건너뜀] ${entry.description}`);
    continue;
  }
  if (outcome.status === "passed") passed += 1; else failed += 1;
  const mark = outcome.status === "passed" ? "통과  " : "실패  ";
  console.log(`${String(entry.index).padStart(2)} [${mark}] ${entry.description}`);
  if (outcome.status !== "passed") console.log(`     ↳ ${outcome.observedResult}`);
}
console.log(`\n통과 ${passed} · 실패 ${failed} · 건너뜀 ${entries.length - passed - failed}`);
console.log(`증거 스크린샷: ${evidenceDirectory}`);
if (keepServer) console.log(`서버는 살려 둡니다(pid ${server.pid}). 끝내려면 kill ${server.pid}`);
process.exit(failed > 0 ? 1 : 0);
