/**
 * SOW 생성 품질 평가 러너.
 *
 * 이전 벤치마크와 다른 점은 세 가지다.
 *   1. 프로덕션과 같은 프롬프트를 쓴다 (`src/lib/sow-prompt.ts`를 직접 가져온다).
 *      예전에는 평가 스크립트마다 프롬프트를 복사해 두어, 측정한 것과 실제로
 *      쓰이는 것이 같다는 보장이 없었다.
 *   2. 생성된 DoD 원문을 전부 저장한다. 예전 결과 파일에는 개수와 비율만 있어
 *      재채점도, 프롬프트 판본 간 비교도 불가능했다.
 *   3. 목표 달성 여부를 실제로 비교한다. 예전 리포트는 "✅ 완벽 달성" 문자열이
 *      하드코딩되어 있어 목표 미달을 표시할 방법이 없었다.
 *
 * 사용법:
 *   node --experimental-strip-types --import ./scripts/register-test-hooks.mjs \
 *     eval/run-sow-eval.mjs [--limit 12] [--model gpt-4o-mini] [--label baseline]
 */

import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";

import { buildSowPrompt, SOW_PROMPT_VERSION, SOW_RESPONSE_SCHEMA, SOW_SYSTEM_MESSAGE } from "@/lib/sow-prompt";
import { evaluateTargets, findOutOfScopeCandidates, measureDods } from "@/lib/dod-metrics";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "eval", "results");

loadEnv(path.join(ROOT, ".env.local"));

const args = parseArgs(process.argv.slice(2));
const LIMIT = Number(args.limit ?? 12);
const MODEL = args.model ?? "gpt-4o-mini";
const LABEL = args.label ?? "baseline";
const CONCURRENCY = Number(args.concurrency ?? 4);

// 대략적인 단가(USD / 1M 토큰). 정확한 청구액이 아니라 상한 관리용 추정치다.
const PRICING = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY가 없습니다.");
    process.exit(1);
  }

  const scenarios = loadScenarios().slice(0, LIMIT);
  console.log(`시나리오 ${scenarios.length}건 · 모델 ${MODEL} · 프롬프트 ${SOW_PROMPT_VERSION}`);

  const results = [];
  const usage = { inputTokens: 0, outputTokens: 0 };

  for (let offset = 0; offset < scenarios.length; offset += CONCURRENCY) {
    const batch = scenarios.slice(offset, offset + CONCURRENCY);
    const settled = await Promise.all(batch.map((scenario) => generate(scenario, usage)));
    results.push(...settled);
    console.log(`  진행 ${results.length}/${scenarios.length}`);
  }

  const report = summarize(results, usage);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const jsonPath = path.join(OUT_DIR, `sow-${LABEL}-${stamp}.json`);
  const mdPath = path.join(OUT_DIR, `sow-${LABEL}-${stamp}.md`);

  // 원문 전체를 저장한다. 이것이 있어야 다음 판본과 비교할 수 있다.
  fs.writeFileSync(
    jsonPath,
    JSON.stringify({ label: LABEL, model: MODEL, promptVersion: SOW_PROMPT_VERSION, usage, report, results }, null, 2),
    "utf8",
  );
  fs.writeFileSync(mdPath, renderMarkdown(report, LABEL, MODEL), "utf8");

  console.log(`\n${renderMarkdown(report, LABEL, MODEL)}`);
  console.log(`\n결과 원문: ${path.relative(ROOT, jsonPath)}`);
  console.log(`리포트:   ${path.relative(ROOT, mdPath)}`);
}

