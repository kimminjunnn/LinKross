/**
 * 같은 입력·같은 프롬프트를 여러 모델로 돌려 지표 차이를 본다.
 *
 * `EXP_Result_3_Laundry_Actual_vs_Gold.md`(2026-08-20)는 세탁소 시나리오에서
 * 39개 DoD 전부에 URL이 없었다고 기록했지만,
 * `EXP_7_Laundry_Pickup_Delivery.md`(2026-08-21)의 "모델 생성 결과"에는 URL이
 * 대부분 들어 있다. 두 기록이 모순되므로 지금 프롬프트로 다시 측정해 확정한다.
 *
 * 프로덕션 `analyze.ts`는 `gpt-4o`를 하드코딩하므로 그 모델을 반드시 포함한다.
 *
 * 사용법:
 *   node --experimental-strip-types --import ./scripts/register-test-hooks.mjs \
 *     eval/compare-models.mjs --input eval/fixtures-laundry-input.txt --runs 2
 */

import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";

import { buildSowPrompt, SOW_PROMPT_VERSION, SOW_RESPONSE_SCHEMA, SOW_SYSTEM_MESSAGE } from "@/lib/sow-prompt";
import { measureDods } from "@/lib/dod-metrics";

const ROOT = process.cwd();
loadEnv(path.join(ROOT, ".env.local"));

const args = parseArgs(process.argv.slice(2));
const INPUT = args.input ?? "eval/fixtures-laundry-input.txt";
const RUNS = Number(args.runs ?? 2);
const MODELS = (args.models ?? "gpt-4o,gpt-4o-mini").split(",");
// 프로덕션 analyze.ts 는 0.2를 쓴다. 커버리지 변동의 원인인지 보려면 바꿔 볼 수 있어야 한다.
const TEMPERATURES = (args.temperatures ?? "0.2").split(",").map(Number);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const workDetail = fs.readFileSync(path.join(ROOT, INPUT), "utf8");

const rows = [];
const samples = {};

for (const model of MODELS) {
  for (const temperature of TEMPERATURES) {
  for (let run = 1; run <= RUNS; run += 1) {
    const started = Date.now();
    try {
      const completion = await openai.chat.completions.parse({
        model,
        messages: [
          { role: "system", content: SOW_SYSTEM_MESSAGE },
          { role: "user", content: buildSowPrompt({ workDetail, startDate: "2026-09-01", endDate: "2026-12-31" }) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "sow_analysis", schema: SOW_RESPONSE_SCHEMA, strict: true },
        },
        temperature,
      });
      const milestones = completion.choices[0].message.parsed?.milestones ?? [];
      const dods = milestones.flatMap((milestone) => milestone.dods ?? []);
      const metrics = measureDods(dods);
      rows.push({ model, temperature, run, ms: Date.now() - started, milestones: milestones.length, ...metrics });
      // 판정을 사람이 직접 검증할 수 있도록 URL 없는 문장을 남긴다.
      samples[`${model}@${temperature}#${run}`] = dods.filter((dod) => !metrics.total || !hasPath(dod)).slice(0, 8);
      console.log(`${model} T=${temperature} run${run}: DoD ${metrics.total}개 · URL ${metrics.urlPathRate}% · 역량서술 ${metrics.capabilityRate}% · 원자성 ${metrics.atomicRate}%`);
    } catch (error) {
      console.error(`${model} T=${temperature} run${run} 실패: ${error.message}`);
    }
  }
  }
}

function hasPath(dod) {
  return /(?<![A-Za-z0-9가-힣])\/[A-Za-z][A-Za-z0-9\-_]*/.test(dod);
}

console.log(`\n프롬프트 판본: ${SOW_PROMPT_VERSION} · 입력: ${INPUT}\n`);
console.log("| 모델 | 온도 | 회차 | DoD | URL 명시율 | 역량서술 | 체언종결 | 원자성 |");
console.log("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
for (const row of rows) {
  console.log(
    `| ${row.model} | ${row.temperature} | ${row.run} | ${row.total} | ${row.urlPathRate}% | ${row.capabilityRate}% | ${row.nounTerminationRate}% | ${row.atomicRate}% |`,
  );
}

console.log("\n=== 재현성: 같은 입력에서 DoD 개수 변동 ===");
const groups = {};
for (const row of rows) (groups[`${row.model}@${row.temperature}`] ??= []).push(row.total);
for (const [key, counts] of Object.entries(groups)) {
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const swing = max === 0 ? 0 : Math.round(((max - min) / max) * 1000) / 10;
  console.log(`  ${key}: ${counts.join(" / ")} → 변동폭 ${swing}%`);
}

console.log("\n=== URL 없는 DoD 표본 ===");
for (const [key, list] of Object.entries(samples)) {
  if (list.length === 0) continue;
  console.log(`\n[${key}]`);
  list.forEach((dod) => console.log("  " + dod));
}

const outPath = path.join(ROOT, "eval", "results", `model-compare-${Date.now()}.json`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ promptVersion: SOW_PROMPT_VERSION, input: INPUT, rows, samples }, null, 2), "utf8");
console.log(`\n저장: ${path.relative(ROOT, outPath)}`);

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    let value = (match[2] ?? "").trim();
    if (/^".*"$/.test(value) || /^'.*'$/.test(value)) value = value.slice(1, -1);
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index].startsWith("--")) parsed[argv[index].slice(2)] = argv[index + 1];
  }
  return parsed;
}
