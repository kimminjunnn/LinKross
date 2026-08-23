/**
 * 프리셋 A(사내 비품 대여)의 확정 SOW를 기존 프로젝트에 적용한다.
 *
 * 시연용 프리셋이라 SOW 생성 결과를 매번 새로 뽑지 않고 확정본
 * (`eval/presets/asset-rental.sow.json`)을 쓴다. 다만 검수 계약과 실행 스펙은
 * 하드코딩하지 않고 프로덕션과 같은 파이프라인을 그대로 태운다
 * (`src/lib/backend/sow.ts`의 `upsertCriteriaForMilestone`과 같은 순서).
 *
 *   analyzeDodContracts → 추천 답변 채택 → applyAnswersToContract
 *   → createMvpVerificationDefinition(프리셋 우선) → composeVerificationAtoms
 *   → resolveDesign → completion_criteria.test_spec 저장
 *
 * 실행:
 *   node --experimental-strip-types --import ./scripts/register-test-hooks.mjs \
 *     --import ./eval/load-env.mjs eval/presets/apply-asset-rental-sow.mjs [--dry]
 */
import fs from "node:fs";

import { analyzeDodContracts } from "@/lib/dod-contract-analyzer";
import { applyAnswersToContract, extractContractPath } from "@/lib/dod-test-contract";
import { resolveDesign, unansweredRequirements } from "@/lib/dod-verification-state";
import { createMvpVerificationDefinition } from "@/lib/verification-test-spec";
import { composeVerificationAtoms } from "@/lib/verification-atom-composer";
import { generateManualCheckGuidance } from "@/lib/verification-guidance";

const PROJECT_ID = "057f6e3a-f141-486f-9633-ba8a3d0d144c";
const DESIGN_VERSION = 1;
const DRY = process.argv.includes("--dry");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

async function rest(path, init = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} → ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const sow = JSON.parse(fs.readFileSync("eval/presets/asset-rental.sow.json", "utf8"));
const workDetail = fs.readFileSync("eval/presets/asset-rental.txt", "utf8");
const milestones = sow.results[0].milestones;

// ── 1. 검수 설계 파이프라인 ────────────────────────────────────────────────
async function designMilestone(milestone) {
  const analyses = await analyzeDodContracts(
    milestone.dods.map((dod) => ({ milestoneTitle: milestone.title, dod })),
  );

  const entries = milestone.dods.map((dod, i) => {
    const analysis = analyses[i];
    if (!analysis) return { dod, failed: true };
    // 기본 경로의 발주자를 모사한다: 추천 선택지를 그대로 채택한다.
    const requirements = analysis.requirements.map((r) => ({
      ...r,
      answer: r.answer?.trim() || r.recommendedSuggestion || r.suggestions?.[0] || "",
    }));
    return { dod, requirements, contract: applyAnswersToContract(analysis.testContract, requirements) };
  });

  const results = new Array(entries.length);
  const pending = [];

  entries.forEach((entry, i) => {
    if (entry.failed || unansweredRequirements(entry.requirements).length > 0) {
      results[i] = { method: "manual", spec: {}, requirements: entry.requirements ?? [], contract: entry.contract, description: entry.dod };
      return;
    }
    const startPath = entry.contract.startPath ?? extractContractPath(entry.dod) ?? undefined;
    const description = extractContractPath(entry.dod) || !startPath ? entry.dod : `\`${startPath}\`에서 ${entry.dod}`;
    const preset = createMvpVerificationDefinition(description);
    if (preset.verificationMethod === "automated_e2e") {
      results[i] = { method: "automated_e2e", spec: preset.testSpec, requirements: entry.requirements, contract: entry.contract, description, startPath };
      return;
    }
    results[i] = { method: "manual", spec: {}, requirements: entry.requirements, contract: entry.contract, description, startPath };
    pending.push(i);
  });

  if (pending.length > 0) {
    const composed = await composeVerificationAtoms(
      pending.map((i) => ({
        description: results[i].description,
        contract: results[i].contract,
        answeredFields: (results[i].requirements ?? []).filter((r) => r.answer?.trim()).map((r) => r.key),
      })),
    );
    const stillManual = [];
    pending.forEach((i, k) => {
      if (composed[k]?.spec) results[i] = { ...results[i], method: "automated_e2e", spec: composed[k].spec };
      else stillManual.push(i);
    });
    if (stillManual.length > 0) {
      const guidances = await generateManualCheckGuidance(stillManual.map((i) => results[i].description));
      stillManual.forEach((i, k) => {
        const g = guidances[k];
        if (g) results[i] = { ...results[i], spec: { version: 1, kind: "manual_guidance", ...g }, guidance: g };
      });
    }
  }

  return results.map((r) => {
    const design = resolveDesign({
      requirements: r.requirements ?? [],
      contract: r.contract,
      hasExecutableSpec: r.method === "automated_e2e",
      startPath: r.contract?.startPath ?? r.startPath,
      ...(r.guidance ? { manualGuidance: r.guidance } : {}),
    }).design;

    // 상태와 검수 방식이 어긋나면 실행되지 않을 항목이 자동으로 저장된다.
    const shouldAutomate = design.status === "automation_ready";
    const method = shouldAutomate ? "automated_e2e" : "manual";
    const spec = shouldAutomate ? r.spec : (r.guidance ? r.spec : {});

    const persistedDesign = {
      version: DESIGN_VERSION,
      status: design.status,
      ...(design.startPath ? { startPath: design.startPath } : {}),
      ...(design.testHint ? { testHint: design.testHint } : {}),
      ...(design.question ? { question: design.question } : {}),
      ...(design.suggestions ? { suggestions: design.suggestions } : {}),
      ...(design.recommendedSuggestion ? { recommendedSuggestion: design.recommendedSuggestion } : {}),
      ...(design.conversation ? { conversation: design.conversation } : {}),
      ...(design.requirements ? { requirements: design.requirements } : {}),
      ...(design.testContract ? { testContract: design.testContract } : {}),
      questionSetLocked: design.questionSetLocked === true,
      humanReviewAccepted: design.humanReviewAccepted === true,
      message: design.message ?? "검수 설계 상태를 확인해 주세요.",
    };
    return { description: r.description, method, testSpec: { ...spec, verificationDesign: persistedDesign }, status: design.status };
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 조직 TPM 한도(30k)에 걸리면 잠시 쉬었다 다시 시도한다. */
async function withRetry(label, fn, attempts = 4) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= attempts || error?.status !== 429) throw error;
      const wait = 30_000 * attempt;
      console.log(`\n    ${label}: 레이트리밋. ${wait / 1000}초 후 재시도 (${attempt}/${attempts - 1})`);
      await sleep(wait);
    }
  }
}

