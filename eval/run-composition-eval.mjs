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
 * `--runs N`은 같은 입력을 N번 돌려 평균과 범위를 함께 낸다. LLM 응답은 온도를
 * 0으로 두어도 실행마다 달라지므로, 단일 실행의 차이를 개선으로 읽으면 존재하지
 * 않는 진전을 보고하게 된다. 실제로 코드를 바꾸지 않은 두 실행이 45%와 60%로
 * 갈렸다. 범위를 함께 보아야 변화가 편차보다 큰지 판단할 수 있다.
 *
 * 사용법:
 *   npm run eval:composition -- --from eval/results/sow-<...>.json --limit 40 --runs 3
 */

import fs from "node:fs";
import path from "node:path";

import { analyzeDodContracts } from "@/lib/dod-contract-analyzer";
import { geminiModel } from "@/lib/llm/gemini";
import { applyAnswersToContract, extractContractPath } from "@/lib/dod-test-contract";
import { resolveDesign, unansweredRequirements } from "@/lib/dod-verification-state";
import { createMvpVerificationDefinition } from "@/lib/verification-test-spec";
import { composeVerificationAtoms } from "@/lib/verification-atom-composer";

const ROOT = process.cwd();
const args = parseArgs(process.argv.slice(2));
const LIMIT = Number(args.limit ?? 40);
const RUNS = Number(args.runs ?? 1);
const LABEL = args.label ?? "baseline";
const ANALYSIS_CHUNK = 20;

const items = loadItems();
console.log(`완료조건 ${items.length}개 · 모델 ${geminiModel()} · 반복 ${RUNS}회`);

const runs = [];
for (let run = 1; run <= RUNS; run += 1) {
  console.log(`\n── ${run}회차 ──`);
  runs.push(await runOnce());
}

const summary = summarize(runs);
const markdown = renderMarkdown(summary, runs);
console.log("\n" + markdown);

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outDir = path.join(ROOT, "eval", "results");
fs.mkdirSync(outDir, { recursive: true });
const jsonPath = path.join(outDir, `composition-${LABEL}-${stamp}.json`);
fs.writeFileSync(jsonPath, JSON.stringify({ label: LABEL, runs: RUNS, summary, detail: runs }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, `composition-${LABEL}-${stamp}.md`), markdown, "utf8");
console.log(`\n저장: ${path.relative(ROOT, jsonPath)}`);

// ───────────────────────────────────────────────────────────────────────────