async function generate(scenario, usage) {
  const startedAt = Date.now();
  try {
    const completion = await openai.chat.completions.parse({
      model: MODEL,
      messages: [
        { role: "system", content: SOW_SYSTEM_MESSAGE },
        {
          role: "user",
          content: buildSowPrompt({
            workDetail: scenario.text,
            startDate: "2026-09-01",
            endDate: "2026-12-31",
          }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "sow_analysis", schema: SOW_RESPONSE_SCHEMA, strict: true },
      },
      temperature: 0.2,
    });

    usage.inputTokens += completion.usage?.prompt_tokens ?? 0;
    usage.outputTokens += completion.usage?.completion_tokens ?? 0;

    const milestones = completion.choices[0].message.parsed?.milestones ?? [];
    const dods = milestones.flatMap((milestone) => milestone.dods ?? []);
    return {
      id: scenario.id,
      title: scenario.title,
      durationMs: Date.now() - startedAt,
      milestones,
      dods,
      metrics: measureDods(dods),
      outOfScopeCandidates: findOutOfScopeCandidates(dods, scenario.text),
    };
  } catch (error) {
    console.error(`  [${scenario.id}] 실패: ${error.message}`);
    return { id: scenario.id, title: scenario.title, error: String(error.message ?? error) };
  }
}

function summarize(results, usage) {
  const ok = results.filter((result) => !result.error);
  const allDods = ok.flatMap((result) => result.dods);
  const metrics = measureDods(allDods);
  const targets = evaluateTargets(metrics);
  const price = PRICING[MODEL] ?? PRICING["gpt-4o-mini"];
  const estimatedCost =
    (usage.inputTokens / 1_000_000) * price.input + (usage.outputTokens / 1_000_000) * price.output;

  return {
    scenarios: results.length,
    succeeded: ok.length,
    failed: results.length - ok.length,
    totalDods: allDods.length,
    avgDodsPerScenario: ok.length ? Math.round((allDods.length / ok.length) * 10) / 10 : 0,
    avgDurationMs: ok.length ? Math.round(ok.reduce((sum, r) => sum + r.durationMs, 0) / ok.length) : 0,
    metrics,
    targets,
    outOfScopeCandidates: ok.flatMap((result) => result.outOfScopeCandidates ?? []),
    usage: { ...usage, estimatedCostUsd: Math.round(estimatedCost * 10000) / 10000 },
    allTargetsPassed: targets.every((target) => target.passed),
  };
}

function renderMarkdown(report, label, model) {
  const lines = [
    `# SOW 생성 평가 · ${label}`,
    "",
    `- 모델: \`${model}\` · 프롬프트: \`${SOW_PROMPT_VERSION}\``,
    `- 시나리오 ${report.succeeded}/${report.scenarios} 성공 · DoD 총 ${report.totalDods}개 (시나리오당 평균 ${report.avgDodsPerScenario}개)`,
    `- 평균 생성 시간 ${(report.avgDurationMs / 1000).toFixed(2)}초 · 추정 비용 $${report.usage.estimatedCostUsd}`,
    "",
    "## 지표",
    "",
    "| 지표 | 목표 | 측정값 | 달성 |",
    "| --- | ---: | ---: | :---: |",
    ...report.targets.map((target) => {
      const arrow = target.direction === "min" ? "≥" : "≤";
      return `| ${target.label} | ${arrow} ${target.target}% | ${target.value}% | ${target.passed ? "✅" : "❌"} |`;
    }),
    "",
    `**종합: ${report.allTargetsPassed ? "전 지표 달성" : "미달 지표 있음"}**`,
    "",
    "## 참고: 예전 지표와의 차이",
    "",
    `예전 벤치마크의 느슨한 정규식으로는 **${report.metrics.urlPathRateLegacy}%**, 실제 URL 경로 기준으로는 **${report.metrics.urlPathRate}%**입니다.`,
    `차이가 크다면 그만큼 \`CSV/Excel\`, \`ERP/CRM\` 같은 병기 표기가 URL로 잘못 집계되고 있었다는 뜻입니다.`,
  ];

  if (report.outOfScopeCandidates.length > 0) {
    lines.push(
      "",
      "## 원문 범위 이탈 후보 (사람 확인 필요)",
      "",
      "형태소 분석 없이 찾은 후보이므로 확정이 아닙니다.",
      "",
      ...report.outOfScopeCandidates.slice(0, 20).map((finding) => `- \`${finding.term}\` — ${finding.dod}`),
    );
  }
  return lines.join("\n");
}

function loadScenarios() {
  const file = path.join(ROOT, "sow_evaluations", "EXP_5_Example_Scenario.txt");
  const raw = fs.readFileSync(file, "utf8");
  return raw
    .split(/^={5,}\s*$/m)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 200)
    .map((text, index) => ({
      id: index + 1,
      title: text.split("\n")[0].slice(0, 80),
      text,
    }));
}

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

await main();