const designed = [];
for (const m of milestones) {
  if (designed.length > 0) await sleep(20_000);
  process.stdout.write(`  ${m.code} 검수 설계 중 (DoD ${m.dods.length}개)… `);
  const rows = await withRetry(m.code, () => designMilestone(m));
  const auto = rows.filter((r) => r.method === "automated_e2e").length;
  console.log(`자동 ${auto} · 확인 필요 ${rows.length - auto}`);
  designed.push({ milestone: m, rows });
}

if (DRY) {
  fs.writeFileSync("eval/results/.preset-a-designed.json", JSON.stringify(designed, null, 2));
  console.log("\n--dry: DB에 쓰지 않고 eval/results/.preset-a-designed.json 에만 저장했습니다.");
  process.exit(0);
}

// ── 2. 기존 상태 백업 ──────────────────────────────────────────────────────
const [sowRow] = await rest(`sow_versions?project_id=eq.${PROJECT_ID}&select=*`);
const oldMilestones = await rest(`milestones?project_id=eq.${PROJECT_ID}&select=*`);
const oldCriteria = await rest(`completion_criteria?project_id=eq.${PROJECT_ID}&select=*`);
const backupPath = `eval/results/.preset-a-db-backup-${new Date().toISOString().slice(0, 19).replace(/[:]/g, "-")}.json`;
fs.writeFileSync(backupPath, JSON.stringify({ sowRow, oldMilestones, oldCriteria }, null, 2));
console.log(`\n백업: ${backupPath} (마일스톤 ${oldMilestones.length} · 완료조건 ${oldCriteria.length})`);

if (sowRow.status !== "draft") throw new Error(`SOW가 draft가 아닙니다(${sowRow.status}). 승인된 버전은 덮어쓰지 않습니다.`);

// ── 3. 교체 ────────────────────────────────────────────────────────────────
await rest(`completion_criteria?project_id=eq.${PROJECT_ID}`, { method: "DELETE" });
await rest(`milestones?project_id=eq.${PROJECT_ID}`, { method: "DELETE" });
console.log("기존 마일스톤·완료조건 삭제 완료");

let position = 0;
for (const { milestone, rows } of designed) {
  position += 1;
  const [start, end] = milestone.period.split(" - ").map((d) => `20${d.replaceAll(".", "-")}`);
  const [inserted] = await rest("milestones", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      project_id: PROJECT_ID,
      sow_version_id: sowRow.id,
      code: milestone.code,
      title: milestone.title,
      description: `기간: ${milestone.period}`,
      start_date: start,
      end_date: end,
      amount: Number(milestone.amount),
      currency: "USD",
      position,
      status: "scheduled",
    }),
  });
  await rest("completion_criteria", {
    method: "POST",
    body: JSON.stringify(
      rows.map((r, i) => ({
        project_id: PROJECT_ID,
        sow_version_id: sowRow.id,
        milestone_id: inserted.id,
        kind: "definition_of_done",
        description: r.description,
        verification_method: r.method,
        is_required: true,
        position: i + 1,
        test_spec: r.testSpec,
      })),
    ),
  });
  console.log(`  ${milestone.code} 삽입 완료 · ${rows.length}건 · ${milestone.amount} USD`);
}

// ── 4. SOW 본문 갱신 ───────────────────────────────────────────────────────
await rest(`sow_versions?id=eq.${sowRow.id}`, {
  method: "PATCH",
  body: JSON.stringify({
    content: { ...sowRow.content, workDetailKo: workDetail, budget: "9000", startDateInput: "2026-08-22", endDateInput: "2026-09-12" },
  }),
});
console.log("SOW 본문(workDetailKo) 갱신 완료");
console.log(`\n완료. SOW 화면: /company/projects/${PROJECT_ID}/sow`);