async function runOnce() {
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
          answer:
            requirement.answer?.trim() || requirement.recommendedSuggestion || requirement.suggestions?.[0] || "",
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
  }
  console.log(`  계약 분석 ${analyzed.length}/${items.length}`);

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

  if (needsComposition.length > 0) {
    const composed = await composeVerificationAtoms(
      needsComposition.map((record) => ({
        description: record.description,
        contract: record.contract,
        // 질문이 만들어져 답을 받은 필드만 근거로 인정한다. 분석기가 스스로 채운
        // 값은 아무도 확인하지 않았으므로 화면 문구의 근거가 될 수 없다.
        answeredFields: (record.requirements ?? [])
          .filter((requirement) => requirement.answer?.trim())
          .map((requirement) => requirement.key),
      })),
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

  for (const record of records) {
    if (record.outcome === "analysis_failed") continue;
    record.status = resolveDesign({
      requirements: record.requirements ?? [],
      contract: record.contract,
      hasExecutableSpec: record.outcome === "preset" || record.outcome === "composed",
      startPath: record.startPath,
    }).status;
  }

  const total = records.length;
  const automationReady = records.filter((r) => r.status === "automation_ready").length;
  const rate = total === 0 ? 0 : Math.round((automationReady / total) * 1000) / 10;
  console.log(`  automation_ready ${automationReady}/${total} (${rate}%)`);

  return {
    total,
    automationReady,
    rate,
    byOutcome: tally(records.map((r) => r.outcome)),
    byRejectionReason: tally(records.filter((r) => r.outcome === "rejected").map((r) => r.reason)),
    byRejectionDetail: tally(records.filter((r) => r.outcome === "rejected").map((r) => normalizeDetail(r.detail))),
    records,
  };
}

function summarize(all) {
  const rates = all.map((run) => run.rate);
  const mean = Math.round((rates.reduce((sum, value) => sum + value, 0) / rates.length) * 10) / 10;
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  return {
    runs: all.length,
    total: all[0]?.total ?? 0,
    rates,
    meanRate: mean,
    minRate: min,
    maxRate: max,
    spread: Math.round((max - min) * 10) / 10,
    byRejectionDetail: mergeTallies(all.map((run) => run.byRejectionDetail)),
    byRejectionReason: mergeTallies(all.map((run) => run.byRejectionReason)),
    byOutcome: mergeTallies(all.map((run) => run.byOutcome)),
  };
}

function renderMarkdown(summary, all) {
  const lines = [
    `# 검수 가능성 평가 · ${LABEL}`,
    "",
    `완료조건 **${summary.total}개** · ${summary.runs}회 반복`,
    "",
    `**automation_ready 평균 ${summary.meanRate}%** (최소 ${summary.minRate}% ~ 최대 ${summary.maxRate}%, 폭 ${summary.spread}%p)`,
    "",
    summary.runs > 1
      ? `회차별: ${summary.rates.map((rate, index) => `${index + 1}회 ${rate}%`).join(" · ")}`
      : "회차가 1회뿐이므로 이 값은 편차와 구분되지 않는다. 변화를 판단하려면 `--runs 3` 이상으로 다시 측정할 것.",
    "",
    "## 경로별 분포 (전 회차 합계)",
    "",
    "| 결과 | 합계 |",
    "| --- | ---: |",
    ...Object.entries(summary.byOutcome)
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => `| ${outcomeLabel(key)} | ${count} |`),
  ];

  if (Object.keys(summary.byRejectionReason).length > 0) {
    lines.push(
      "",
      "## 조합 거부 사유 (전 회차 합계)",
      "",
      "| 사유 | 합계 | 뜻 |",
      "| --- | ---: | --- |",
      ...Object.entries(summary.byRejectionReason)
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => `| \`${key}\` | ${count} | ${reasonLabel(key)} |`),
      "",
      "### 거부 지점 (무엇을 고쳐야 하는지)",
      "",
      "| 지점 | 합계 |",
      "| --- | ---: |",
      ...Object.entries(summary.byRejectionDetail)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([key, count]) => `| ${key} | ${count} |`),
    );
  }

  if (all.length > 1) {
    lines.push(
      "",
      "## 판단 기준",
      "",
      `이번 측정의 편차 폭은 ${summary.spread}%p다. 앞으로 어떤 변경의 효과를 주장하려면 평균이 이 폭보다 뚜렷하게 움직여야 한다.`,
    );
  }
  return lines.join("\n");
}

function outcomeLabel(key) {
  return (
    {
      preset: "고정 프리셋으로 자동화",
      composed: "atom 조합으로 자동화",
      rejected: "조합 실패 → 사람 확인",
      clarification_required: "질문 미해결",
      analysis_failed: "계약 분석 실패",
      pending_composition: "조합 미수행(오류)",
    }[key] ?? key
  );
}

function reasonLabel(key) {
  return (
    {
      llm_declined: "모델이 자동화 불가로 판단 (§21.4 정상 결론일 수 있음)",
      schema_rejected: "엄격 파서 불통과 — 조합이 실행 가능한 형태가 아님",
      ungrounded_text: "완료조건에 없는 문구를 기대 결과로 지어냄",
      llm_failed: "LLM 호출 자체 실패",
      no_api_key: "API 키 없음",
    }[key] ?? key
  );
}

function normalizeDetail(detail) {
  if (!detail) return "(미기록)";
  // 개별 값이 아니라 유형별로 묶는다.
  // ref 값은 닫힌 어휘라 그대로 보여도 안전하고, 무엇이 잘못됐는지 알려면 필요하다.
  // 자유 입력값(literal)만 묶는다.
  return detail
    .replace(/valueKind=literal value=.*/, "valueKind=literal value=…")
    .replace(/근거 없는 문구: .*/, "근거 없는 문구")
    .trim();
}

function tally(values) {
  const counts = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}

function mergeTallies(tallies) {
  const merged = {};
  for (const counts of tallies) {
    for (const [key, value] of Object.entries(counts)) merged[key] = (merged[key] ?? 0) + value;
  }
  return merged;
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

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index].startsWith("--")) parsed[argv[index].slice(2)] = argv[index + 1];
  }
  return parsed;
}
