/**
 * 검수 가능성 평가 러너 (B단계).
 *
 * "DoD가 실제로 실행 가능한 테스트 스펙이 되는 비율"을 잰다. CLAUDE.md §13이
 * 자동 판정 정확도 90%를 목표로 걸어두었지만 이 값을 재는 코드가 없었다.
 *
 * 프로덕션 저장 경로(`src/lib/backend/sow.ts`의 `upsertCriteriaForMilestone`)와
 * 같은 순서를 그대로 따른다. 순서를 흉내내지 않으면 또 다른 것을 측정하게 되고,
 * 그것이 기존 벤치마크가 실패한 방식이다.
 *
 *   1. analyzeDodContracts       — DoD → 검수 계약 + 질문 세트
 *   2. 질문 자동 응답             — recommendedSuggestion 채택 (기본 경로 사용자 모사)
 *   3. applyAnswersToContract    — 결정적 병합, LLM 없음
 *   4. createMvpVerificationDefinition — 고정 프리셋 우선 (§21.5 v1 폴백)
 *   5. composeVerificationAtoms  — 프리셋 미매칭 시 atom 조합 + 엄격 파서
 *   6. resolveDesign             — 상태 확정
 *
 * 사용법:
 *   node --experimental-strip-types --conditions=react-server \
 *     --import ./scripts/register-test-hooks.mjs \
 *     eval/run-composition-eval.mjs --from eval/results/sow-<...>.json [--limit 40]
 */

import fs from "node:fs";
import path from "node:path";

import { analyzeDodContracts } from "@/lib/dod-contract-analyzer";
import { applyAnswersToContract, extractContractPath } from "@/lib/dod-test-contract";
import { resolveDesign, unansweredRequirements } from "@/lib/dod-verification-state";
import { createMvpVerificationDefinition } from "@/lib/verification-test-spec";
import { composeVerificationAtoms } from "@/lib/verification-atom-composer";

const ROOT = process.cwd();
loadEnv(path.join(ROOT, ".env.local"));

const args = parseArgs(process.argv.slice(2));
const LIMIT = Number(args.limit ?? 40);
const LABEL = args.label ?? "baseline";
const ANALYSIS_CHUNK = 20;

const items = loadItems();
console.log(`완료조건 ${items.length}개 · 모델 ${process.env.OPENAI_MODEL ?? "gpt-4o"}`);

// ── 1~3. 계약 분석과 질문 자동 응답 ────────────────────────────────────────
const analyzed = [];
for (let offset = 0; offset < items.length; offset += ANALYSIS_CHUNK) {
  const chunk = items.slice(offset, offset + ANALYSIS_CHUNK);
  try {
    const analyses = await analyzeDodContracts(
      chunk.map((item) => ({ milestoneTitle: item.milestoneTitle, dod: item.dod })),
    );
    chunk.forEach((item, index) => {
      const analysis = analyses[index];
      if (!analysis) {
        analyzed.push({ ...item, failure: "analysis_missing" });
        return;
      }
      // 기본 경로의 사용자를 모사한다: 추천 선택지를 그대로 채택한다.
      const answered = analysis.requirements.map((requirement) => ({
        ...requirement,
        answer: requirement.answer?.trim() || requirement.recommendedSuggestion || requirement.suggestions?.[0] || "",
      }));
      analyzed.push({
        ...item,
        revisedDod: analysis.revisedDod,
        requirements: answered,
        questionCount: analysis.requirements.length,
        contract: applyAnswersToContract(analysis.testContract, answered),
      });
    });
  } catch (error) {
    console.error(`  분석 실패(${offset}~): ${error.message}`);
    chunk.forEach((item) => analyzed.push({ ...item, failure: "analysis_error" }));
  }
  console.log(`  계약 분석 ${Math.min(offset + ANALYSIS_CHUNK, items.length)}/${items.length}`);
}

// ── 4. 프리셋 우선 ─────────────────────────────────────────────────────────
const records = [];
const needsComposition = [];
for (const entry of analyzed) {
  if (entry.failure) {
    records.push({ ...entry, outcome: "analysis_failed" });
    continue;
  }
  if (unansweredRequirements(entry.requirements).length > 0) {
    records.push({ ...entry, outcome: "clarification_required" });
    continue;
  }
  const startPath = entry.contract.startPath ?? extractContractPath(entry.dod) ?? undefined;
  const description =
    extractContractPath(entry.dod) || !startPath ? entry.dod : `\`${startPath}\`에서 ${entry.dod}`;
  const preset = createMvpVerificationDefinition(description);
  if (preset.verificationMethod === "automated_e2e") {
    records.push({ ...entry, description, startPath, outcome: "preset", spec: preset.testSpec });
    continue;
  }
  const record = { ...entry, description, startPath, outcome: "pending_composition" };
  records.push(record);
  needsComposition.push(record);
}

// ── 5. atom 조합 ───────────────────────────────────────────────────────────
console.log(`  프리셋 매칭 ${records.filter((r) => r.outcome === "preset").length}개 · 조합 시도 ${needsComposition.length}개`);
if (needsComposition.length > 0) {
  const composed = await composeVerificationAtoms(
    needsComposition.map((record) => ({ description: record.description, contract: record.contract })),
  );
  needsComposition.forEach((record, index) => {
    const outcome = composed[index];
    if (outcome?.spec) {
      record.outcome = "composed";
      record.spec = outcome.spec;
    } else {
      record.outcome = "rejected";
      record.reason = outcome?.reason ?? "unknown";
      record.detail = outcome?.detail;
    }
  });
}

