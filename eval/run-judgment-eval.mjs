/**
 * 판정 정확도 평가 러너 (C단계).
 *
 * 검수가 "잘 되는지"는 자동화율만으로 증명되지 않는다. 실행 가능한 스펙이
 * 만들어져도 그 스펙이 정상 앱을 실패로 찍거나 고장난 앱을 통과시키면 검수는
 * 쓸모가 없다. 그래서 같은 완료조건을 정상판과 고장판 두 벌에 실제로 실행한다.
 *
 *   False FAIL — 정상판인데 실패로 판정. 프리랜서에게 부당한 수정 요청이 된다.
 *                CLAUDE.md는 잘못 판정하는 것을 판정하지 못하는 것보다 나쁘다고
 *                보므로 목표는 0%다.
 *   False PASS — 고장판인데 통과로 판정. 발주자가 깨진 결과물을 승인하게 된다.
 *
 * 판정 코드는 프로덕션 하네스(`MANAGED_PLAYWRIGHT_HARNESS`)를 그대로 쓴다.
 * 하네스를 다시 구현하면 프로덕션이 아닌 다른 것을 재게 되고, 그것이 기존
 * 벤치마크가 실패한 방식이다. 로컬 실행을 위해 두 곳만 치환한다.
 *   - playwright 모듈 경로 (샌드박스 절대경로 → 로컬 설치 경로)
 *   - baseURL 포트 (고정 3000 → 픽스처 앱 포트)
 * 치환 결과는 실행 전에 확인하며, 치환이 하나라도 적용되지 않으면 중단한다.
 *
 * 사용법:
 *   npm run eval:judgment -- --runs 1
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

import { applyAnswersToContract, extractContractPath } from "@/lib/dod-test-contract";
import { analyzeDodContracts } from "@/lib/dod-contract-analyzer";
import { geminiModel } from "@/lib/llm/gemini";
import { composeVerificationAtoms } from "@/lib/verification-atom-composer";
import { compileManagedBrowserSpecToAtoms, createMvpVerificationDefinition } from "@/lib/verification-test-spec";
import { MANAGED_PLAYWRIGHT_HARNESS } from "@/lib/verification-runner/playwright-harness";

const ROOT = process.cwd();
const require = createRequire(import.meta.url);
const args = parseArgs(process.argv.slice(2));
const RUNS = Number(args.runs ?? 1);
const LABEL = args.label ?? "baseline";
const WORK = path.join(ROOT, "eval", ".work");
const OK_PORT = Number(args.okPort ?? 3100);
const BROKEN_PORT = Number(args.brokenPort ?? 3101);

const fixtures = JSON.parse(fs.readFileSync(path.join(ROOT, "eval/fixtures/todo-app/dods.json"), "utf8"));

fs.mkdirSync(WORK, { recursive: true });

console.log(`픽스처 완료조건 ${fixtures.length}개 · 반복 ${RUNS}회 · 모델 ${geminiModel()}`);

const runs = [];
for (let run = 1; run <= RUNS; run += 1) {
  console.log(`\n── ${run}회차 ──`);
  runs.push(await runOnce());
}

const summary = summarize(runs);
const markdown = renderMarkdown(summary, fixtures);
console.log("\n" + markdown);

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outDir = path.join(ROOT, "eval", "results");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, `judgment-${LABEL}-${stamp}.json`),
  JSON.stringify({ label: LABEL, summary, detail: runs }, null, 2),
  "utf8",
);
fs.writeFileSync(path.join(outDir, `judgment-${LABEL}-${stamp}.md`), markdown, "utf8");
console.log(`\n저장: eval/results/judgment-${LABEL}-${stamp}.json`);

// ───────────────────────────────────────────────────────────────────────────

async function runOnce() {
  const specs = await buildSpecs();
  const automated = specs.filter((entry) => entry.spec);
  console.log(`  실행 가능한 스펙 ${automated.length}/${specs.length}`);
  if (automated.length === 0) return { specs, ok: [], broken: [] };

  const ok = await runAgainst(automated, OK_PORT, "none");

  // 결함을 한꺼번에 켜면 서로를 가린다. 예를 들어 "할 일이 추가되지 않는" 결함이
  // 켜져 있으면 체크박스 조건은 확인할 대상 자체가 없어 실패하는데, 그 실패는
  // 체크박스 결함을 잡아낸 것이 아니다. 완료조건마다 자기 결함 하나만 켠 앱에
  // 실행해야 "이 검수가 이 결함을 잡아내는가"를 정확히 판정할 수 있다.
  const byDefect = new Map();
  for (const entry of automated) {
    const key = entry.brokenBy ?? "__control__";
    if (!byDefect.has(key)) byDefect.set(key, []);
    byDefect.get(key).push(entry);
  }

  const broken = [];
  for (const [defect, entries] of byDefect) {
    // 대조군은 대응된 결함이 없다. 모든 결함을 켠 앱에서도 통과해야 하므로
    // 그쪽에 실행해 무관한 실패가 옮지 않는지 본다.
    broken.push(...(await runAgainst(entries, BROKEN_PORT, defect === "__control__" ? "all" : defect)));
  }
  return { specs, ok, broken };
}

/** 프로덕션과 같은 순서로 완료조건을 실행 가능한 스펙까지 끌고 간다. */
async function buildSpecs() {
  const analyses = await analyzeDodContracts(
    fixtures.map((item) => ({ milestoneTitle: item.milestoneTitle, dod: item.dod })),
  );

  const entries = fixtures.map((fixture, index) => {
    const analysis = analyses[index];
    const answered = (analysis?.requirements ?? []).map((requirement) => ({
      ...requirement,
      answer: requirement.answer?.trim() || requirement.recommendedSuggestion || requirement.suggestions?.[0] || "",
    }));
    const contract = analysis ? applyAnswersToContract(analysis.testContract, answered) : undefined;
    const answeredFields = answered.filter((item) => item.answer?.trim()).map((item) => item.key);
    const startPath = contract?.startPath ?? extractContractPath(fixture.dod) ?? undefined;
    const description =
      extractContractPath(fixture.dod) || !startPath ? fixture.dod : `\`${startPath}\`에서 ${fixture.dod}`;
    return { ...fixture, contract, description, answeredFields };
  });

  const needsComposition = [];
  for (const entry of entries) {
    const preset = createMvpVerificationDefinition(entry.description);
    if (preset.verificationMethod === "automated_e2e") {
      entry.spec = preset.testSpec;
      entry.source = "preset";
    } else {
      needsComposition.push(entry);
    }
  }

  if (needsComposition.length > 0) {
    const composed = await composeVerificationAtoms(
      needsComposition.map((entry) => ({
        description: entry.description,
        contract: entry.contract,
        answeredFields: (entry.answeredFields ?? []),
      })),
    );
    needsComposition.forEach((entry, index) => {
      const outcome = composed[index];
      if (outcome?.spec) {
        entry.spec = outcome.spec;
        entry.source = "composed";
      } else {
        entry.spec = null;
        entry.source = "manual";
        entry.reason = outcome?.reason;
        entry.detail = outcome?.detail;
      }
    });
  }
  return entries;
}

/** 픽스처 앱을 띄우고 프로덕션 하네스로 스펙을 실행한다. */
async function runAgainst(entries, port, defects) {
  const server = spawn(process.execPath, [path.join(ROOT, "eval/fixtures/todo-app/server.mjs")], {
    env: { ...process.env, PORT: String(port), DEFECTS: defects },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await waitForServer(port);

  try {
    const inputPath = path.join(WORK, `criteria-${port}.json`);
    const outputPath = path.join(WORK, `outcomes-${port}.json`);
    const evidenceDir = path.join(WORK, `evidence-${port}`);
    fs.writeFileSync(
      inputPath,
      // 프로덕션(`managed-browser.ts`)과 같이 v1 프리셋 스펙을 atom으로 컴파일한 뒤
      // 하네스에 넘긴다. 이 단계를 빠뜨리면 프리셋 스펙에 steps 배열이 없어 하네스가
      // 즉시 오류를 내고, 정상 앱이 실패로 찍힌다.
      JSON.stringify(
        entries.map((entry) => ({
          criterionId: entry.id,
          testSpec: compileManagedBrowserSpecToAtoms(entry.spec),
        })),
      ),
      "utf8",
    );

    const harnessPath = path.join(WORK, `harness-${port}.mjs`);
    fs.writeFileSync(harnessPath, localizeHarness(port), "utf8");
    await execNode([harnessPath, inputPath, outputPath, evidenceDir]);

    const outcomes = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    console.log(
      `    ${defects === "none" ? "정상판" : `고장판[${defects}]`}(:${port}) 통과 ${outcomes.filter((o) => o.status === "passed").length}/${outcomes.length}`,
    );
    return outcomes;
  } finally {
    server.kill("SIGTERM");
  }
}

/**
 * 샌드박스 전용 값 두 가지만 로컬 값으로 바꾼다. 판정 로직은 손대지 않는다.
 * 치환이 적용되지 않으면 프로덕션 하네스가 바뀐 것이므로 즉시 중단한다.
 */
function localizeHarness(port) {
  const sandboxImport = "/vercel/sandbox/linkross-runner/node_modules/playwright/index.mjs";
  // 하네스는 ESM 진입점(index.mjs)에서 이름있는 export를 가져온다. CJS 진입점을
  // 가리키면 `chromium` named export를 찾지 못한다.
  const localImport = path.join(path.dirname(require.resolve("playwright/package.json")), "index.mjs");
  if (!fs.existsSync(localImport)) {
    throw new Error(`playwright ESM 진입점을 찾지 못했습니다: ${localImport}`);
  }
  const sandboxBaseUrl = 'baseURL: "http://127.0.0.1:3000"';
  const localBaseUrl = `baseURL: "http://127.0.0.1:${port}"`;

  if (!MANAGED_PLAYWRIGHT_HARNESS.includes(sandboxImport)) {
    throw new Error("하네스의 playwright 경로를 찾지 못했습니다. 치환 규칙을 갱신하세요.");
  }
  if (!MANAGED_PLAYWRIGHT_HARNESS.includes(sandboxBaseUrl)) {
    throw new Error("하네스의 baseURL을 찾지 못했습니다. 치환 규칙을 갱신하세요.");
  }
  return MANAGED_PLAYWRIGHT_HARNESS.replaceAll(sandboxImport, localImport).replaceAll(sandboxBaseUrl, localBaseUrl);
}

function summarize(all) {
  const rows = [];
  for (const run of all) {
    const okById = new Map(run.ok.map((outcome) => [outcome.criterionId, outcome]));
    const brokenById = new Map(run.broken.map((outcome) => [outcome.criterionId, outcome]));
    for (const entry of run.specs) {
      if (!entry.spec) {
        rows.push({ id: entry.id, automated: false, brokenBy: entry.brokenBy, reason: entry.reason });
        continue;
      }
      const okStatus = okById.get(entry.id)?.status;
      const brokenStatus = brokenById.get(entry.id)?.status;
      rows.push({
        id: entry.id,
        automated: true,
        source: entry.source,
        brokenBy: entry.brokenBy,
        okStatus,
        brokenStatus,
        okObserved: okById.get(entry.id)?.observedResult,
        brokenObserved: brokenById.get(entry.id)?.observedResult,
        // 정상판에서 실패하면 오탐이다.
        falseFail: okStatus === "failed",
        // 결함이 있는 항목인데 고장판에서 통과하면 놓친 것이다.
        falsePass: Boolean(entry.brokenBy) && brokenStatus === "passed",
        // 대조군은 고장판에서도 통과해야 한다.
        controlBroke: !entry.brokenBy && brokenStatus === "failed",
      });
    }
  }
  const automated = rows.filter((row) => row.automated);
  const detectable = automated.filter((row) => row.brokenBy);
  const pct = (count, base) => (base === 0 ? 0 : Math.round((count / base) * 1000) / 10);
  return {
    totalRows: rows.length,
    automatedRows: automated.length,
    automationRate: pct(automated.length, rows.length),
    falseFail: automated.filter((row) => row.falseFail).length,
    falseFailRate: pct(automated.filter((row) => row.falseFail).length, automated.length),
    falsePass: detectable.filter((row) => row.falsePass).length,
    falsePassRate: pct(detectable.filter((row) => row.falsePass).length, detectable.length),
    controlBroke: automated.filter((row) => row.controlBroke).length,
    rows,
  };
}

function renderMarkdown(summary, fixtureList) {
  const lines = [
    `# 판정 정확도 평가 · ${LABEL}`,
    "",
    `픽스처 완료조건 ${fixtureList.length}개를 정상판과 고장판에 실제로 실행한 결과입니다.`,
    "",
    "| 지표 | 목표 | 측정값 | 달성 |",
    "| --- | ---: | ---: | :---: |",
    `| 실행 가능한 스펙 비율 | — | ${summary.automationRate}% (${summary.automatedRows}/${summary.totalRows}) | — |`,
    `| **False FAIL** (정상판 오판) | 0% | ${summary.falseFailRate}% (${summary.falseFail}/${summary.automatedRows}) | ${summary.falseFail === 0 ? "✅" : "❌"} |`,
    `| False PASS (고장판 통과) | ≤ 10% | ${summary.falsePassRate}% (${summary.falsePass}) | ${summary.falsePassRate <= 10 ? "✅" : "❌"} |`,
    "",
    "## 완료조건별",
    "",
    "| 완료조건 | 스펙 | 정상판 | 고장판 | 판정 |",
    "| --- | --- | :---: | :---: | --- |",
    ...summary.rows.map((row) => {
      const verdict = !row.automated
        ? `자동화 안 됨 (${row.reason ?? "manual"})`
        : row.falseFail
          ? "**False FAIL**"
          : row.falsePass
            ? "**False PASS**"
            : row.controlBroke
              ? "**대조군이 고장판에서 실패** — 무관한 이유로 실패가 옮았다"
              : "정상";
      return `| ${row.id} | ${row.automated ? row.source : "—"} | ${mark(row.okStatus)} | ${mark(row.brokenStatus)} | ${verdict} |`;
    }),
    "",
    "정상판은 모두 통과, 고장판은 결함이 있는 항목이 모두 실패해야 합니다.",
    "`brokenBy`가 없는 대조군은 두 판 모두 통과해야 합니다.",
  ];

  const failures = summary.rows.filter((row) => row.falseFail);
  if (failures.length > 0) {
    lines.push(
      "",
      "## False FAIL 상세 (가장 중요)",
      "",
      "정상 동작하는 앱을 실패로 판정한 항목입니다. 하네스가 남긴 관찰 결과를 그대로 옮깁니다.",
      "",
      ...failures.map((row) => `- **${row.id}**: ${row.okObserved ?? "(기록 없음)"}`),
    );
  }
  return lines.join("\n");
}

function mark(status) {
  if (status === "passed") return "통과";
  if (status === "failed") return "실패";
  return "—";
}

function execNode(argv) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, argv, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`하네스 실행 실패(code ${code}): ${stderr.slice(0, 2000)}`)),
    );
  });
}

async function waitForServer(port) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/login`);
      if (response.ok) return;
    } catch {
      // 아직 뜨지 않았다.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`픽스처 앱(:${port})이 뜨지 않았습니다.`);
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index].startsWith("--")) parsed[argv[index].slice(2)] = argv[index + 1];
  }
  return parsed;
}