// ── 6. 상태 확정 ───────────────────────────────────────────────────────────
for (const record of records) {
  if (record.outcome === "analysis_failed") continue;
  const hasExecutableSpec = record.outcome === "preset" || record.outcome === "composed";
  record.status = resolveDesign({
    requirements: record.requirements ?? [],
    contract: record.contract,
    hasExecutableSpec,
    startPath: record.startPath,
  }).status;
}

// ── 리포트 ─────────────────────────────────────────────────────────────────
const total = records.length;
const automationReady = records.filter((r) => r.status === "automation_ready").length;
const byOutcome = tally(records.map((r) => r.outcome));
const byReason = tally(records.filter((r) => r.outcome === "rejected").map((r) => r.reason));
const byDetail = tally(records.filter((r) => r.outcome === "rejected").map((r) => normalizeDetail(r.detail)));
const pct = (value) => (total === 0 ? 0 : Math.round((value / total) * 1000) / 10);

const report = {
  label: LABEL,
  total,
  automationReady,
  automationReadyRate: pct(automationReady),
  byOutcome,
  byRejectionReason: byReason,
  byRejectionDetail: byDetail,
  avgQuestionsPerDod:
    total === 0 ? 0 : Math.round((records.reduce((sum, r) => sum + (r.questionCount ?? 0), 0) / total) * 10) / 10,
};

const lines = [
  `# 검수 가능성 평가 · ${LABEL}`,
  "",
  `완료조건 **${total}개** 중 실행 가능한 스펙이 만들어진 것: **${automationReady}개 (${report.automationReadyRate}%)**`,
  `완료조건당 평균 질문 수: ${report.avgQuestionsPerDod}개`,
  "",
  "## 경로별 분포",
  "",
  "| 결과 | 개수 | 비율 |",
  "| --- | ---: | ---: |",
  ...Object.entries(byOutcome).map(([key, count]) => `| ${outcomeLabel(key)} | ${count} | ${pct(count)}% |`),
];

if (Object.keys(byReason).length > 0) {
  lines.push(
    "",
    "## 조합 거부 사유",
    "",
    "어휘 부족(§21.3)과 스키마 오류를 구분하기 위한 분류다.",
    "",
    "| 사유 | 개수 | 뜻 |",
    "| --- | ---: | --- |",
    ...Object.entries(byReason).map(([key, count]) => `| \`${key}\` | ${count} | ${reasonLabel(key)} |`),
    "",
    "### 거부 지점 (무엇을 고쳐야 하는지)",
    "",
    "| 지점 | 개수 |",
    "| --- | ---: |",
    ...Object.entries(byDetail)
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => `| ${key} | ${count} |`),
  );
}

function normalizeDetail(detail) {
  if (!detail) return "(미기록)";
  // 개별 값이 아니라 유형별로 묶는다.
  return detail
    .replace(/targetValue=.*/, "targetValue=…")
    .replace(/근거 없는 문구: .*/, "근거 없는 문구")
    .trim();
}

const markdown = lines.join("\n");
console.log("\n" + markdown);

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outDir = path.join(ROOT, "eval", "results");
fs.mkdirSync(outDir, { recursive: true });
const jsonPath = path.join(outDir, `composition-${LABEL}-${stamp}.json`);
fs.writeFileSync(jsonPath, JSON.stringify({ report, records }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, `composition-${LABEL}-${stamp}.md`), markdown, "utf8");
console.log(`\n저장: ${path.relative(ROOT, jsonPath)}`);

function outcomeLabel(key) {
  return {
    preset: "고정 프리셋으로 자동화",
    composed: "atom 조합으로 자동화",
    rejected: "조합 실패 → 사람 확인",
    clarification_required: "질문 미해결",
    analysis_failed: "계약 분석 실패",
    pending_composition: "조합 미수행(오류)",
  }[key] ?? key;
}

function reasonLabel(key) {
  return {
    llm_declined: "모델이 자동화 불가로 판단 (§21.4 정상 결론일 수 있음)",
    schema_rejected: "엄격 파서 불통과 — 조합이 실행 가능한 형태가 아님",
    ungrounded_text: "완료조건에 없는 문구를 기대 결과로 지어냄",
    llm_failed: "LLM 호출 자체 실패",
    no_api_key: "API 키 없음",
  }[key] ?? key;
}

function tally(values) {
  const counts = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}

function loadItems() {
  if (args.from) {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, args.from), "utf8"));
    const collected = [];
    for (const result of data.results ?? []) {
      for (const milestone of result.milestones ?? []) {
        for (const dod of milestone.dods ?? []) {
          collected.push({ scenarioId: result.id, milestoneTitle: milestone.title, dod });
        }
      }
    }
    return collected.slice(0, LIMIT);
  }
  const file = args.dods ?? "eval/fixtures-dods.json";
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8")).slice(0, LIMIT);
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
